import confetti from "canvas-confetti";

const STORAGE_KEY = "generala.club.v1";

const categories = [
  ...[1, 2, 3, 4, 5, 6].map((number) => ({ id: `n${number}`, label: `${number}`, short: `${number}`, type: "number", number })),
  { id: "escalera", label: "Escalera", short: "Escalera", options: [{ value: 0, label: "Tachada" }, { value: 20, label: "Armada" }, { value: 25, label: "Servida" }] },
  { id: "full", label: "Full", short: "Full", options: [{ value: 0, label: "Tachado" }, { value: 30, label: "Armado" }, { value: 35, label: "Servido" }] },
  { id: "poker", label: "Póker", short: "Póker", options: [{ value: 0, label: "Tachado" }, { value: 40, label: "Armado" }, { value: 45, label: "Servido" }] },
  { id: "generala", label: "Generala", short: "Generala", options: [{ value: 0, label: "Tachada" }, { value: 50, label: "Generala" }] },
  { id: "doble", label: "Doble generala", short: "Doble", options: [{ value: 0, label: "Tachada" }, { value: 100, label: "Doble generala" }] }
];

const defaultState = () => ({ players: [], games: [], currentGame: null });
let state = loadState();
let view = "game";
let selectedCell = null;
let dialog = null;
let toastTimer = null;
let storageError = false;
let focusReturn = null;

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && Array.isArray(data.players) && Array.isArray(data.games) ? data : defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageError = false;
    return true;
  } catch {
    storageError = true;
    return false;
  }
}

function uid() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]); }
function formatDate(iso) { return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)); }
function totalFor(scores) { return categories.reduce((sum, category) => sum + (Number(scores?.[category.id]) || 0), 0); }
function completeCount(game) { return game.playerIds.reduce((sum, id) => sum + categories.filter((category) => game.scores[id]?.[category.id] !== null && game.scores[id]?.[category.id] !== undefined).length, 0); }
function announce(message) { document.querySelector("#live-region").textContent = message; }

function getPlayer(id) { return state.players.find((player) => player.id === id); }

function showToast(message) {
  clearTimeout(toastTimer);
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.setAttribute("role", "status");
  element.textContent = message;
  document.body.appendChild(element);
  toastTimer = setTimeout(() => element.remove(), 2600);
}

function triggerWinConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#cbea64", "#c73e5a", "#3b2854", "#ffd166", "#06d6a0", "#118ab2", "#ffffff"];

  confetti({
    particleCount: 75,
    spread: 90,
    origin: { y: 0.6 },
    colors,
    zIndex: 1000,
    disableForReducedMotion: true
  });

  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 1000,
      disableForReducedMotion: true
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 1000,
      disableForReducedMotion: true
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  requestAnimationFrame(frame);
}

function navTemplate() {
  const items = [
    ["game", "⚄", "Partida"],
    ["history", "▤", "Historial"],
    ["players", "★", "Jugadores"]
  ];
  return items.map(([id, icon, label]) => `<button class="nav-item ${view === id ? "active" : ""}" data-nav="${id}" aria-current="${view === id ? "page" : "false"}"><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</button>`).join("");
}

function shell(content) {
  return `<div class="app-shell ${view === "game" && state.currentGame?.started ? "app-shell--active-game" : ""}">
    <header class="topbar"><div class="topbar-inner">
      <div class="brand"><div class="brand-mark" aria-hidden="true">⚄</div><div class="brand-copy"><strong>GENERALA</strong><span>La cuenta clara, la mesa contenta.</span></div></div>
      <nav class="desktop-nav" aria-label="Principal">${navTemplate()}</nav>
    </div></header>
    ${storageError ? `<p class="storage-warning" role="alert">No pudimos guardar en este dispositivo. La partida seguirá abierta, pero podría perderse al cerrar la app.</p>` : ""}
    <main class="page ${view === "game" && !state.currentGame?.started ? "page--setup" : ""} ${view === "game" && state.currentGame?.started ? "page--game" : ""}">${content}</main>
    <nav class="bottom-nav" aria-label="Principal">${navTemplate()}</nav>
    ${selectedCell ? scoreSheetTemplate() : ""}
    ${dialog ? dialogTemplate() : ""}
  </div>`;
}

