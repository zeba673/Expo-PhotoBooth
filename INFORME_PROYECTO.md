# Informe del proyecto Expo PhotoBooth

**Proyecto:** Cabina de fotos para Expo CET 1 - Laboratorio de Redes I  
**Versión:** MVP funcional  
**Fecha del informe:** 10 de octubre de 2026  
**Equipo principal:** computadora o notebook con Windows y webcam

## 1. Resumen

Expo PhotoBooth es un programa para que los visitantes de la exposición puedan sacarse una foto y llevarse un recuerdo digital. Se ejecuta en una computadora Windows conectada a una webcam. La persona elige una foto individual o una tira de cuatro tomas; el sistema muestra la cámara, cuenta tres segundos, captura la imagen, agrega el diseño de la Expo y permite descargar un archivo JPG.

El programa también muestra un código QR. Al escanearlo con un celular conectado a la misma red Wi-Fi, se abre una galería alojada en la computadora de la cabina desde la que se pueden descargar las fotos guardadas.

## 2. Necesidad y objetivo

La exposición necesita una actividad sencilla e interactiva que permita a estudiantes y visitantes tomarse una foto y conservar un recuerdo. El proyecto busca resolverlo con una experiencia guiada, visualmente atractiva y fácil de usar, sin depender de subir las imágenes a un servicio externo.

**Objetivo principal:** desarrollar un MVP de cabina de fotos que capture, componga, guarde localmente y comparta imágenes mediante un QR en la red local.

## 3. Identidad visual

Se eligió la estética **Colorido / Expo**, con una interfaz de alto contraste y botones grandes para facilitar su uso en un evento.

- Violeta oscuro: `#1C1034` (fondo principal).
- Violeta: `#7C3AED` (acentos y recursos gráficos).
- Rosa: `#F472B6` (énfasis y acciones de captura).
- Amarillo: `#FACC15` (botones principales y detalles).
- Blanco: texto y marcos de las fotos.

El marco que se imprime en el JPG lleva el título **“EXPO CET 1 - LABORATORIO DE REDES I”** y la leyenda Expo PhotoBooth · 2026.

## 4. Experiencia de uso

1. La pantalla de bienvenida presenta la actividad y el botón **Empezar**.
2. El visitante elige **Foto individual** o **Tira de 4 fotos**.
3. El navegador solicita permiso para usar la webcam y muestra la imagen en vivo.
4. Puede elegir sin filtro, blanco y negro, sepia o colores Expo. El efecto se ve en la cámara y también queda aplicado en el JPG.
5. Al tocar el botón de captura comienza una cuenta regresiva de tres segundos. Se puede cancelar.
6. En el modo individual se toma una foto. En el modo tira se hacen cuatro capturas independientes, cada una con su cuenta regresiva y el efecto elegido.
7. El programa compone el resultado en un JPG con marco, colores y título de la Expo.
8. La pantalla final ofrece la descarga directa en la computadora y muestra el QR para abrir la galería en un celular.
9. Desde la galería, cada imagen tiene una opción para descargarla.

## 5. Funciones incluidas en el MVP

- Interfaz de bienvenida, elección de formato, cámara, resultado y galería móvil.
- Diseño responsive para adaptarse a pantallas de distintos tamaños.
- Acceso a webcam mediante la API del navegador `getUserMedia`.
- Mensajes para errores comunes, como falta de cámara o permiso denegado.
- Temporizador de tres segundos con opción de cancelación.
- Cuatro efectos en vivo que también se aplican a la foto guardada.
- Captura individual y tira compuesta de cuatro exposiciones.
- Composición y descarga JPG en la computadora de la cabina.
- Guardado de los JPG en la carpeta local `data/photos`.
- QR generado por el servidor para abrir la galería desde un celular.
- Selección automática de un puerto libre si el habitual está ocupado.
- Acceso a la galería y descarga de las fotos a través de la misma red Wi-Fi.

## 6. Cómo está construido

### Interfaz

La interfaz se desarrolló con **React** y **Vite**. React maneja las pantallas, estados de cámara, cuenta regresiva, capturas y mensajes. Vite transforma y sirve la aplicación durante su uso y genera la compilación de producción.

### Servidor local

El archivo `server.js` ejecuta un servidor HTTP con las herramientas incluidas en Node.js. También integra el servidor de desarrollo de Vite. El servidor:

- recibe los JPG finales y los escribe en `data/photos`;
- entrega la lista de archivos a la página de galería;
- sirve las imágenes para que el teléfono las vea y descargue;
- crea el QR con la biblioteca `qrcode` y lo mantiene preparado durante la ejecución;
- detecta una dirección IPv4 local y la usa para construir el enlace de la galería.

### Almacenamiento

En esta versión no hay base de datos. Las fotos se almacenan como archivos JPG en `data/photos`. Esto reduce la configuración y permite inspeccionar los archivos directamente desde Windows. Las imágenes permanecen en la computadora hasta que alguien las borre manualmente.

### Recorrido de una imagen

