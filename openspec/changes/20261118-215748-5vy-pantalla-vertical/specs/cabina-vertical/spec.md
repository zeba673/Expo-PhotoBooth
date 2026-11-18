# Capability: cabina-vertical

## ADDED Requirements

### Requirement: cabina en orientación vertical
Tipo: funcional
La aplicación DEBE mantener una composición vertical y abrir en el televisor cuando Windows lo identifica como pantalla vertical.

#### Scenario: usar un televisor en modo retrato
- DADO un televisor que Windows reporta en orientación vertical
- CUANDO se abre la cabina
- ENTONCES la ventana aparece a pantalla completa en el televisor y permite recorrer formato, pose, cámara y entrega en una columna

#### Scenario: preparar la cabina desde un monitor horizontal
- DADO que solo hay monitores horizontales
- CUANDO se abre la cabina
- ENTONCES se abre una ventana vertical con los mismos pasos y controles