function render() {
  const app = document.querySelector("#app");
  const content = view === "game" ? (state.currentGame?.started ? gameTemplate() : setupTemplate()) : view === "history" ? historyTemplate() : playersTemplate();
  app.innerHTML = shell(content);
  const overlayOpen = Boolean(selectedCell || dialog);
  document.querySelectorAll(".topbar, .storage-warning, main, .bottom-nav").forEach((element) => { element.inert = overlayOpen; });
}

function restoreOverlayFocus() {
  const target = focusReturn;
  focusReturn = null;
  if (!target) return;
  requestAnimationFrame(() => document.querySelector(`[data-score-player="${target.playerId}"][data-score-category="${target.categoryId}"]`)?.focus());
}

function setupTemplate() {
  const selected = state.currentGame?.playerIds || [];
  const available = state.players.filter((player) => !selected.includes(player.id));
  return `<section class="setup-stage">
    <div class="setup-heading"><span class="kicker">Nueva partida</span><h1>¿Quién se sienta a la mesa?</h1><p class="lede">Sumá entre 2 y 8 jugadores. Los nombres quedan guardados para la próxima revancha.</p></div>
    <form class="player-builder" id="setup-form">
      <label for="player-name">Nombre del jugador</label>
      <div class="add-player-row"><input class="text-input" id="player-name" maxlength="24" autocomplete="off" placeholder="Ej. Abu, Sofi, Martín"><button class="button" type="submit" aria-label="Agregar jugador">Agregar</button></div>
      <div class="player-list" id="selected-players">${selected.length ? selected.map((id, i) => `<div class="player-chip"><span class="number">${i + 1}</span><strong>${escapeHtml(getPlayer(id)?.name || "Jugador")}</strong><button type="button" data-remove-player="${id}" aria-label="Quitar a ${escapeHtml(getPlayer(id)?.name || "jugador")}">×</button></div>`).join("") : `<div class="empty-builder">Todavía no hay jugadores en esta mesa.</div>`}</div>
      ${available.length ? `<div class="suggestions"><p>Jugadores habituales</p><div class="suggestion-list">${available.map((player) => `<button class="suggestion" type="button" data-add-existing="${player.id}">+ ${escapeHtml(player.name)}</button>`).join("")}</div></div>` : ""}
      <button class="button blue" type="button" data-start-game ${selected.length < 2 ? "disabled" : ""} style="width:100%;margin-top:16px">Tirar los dados</button>
    </form>
  </section>`;
}

function gameTemplate() {
  const game = state.currentGame;
  const totals = game.playerIds.map((id) => totalFor(game.scores[id]));
  const max = Math.max(...totals);
  const done = completeCount(game);
  const target = game.playerIds.length * categories.length;
  return `<section>
    <div class="game-head">
      <div class="game-hud-copy"><h1 class="sr-only">Partida en curso</h1><span class="kicker game-status">Partida</span><p class="game-meta"><strong>${done}</strong><span>/${target}</span><small>${game.playerIds.length} jugadores</small></p></div>
      <div class="game-head-actions"><button class="icon-button" data-new-game aria-label="Abandonar y comenzar otra partida">↻</button><button class="button game-finish" data-finish-game ${done < target ? "disabled" : ""}><span aria-hidden="true">✓</span> Finalizar</button></div>
    </div>
    <div class="score-wrap"><div class="score-scroll" tabindex="0" aria-label="Tanteador desplazable">
      <table class="score-table"><thead><tr><th scope="col">Jugada</th>${game.playerIds.map((id, index) => { const player = getPlayer(id); return `<th scope="col">${escapeHtml(player?.name || `Jugador ${index + 1}`)}${totals[index] === max && max > 0 ? `<span class="leader-crown">★ lidera</span>` : ""}</th>`; }).join("")}</tr></thead>
      <tbody>${categories.map((category) => `<tr><th scope="row">${escapeHtml(category.label)}</th>${game.playerIds.map((id) => { const value = game.scores[id]?.[category.id]; const isActive = selectedCell?.playerId === id && selectedCell?.categoryId === category.id; return `<td><button class="score-cell ${value === null || value === undefined ? "empty" : ""} ${isActive ? "active" : ""}" data-score-player="${id}" data-score-category="${category.id}" aria-label="${escapeHtml(category.label)} de ${escapeHtml(getPlayer(id)?.name || "jugador")}: ${value ?? "sin cargar"}">${value ?? "·"}</button></td>`; }).join("")}</tr>`).join("")}</tbody>
      <tfoot><tr><th scope="row">TOTAL</th>${game.playerIds.map((id) => `<td><span class="total-value">${totalFor(game.scores[id])}</span></td>`).join("")}</tr></tfoot></table>
    </div><p class="table-hint">Tocá un casillero para cargar o corregir el puntaje.</p></div>
  </section>`;
}