```text
Webcam
  → captura en el navegador
  → composición del JPG con el marco de la Expo
  → descarga directa y envío al servidor local
  → archivo guardado en data/photos
  → galería de la red local
  → descarga desde el celular mediante el QR
```

## 7. Tecnologías y dependencias

- **React 19:** construcción de la interfaz.
- **Vite 6:** servidor de desarrollo y compilación.
- **Node.js:** servidor local HTTP y escritura de archivos.
- **QRCode:** generación local del QR.
- **HTML, CSS y JavaScript:** estructura, estilos y comportamiento del navegador.
- **Canvas del navegador:** composición del JPG a partir de las capturas.

No se utiliza FastAPI ni SQLite en el MVP actual. Se habían considerado como arquitectura posible para etapas posteriores, pero se eligió un servidor Node pequeño y almacenamiento en archivos para poner a funcionar primero el flujo central.

## 8. Estructura de archivos

| Archivo o carpeta | Función |
|---|---|
| `src/App.jsx` | Pantallas, webcam, temporizador, captura, JPG, QR y galería. |
| `src/App.css` | Estilos, identidad visual y adaptación a pantallas pequeñas. |
| `src/main.jsx` | Punto de entrada de React. |
| `server.js` | Servidor local, API de fotos, almacenamiento y QR. |
| `vite.config.js` | Configuración de Vite y React. |
| `index.html` | Página HTML que carga la aplicación. |
| `INICIAR.bat` | Inicio con doble clic en Windows y apertura del navegador. |
| `package.json` / `package-lock.json` | Dependencias y comandos del proyecto. |
| `data/photos/` | Destino local de los JPG generados. Se crea al iniciar el servidor. |

## 9. Instalación y uso

**Requisitos:** Windows 10/11, Node.js LTS con npm y una webcam integrada o conectada.

1. Abrir `INICIAR.bat` con doble clic.
2. En la primera ejecución, esperar a que npm instale las dependencias. Hace falta conexión a internet durante esa instalación.
3. Permitir el uso de la webcam cuando el navegador lo solicite.
4. Dejar abierta la ventana de consola mientras se usa la cabina.
5. Si Windows Firewall pregunta, permitir el acceso en la red privada del evento.
6. Para compartir, conectar el celular a la misma Wi-Fi que la computadora y escanear el QR mostrado en la pantalla del resultado.

Las fotos quedan en `data/photos` dentro de la carpeta del proyecto. El servidor muestra en su consola la dirección local que codifica el QR.

## 10. Privacidad y límites actuales

- El JPG se procesa en el navegador y se guarda en la computadora de la cabina; no se envía a un servicio de internet.
- La galería está disponible para dispositivos que puedan acceder al servidor dentro de la red local. En esta versión no tiene contraseña; por eso se debe usar una red privada del evento y no una red pública.
- Las fotos no se eliminan automáticamente. El equipo debe decidir y aplicar una limpieza después de la Expo.
- El acceso a la webcam depende del permiso del navegador y de que haya una cámara disponible.
- El QR funciona si el celular y la computadora comparten la misma Wi-Fi y la red permite la comunicación entre dispositivos.
- El escaneo y la descarga en la Wi-Fi real del evento todavía deben comprobarse en el lugar.
- No se modificó el hardware ni la estructura física de la cabina. La pintura y el montaje quedan fuera de este MVP.

## 11. Verificación realizada

- Las dependencias se instalaron correctamente.
- La compilación de producción con `npm run build` finalizó sin errores.
- `server.js` pasó la comprobación de sintaxis de Node.js.
- El servidor inició, encontró un puerto disponible y mostró la dirección local de la galería para el QR.
- No se verificó una captura física con la webcam ni la descarga en un celular conectado a la Wi-Fi del evento; esas comprobaciones requieren los equipos del stand.

## 12. Próximos pasos sugeridos

1. Probar webcam, iluminación, encuadre y tamaño del JPG en la computadora y cámara definitivas.
2. Probar el QR desde varios celulares conectados a la Wi-Fi que se usará en la Expo.
3. Definir una política de borrado de imágenes y limpiar `data/photos` después del evento.
4. Si se necesita controlar quién descarga las fotos o cuánto tiempo se conservan, agregar un mecanismo de acceso y expiración.
5. Con el flujo validado, evaluar una base de datos o servidor más completo solo si las necesidades reales lo requieren.

## 13. Explicación breve para presentar

> “Expo PhotoBooth es un MVP de una cabina de fotos para la Expo CET 1 - Laboratorio de Redes I. Funciona en una computadora Windows con webcam. La persona elige una foto individual o una tira de cuatro, posa durante una cuenta regresiva de tres segundos y el programa arma un JPG con el diseño de la Expo. La imagen se guarda localmente. Un QR permite abrir desde el celular una galería servida por la misma computadora, siempre que ambos dispositivos estén conectados a la misma Wi-Fi. Para esta primera versión priorizamos que la experiencia principal funcione; por eso usamos React y Vite para la interfaz, un servidor local sencillo en Node.js y archivos JPG en lugar de incorporar todavía FastAPI y SQLite.”

