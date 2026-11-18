# Capability: cabina-windows

## ADDED Requirements

### Requirement: inicio como aplicación de Windows
Tipo: funcional
La cabina DEBE abrir una ventana de aplicación, con acceso a pantalla completa y controles visibles de navegación.

#### Scenario: abrir la cabina desde Windows
- DADO que la cabina está instalada o preparada en una PC Windows
- CUANDO la persona abre el acceso de Expo PhotoBooth
- ENTONCES puede iniciar una sesión desde su ventana propia y activar o dejar la pantalla completa

### Requirement: recorrido de captura
Tipo: funcional
La cabina DEBE ofrecer foto individual y tira de cuatro, una ruleta antes de la cámara, efectos y cuenta regresiva cancelable de tres segundos.

#### Scenario: completar una tira
- DADO que la persona elige una tira de cuatro fotos
- CUANDO gira la ruleta, pasa a la cámara y completa las cuatro capturas
- ENTONCES puede ver el progreso durante la sesión y revisar la tira al finalizar

#### Scenario: cancelar o recuperar la cámara
- DADO que la persona está en la pantalla de cámara
- CUANDO cancela la cuenta regresiva o la cámara no se puede abrir
- ENTONCES puede volver a intentar o regresar sin que se dispare una captura pendiente

### Requirement: entrega y respaldo
Tipo: funcional
La cabina DEBE permitir descargar el JPG con el título del evento, compartirlo por QR en la red local y guardar los originales y la imagen con marco en disco.

#### Scenario: llevarse la foto
- DADO que terminó una sesión y la imagen se guardó
- CUANDO la persona descarga el JPG o abre el QR con un teléfono conectado a la misma red
- ENTONCES puede descargar la imagen con marco y el operador puede encontrar los originales y la imagen final en el respaldo local