function scoreOptions(category, playerId) {
  if (category.type === "number") return Array.from({ length: 6 }, (_, count) => ({ value: count * category.number, label: count === 0 ? "Tachado" : `${count} dado${count > 1 ? "s" : ""}` }));
  if (category.id === "doble" && !state.currentGame.scores[playerId]?.generala) return [{ value: 0, label: "Sin generala previa" }];
  return category.options;
}

function scoreSheetTemplate() {
  const category = categories.find((item) => item.id === selectedCell.categoryId);
  const player = getPlayer(selectedCell.playerId);
  const current = state.currentGame.scores[selectedCell.playerId]?.[selectedCell.categoryId];
  return `<div class="sheet-backdrop" data-close-sheet></div><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading"><div class="sheet-grab"></div>
    <div class="sheet-title"><div><h2 id="sheet-heading">${escapeHtml(category.label)} · ${escapeHtml(player?.name || "Jugador")}</h2><p>${current === null || current === undefined ? "Elegí el resultado de la tirada" : `Puntaje actual: ${current}`}</p></div><button class="icon-button" data-close-sheet aria-label="Cerrar">×</button></div>
    <div class="score-options">${scoreOptions(category, selectedCell.playerId).map((option) => `<button class="score-option ${option.value === 0 ? "foul" : ""}" data-set-score="${option.value}"><strong>${option.value}</strong><span>${escapeHtml(option.label)}</span></button>`).join("")}</div>
    ${category.id === "doble" && !state.currentGame.scores[selectedCell.playerId]?.generala ? `<p class="sheet-note">La doble generala requiere una Generala cargada previamente.</p>` : ""}
  </section>`;
}

function historyTemplate() {
  const games = [...state.games].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
  return `<section><div class="section-head"><span class="kicker">El libro del club</span><h1>Historial de partidas</h1><p class="lede">Cada resultado queda guardado en este dispositivo.</p></div>
    ${games.length ? `<div class="history-list">${games.map((game) => { const scores = game.playerIds.map((id) => ({ id, total: totalFor(game.scores[id]) })).sort((a,b) => b.total-a.total); const winnerTotal = scores[0]?.total; const winners = scores.filter((score) => score.total === winnerTotal); return `<article class="history-item" data-history-id="${game.id}"><button class="history-summary" data-toggle-history="${game.id}" aria-expanded="false"><div><span class="winner-badge">★ ${winners.map((winner) => escapeHtml(getPlayer(winner.id)?.name || "Jugador")).join(" y ")}</span><span class="date">${formatDate(game.finishedAt)} · ${game.playerIds.length} jugadores</span><span class="history-toggle-copy">Ver planilla ▾</span></div><strong>${winnerTotal} pts</strong></button><div class="history-scores">${scores.map((score) => `<div class="history-score"><span>${escapeHtml(getPlayer(score.id)?.name || "Jugador")}</span><strong>${score.total} pts</strong></div>`).join("")}<div class="history-board"><table><thead><tr><th>Jugada</th>${game.playerIds.map((id) => `<th>${escapeHtml(getPlayer(id)?.name || "Jugador")}</th>`).join("")}</tr></thead><tbody>${categories.map((category) => `<tr><th>${escapeHtml(category.label)}</th>${game.playerIds.map((id) => `<td>${game.scores[id]?.[category.id] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody><tfoot><tr><th>Total</th>${game.playerIds.map((id) => `<td>${totalFor(game.scores[id])}</td>`).join("")}</tr></tfoot></table></div></div><div class="history-actions"><button class="text-danger" data-delete-game="${game.id}">Eliminar partida</button></div></article>`; }).join("")}</div>` : `<div class="empty-state"><span class="empty-die">⚄</span><h2>La cartelera está en blanco</h2><p>Terminá una partida y su resultado aparecerá acá.</p><button class="button" data-nav="game">Empezar una partida</button></div>`}
  </section>`;
}

function buildStats() {
  return state.players.map((player) => {
    const games = state.games.filter((game) => game.playerIds.includes(player.id));
    const totals = games.map((game) => totalFor(game.scores[player.id]));
    let wins = 0;
    games.forEach((game) => { const all = game.playerIds.map((id) => totalFor(game.scores[id])); if (totalFor(game.scores[player.id]) === Math.max(...all)) wins += 1; });
    const points = totals.reduce((sum, score) => sum + score, 0);
    const generalas = games.reduce((sum, game) => sum + (Number(game.scores[player.id]?.generala) > 0 ? 1 : 0) + (Number(game.scores[player.id]?.doble) > 0 ? 1 : 0), 0);
    return { ...player, games: games.length, wins, points, average: games.length ? Math.round(points / games.length) : 0, best: totals.length ? Math.max(...totals) : 0, generalas };
  }).sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name));
}

