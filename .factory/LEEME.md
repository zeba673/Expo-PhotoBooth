# .factory/

Lo que Factory produce sobre este proyecto. Se versiona con el código para que quien clone el proyecto
lo tenga; `local/` no, porque es de cada máquina y Git la ignora.

- `config.json` es la configuración del proyecto: `modo_por_defecto`, `tipos_obligatorios`, `capacidades` (alias de capacidades),
  `revisores`, `oracle` (la carpeta del proyecto Oracle, si no es la raíz) y `confiar_escalares`.
- `cambios/<ID>/` guarda el estado del cambio: `factory.json`, `review.md` y `oracle-veredicto.txt`.
- `resumen.md` es el estado actual en una lectura (`oracle-factory resumen`); se lee con `glow -p .factory/resumen.md`.
- `specs/<capacidad>.json` es el índice de la spec consolidada en `openspec/specs/<capacidad>/`: de qué cambio y requisito de Oracle viene cada requisito vigente y cuáles fueron reemplazados.
- `cambios/<ID>/candidatos/<sha7>/` agrupa lo que se produjo sobre un commit: `evidencia/`, `clue/` y `revision/`.
- `local/revisiones/` guarda los checkouts estables y el clon aparte de cada pedido de revisión (`<sha7>-<revisor>-<n>/`).
- `local/revisores/` guarda el pedido, la salida y el informe de cada revisor (`<sha7>-<revisor>-<n>/`).
- `local/rag/` guarda el índice de `oracle-factory preguntar`. Nada de `local/` se versiona.

Este archivo existe también porque Git no versiona carpetas vacías: sin él, un clon no tendría `.factory/`.
Más detalle en `docs/estructura.md` del repositorio de Factory, y `oracle-factory donde ID` lista lo que hay.
