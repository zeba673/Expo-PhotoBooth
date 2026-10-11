# Expo PhotoBooth

MVP de la cabina de Expo Redes I. El programa se ejecuta en la computadora Windows; las fotos se guardan en esa computadora y no se suben a internet.

## Requisitos

- Windows 10 u 11.
- Node.js LTS instalado (incluye npm).
- Una webcam integrada o conectada.

## Iniciar

Hacé doble clic en `INICIAR.bat`. La primera vez instala las dependencias y luego abre la aplicación. Mantené abierta la ventana de consola mientras se usa la cabina. Autorizá el acceso a la webcam cuando el navegador lo solicite y permití la conexión en redes privadas si Windows Firewall lo pregunta. Si el puerto habitual ya está ocupado, el servidor elige el siguiente disponible.

También se puede iniciar manualmente desde esta carpeta con `npm install` (solo la primera vez) y `npm run dev`.

## Funciones

- Bienvenida con identidad visual Colorido / Expo.
- Foto individual o tira vertical de cuatro exposiciones.
- Vista en vivo de la webcam, cuenta regresiva de tres segundos y cancelación.
- Efectos en vivo: sin filtro, blanco y negro, sepia y colores Expo; se aplican también a las fotos guardadas.
- Composición con marco y título “Expo CET 1 - Laboratorio de Redes I”; descarga local en JPG.
- QR para abrir una galería y descargar las fotos desde un celular conectado a la misma Wi‑Fi.
- Interfaz adaptable a pantallas pequeñas.

La cámara funciona en `localhost` (origen seguro de navegador). El QR abre la galería servida desde esta computadora; celular y cabina deben estar conectados a la misma Wi‑Fi. El QR se genera al iniciar y queda listo en la pantalla de cada foto. La ventana de consola muestra la dirección local codificada. Las fotos quedan guardadas en `data/photos` dentro de la carpeta del proyecto. El servidor solo debe usarse en la red privada del evento.