function playersTemplate() {
  const stats = buildStats();
  const gamesCount = state.games.length;
  const totalPoints = stats.reduce((sum, player) => sum + player.points, 0);
  const totalGeneralas = stats.reduce((sum, player) => sum + player.generalas, 0);
  return `<section><div class="section-head"><span class="kicker">Ranking local</span><h1>Jugadores del club</h1><p class="lede">Victorias, puntos y mejores marcas de todas las partidas guardadas.</p></div>
    <div class="stats-strip"><div class="stat-main"><strong>${stats.length}</strong><span>jugadores</span></div><div class="stat-main"><strong>${gamesCount}</strong><span>partidas</span></div><div class="stat-main"><strong>${totalPoints}</strong><span>puntos anotados</span></div><div class="stat-main"><strong>${totalGeneralas}</strong><span>generalas</span></div></div>
    ${stats.length ? `<div class="ranking"><div class="ranking-head"><span>#</span><span>Jugador</span><span>Ganó</span><span>Puntos</span></div>${stats.map((player, index) => `<div class="ranking-row"><span class="rank-number">${index + 1}</span><div class="ranking-name"><strong>${escapeHtml(player.name)}</strong><span>${player.games} partidas · mejor ${player.best} · prom. ${player.average}</span></div><span class="ranking-value">${player.wins}</span><span class="ranking-value">${player.points}</span></div>`).join("")}</div>` : `<div class="empty-state"><span class="empty-die">⚄</span><h2>Faltan nombres en la mesa</h2><p>Los jugadores se crean al preparar la primera partida.</p><button class="button" data-nav="game">Armar la mesa</button></div>`}
  </section>`;
}

function dialogTemplate() {
  return `<div class="dialog-backdrop" role="presentation"><section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-copy"><h2 id="dialog-title">${escapeHtml(dialog.title)}</h2><p id="dialog-copy">${escapeHtml(dialog.message)}</p><div class="actions"><button class="button secondary" data-dialog-cancel>${escapeHtml(dialog.cancel || "Cancelar")}</button><button class="button ${dialog.danger ? "danger" : ""}" data-dialog-confirm>${escapeHtml(dialog.confirm || "Confirmar")}</button></div></section></div>`;
}

function addPlayer(name) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (!cleanName) return;
  let player = state.players.find((item) => item.name.toLocaleLowerCase("es") === cleanName.toLocaleLowerCase("es"));
  if (!player) { player = { id: uid(), name: cleanName, createdAt: new Date().toISOString() }; state.players.push(player); }
  if (!state.currentGame) state.currentGame = { id: uid(), playerIds: [], scores: {}, startedAt: null, started: false };
  if (state.currentGame.playerIds.includes(player.id)) { showToast(`${player.name} ya está en la mesa.`); return; }
  if (state.currentGame.playerIds.length >= 8) { showToast("La mesa admite hasta 8 jugadores."); return; }
  state.currentGame.playerIds.push(player.id);
  state.currentGame.scores[player.id] = Object.fromEntries(categories.map((category) => [category.id, null]));
  saveState(); render();
}

function startGame() {
  if (!state.currentGame || state.currentGame.playerIds.length < 2) return;
  state.currentGame.started = true;
  state.currentGame.startedAt = new Date().toISOString();
  saveState(); render(); showToast("Mesa lista. ¡Que rueden los dados!");
}

function requestDialog(config) { dialog = config; render(); setTimeout(() => document.querySelector("[data-dialog-confirm]")?.focus(), 0); }

