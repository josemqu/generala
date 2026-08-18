---
name: Generala
description: Una cartelera de club social convertida en tanteador táctil.
colors:
  club-plum: "#3B2854"
  lavender-field: "#D8CBE8"
  action-lime: "#CBEA64"
  raspberry: "#C73E5A"
  ink: "#241B2F"
  paper: "#F8F4FC"
  success: "#287757"
typography:
  display:
    fontFamily: "Avenir Next Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2rem, 9vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Avenir Next, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  control: "12px"
  panel: "16px"
  token: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.action-lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "14px 18px"
  score-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "52px"
---

# Design System: Generala

## Overview

**Creative North Star: "La cartelera del club"**

La interfaz toma el lenguaje directo de una pizarra de torneo de barrio: nombres grandes, colores sólidos, fichas numeradas y una tabla que se entiende desde el otro lado de la mesa. No imita papel antiguo; traduce ese ritual a controles táctiles contemporáneos.

**Key Characteristics:** jerarquía numérica, contraste alto, tablas sin ambigüedad y detalles gráficos contenidos.

## Colors

Berenjena de club y lavanda media sostienen la superficie; los paneles internos usan un lila blanquecino diferenciado, la lima fresca señala la acción y la frambuesa marca foco o peligro. El lienzo nunca debe percibirse blanco.

**Regla de la ficha lima.** La lima se reserva para acción, turno o ganador; nunca decora superficies completas.

## Typography

Los encabezados usan una sans condensada pesada disponible en el sistema; el cuerpo usa una sans humanista del sistema. Los números siempre emplean cifras tabulares.

## Layout

El viewport nunca desplaza el `body`: la aplicación ocupa exactamente el alto disponible y solamente `.page` maneja el desplazamiento vertical, sin barra visible ni cambios de ancho entre secciones. Durante una partida móvil, la marca superior se retira y aparece un HUD compacto de juego con progreso, reinicio y Finalizar; la planilla distribuye sus once filas en el resto del alto disponible sin scroll vertical y conserva solamente desplazamiento horizontal cuando hay muchos jugadores. La navegación vive en una fila propia al pie del layout —nunca superpuesta al contenido— y contempla el área segura del dispositivo. En escritorio, el contenido se centra hasta 1100px y la navegación pasa al encabezado.

## Elevation & Depth

La profundidad es estructural: paneles importantes usan una sombra berenjena oscura desplazada, como una placa montada sobre otra. Los controles internos se separan con color y reglas, no con sombras repetidas.

## Shapes

Paneles de 16px y controles de 12px. Las fichas pequeñas pueden ser circulares; las acciones principales nunca son píldoras.

## Components

### Score cells

Cuadrados táctiles de al menos 48px, con número grande, estado vacío explícito y foco visible. La celda activa usa lima y un leve desplazamiento.

### Buttons

Botones sólidos, textos verbales y sombra de presión de 3px. Al activarse, la sombra colapsa para dar sensación de ficha mecánica.

### Navigation

Tres destinos estables: Partida, Historial y Jugadores. Ícono simple más etiqueta siempre visible.

## Do's and Don'ts

### Do:

- **Do** mantener el total y los nombres visibles durante la carga.
- **Do** usar color más texto o símbolo para cada estado.
- **Do** sostener blancos táctiles mínimos de 44px.

### Don't:

- **Don't** encerrar cada métrica en una tarjeta independiente.
- **Don't** usar degradados, vidrio o brillos decorativos.
- **Don't** ocultar la tabla completa detrás de un flujo de turnos obligatorio.
