# Auditoría técnica — register/continuidad (actualización de cierre acotado, 2026-04-09)

## Alcance
Esta actualización documenta el estado real del frente `register/continuidad` en app layer.
No declara cierre global de arquitectura ni cierre total de UX fuera de este perímetro.

## Hipótesis iniciales auditadas y veredicto

### H1. “Había dos formularios clínicos completos compitiendo en runtime”
**Veredicto:** **Refutada (en el frente activo actual).**

- El diagnóstico inicial detectó divergencia real entre `register` y `detail in-progress`.
- Con la implementación posterior, la composición clínica compartida quedó reutilizada en ambos surfaces.
- El frente deja de comportarse como “doble formulario clínico activo” para operación diaria.

### H2. “La continuidad register -> in-progress/detail estaba fragmentada por diseño”
**Veredicto:** **Refutada en alcance acotado.**

- `register` opera en modo single-surface para carga inicial + continuidad temprana.
- `save progress` ya no impone salto inmediato obligatorio para continuar edición clínica.
- El detail permanece como surface complementaria/canónica de continuidad, no como reemplazo forzado del primer tramo.

### H3. “Vitales/EVA eran obligatorios por regla clínica al finalizar”
**Veredicto:** **Refutada.**

- La falsa obligatoriedad observada provenía de una brecha técnica de validación (schema/RHF), no de una regla clínica global.
- El fix fase 1 + fase 2 corrige ese comportamiento manteniendo que vitales/EVA no son obligatorios por defecto.

## Problemas reales detectados y corregidos

1. **Divergencia register/detail en composición clínica base**
   - Corregido con composición clínica compartida.
2. **Drift entre wrappers en manejo de submit/error**
   - Corregido con banner de error/wiring consolidado.
3. **Snapshot `in-progress` sin punto único suficientemente explícito**
   - Corregido con helper server-side compartido para snapshot clínico en progreso.
4. **Defaults compartidos con ownership difuso**
   - Corregido con defaults neutrales comunes al formulario clínico compartido.
5. **Framing superior de register con exposición de identificador interno**
   - Corregido: `/encounters/register` ya no muestra `episodeId` visible en el encabezado.

## Estado de cierre por frente (criterio conservador)

- **Register single-surface:** **Cerrado real** (implementado y en uso).
- **Composición clínica compartida register/continuidad:** **Cerrado bounded** (válido en este frente, sin extrapolar a cierre global).
- **Defaults compartidos con ownership neutral:** **Cerrado bounded**.
- **Snapshot `in-progress` server-side compartido:** **Cerrado bounded**.
- **Wrappers (error banner + wiring submit/error):** **Cerrado bounded**.
- **Bug falsa obligatoriedad vitales/EVA (fase 1 + fase 2):** **Cerrado real**.
- **Framing superior `/encounters/register` (sin episode id visible):** **Cerrado bounded**.

## Remanente real

- No se identifica remanente runtime crítico dentro del frente auditado.
- Puede quedar remanente menor de wording/copy o jerarquía visual fina en register; se clasifica como **Abierto nominal/documental**.

## Límite explícito de este cierre

Este documento cierra de forma honesta y acotada el frente auditado `register/continuidad`.
No implica:

- cierre global de arquitectura,
- cierre total de UX de register,
- ni cierre de deudas longitudinales o cross-surface fuera del alcance aquí auditado.
