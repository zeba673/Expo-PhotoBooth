# Diseño

La experiencia de la cabina prioriza pantallas de 1366 × 768 o superiores, con controles grandes, foco visible y operación por teclado. La cámara ocupa el centro de la pantalla y los efectos y el avance quedan juntos en un panel lateral. La ruleta ocupa su propia pantalla antes de abrir la cámara. El resultado muestra la imagen y las opciones de descarga y QR en paralelo. La galería móvil usa una columna cuando la pantalla es angosta.

Empaquetar la interfaz React existente como aplicación de Windows con un contenedor de escritorio como Electron. Mantener el servidor local para almacenar fotos y servir la galería por LAN. El contenedor carga la interfaz local con aislamiento de contexto y acceso restringido a la cámara para la pantalla de captura. Los archivos de fotos permanecen en un directorio escribible y se conservan los respaldos previos.