document.addEventListener("submit", (event) => {
  if (event.target.id !== "setup-form") return;
  event.preventDefault(); const input = document.querySelector("#player-name"); addPlayer(input.value);
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, [data-close-sheet]");
  if (!target) return;
  if (target.dataset.nav) { view = target.dataset.nav; selectedCell = null; render(); return; }
  if (target.dataset.addExisting) { addPlayer(getPlayer(target.dataset.addExisting)?.name || ""); return; }
  if (target.dataset.removePlayer) { const id = target.dataset.removePlayer; state.currentGame.playerIds = state.currentGame.playerIds.filter((item) => item !== id); delete state.currentGame.scores[id]; if (!state.currentGame.playerIds.length) state.currentGame = null; saveState(); render(); return; }
  if (target.hasAttribute("data-start-game")) { startGame(); return; }
  if (target.dataset.scorePlayer) { selectedCell = { playerId: target.dataset.scorePlayer, categoryId: target.dataset.scoreCategory }; focusReturn = { ...selectedCell }; render(); setTimeout(() => document.querySelector(".score-option")?.focus(), 0); return; }
  if (target.hasAttribute("data-close-sheet")) { selectedCell = null; render(); restoreOverlayFocus(); return; }
  if (target.dataset.setScore !== undefined) {
    const value = Number(target.dataset.setScore);
    const cell = { ...selectedCell };
    const current = state.currentGame.scores[cell.playerId][cell.categoryId];
    const apply = () => { state.currentGame.scores[cell.playerId][cell.categoryId] = value; const player = getPlayer(cell.playerId); const category = categories.find((item) => item.id === cell.categoryId); selectedCell = null; dialog = null; saveState(); render(); announce(`${category.label} de ${player.name}: ${value} puntos`); };
    if (current !== null && current !== undefined && current !== value) {
      const player = getPlayer(selectedCell.playerId); const category = categories.find((item) => item.id === selectedCell.categoryId);
      selectedCell = null;
      requestDialog({ title: "¿Corregir este puntaje?", message: `${category.label} de ${player.name} cambiará de ${current} a ${value} puntos.`, confirm: "Sí, corregir", onConfirm: apply });
    } else { apply(); restoreOverlayFocus(); }
    return;
  }
  if (target.hasAttribute("data-new-game")) { requestDialog({ title: "¿Abandonar esta partida?", message: "La planilla en curso se descartará. Los jugadores seguirán guardados.", confirm: "Abandonar", danger: true, onConfirm: () => { state.currentGame = null; dialog = null; saveState(); render(); } }); return; }
  if (target.hasAttribute("data-finish-game")) {
    const totals = state.currentGame.playerIds.map((id) => ({ id, total: totalFor(state.currentGame.scores[id]) }));
    const max = Math.max(...totals.map((item) => item.total));
    const winners = totals.filter((item) => item.total === max).map((item) => getPlayer(item.id)?.name).join(" y ");
    triggerWinConfetti();
    requestDialog({
      title: `🎉 ${winners} ${winners.includes(" y ") ? "empatan" : "gana"} con ${max} pts`,
      message: "Al cerrar, la partida se guardará en el historial y actualizará las estadísticas.",
      confirm: "Guardar resultado",
      onConfirm: () => {
        triggerWinConfetti();
        const finished = { ...state.currentGame, finishedAt: new Date().toISOString() };
        state.games.push(finished);
        state.currentGame = null;
        dialog = null;
        view = "history";
        const saved = saveState();
        render();
        showToast(saved ? "Partida guardada en el historial." : "El resultado quedó abierto, pero no pudo guardarse en el dispositivo.");
      }
    });
    return;
  }
  if (target.dataset.toggleHistory) { const item = document.querySelector(`[data-history-id="${target.dataset.toggleHistory}"]`); const open = item.classList.toggle("open"); target.setAttribute("aria-expanded", open); return; }
  if (target.dataset.deleteGame) { const id = target.dataset.deleteGame; requestDialog({ title: "¿Eliminar esta partida?", message: "El resultado y su aporte a las estadísticas se borrarán de este dispositivo.", confirm: "Eliminar", danger: true, onConfirm: () => { state.games = state.games.filter((game) => game.id !== id); dialog = null; saveState(); render(); } }); return; }
  if (target.hasAttribute("data-dialog-cancel")) { dialog = null; render(); restoreOverlayFocus(); return; }
  if (target.hasAttribute("data-dialog-confirm")) { const action = dialog?.onConfirm; if (action) action(); restoreOverlayFocus(); return; }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { if (dialog) dialog = null; else selectedCell = null; render(); restoreOverlayFocus(); return; }
  if (event.key === "Tab" && (dialog || selectedCell)) {
    const overlay = document.querySelector(dialog ? ".dialog" : ".sheet");
    const focusable = [...overlay.querySelectorAll("button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

render();

if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("/sw.js").catch(() => {});
