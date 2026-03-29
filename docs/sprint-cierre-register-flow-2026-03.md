# Cierre de sprint — Register flow y estabilización write

Fecha: 2026-03-29  
Sprint: Register flow + estabilización asociada

## 1) Objetivo del sprint
Completar la separación entre planificar y registrar visita, y dejar operativo el register flow con persistencia clínica interoperable sin romper el marco arquitectónico vigente del write flow.

## 2) Alcance ejecutado
- Separación de entry points:
  - `/patients/[id]/encounters/new` para planificar visita.
  - `/patients/[id]/encounters/register` para registrar visita.
- Register flow operativo con:
  - `registerEncounterAction`.
  - `completionMode` explícito (`start` | `complete`).
  - validación server-side de EpisodeOfCare.
  - redirect al detail del encounter creado.
- Save progress operativo y separado:
  - `saveEncounterProgressAction`.
  - snapshot clínico transaccional.
  - ownership metadata para interoperabilidad y reemplazo de recursos managed por esta app.
- Convergencia clínica:
  - extracción/reuso de pipeline clínico compartido.
  - reglas shared de cierre (`finished`) reutilizadas en register y finalize.

## 3) Decisiones arquitectónicas relevantes cerradas en el sprint
- La separación **planning vs register** queda cerrada a nivel de rutas y app layer.
- Register se modela como creación directa de encounter en `in-progress` o `finished` según intención explícita de usuario.
- Save progress queda como operación independiente de finalize.
- R4 (unificación de pipeline clínico) queda cerrada en su parte habilitante previa.

## 4) Cambios implementados
- Ruta de registro dedicada (`/encounters/register`) con UI de intención explícita.
- CTAs de patient detail condicionados por `inProgressEncounter` y `nextPlannedEncounter`.
- Flujo de register con doble intención:
  - iniciar visita (`start`)
  - finalizar directamente (`complete`)
- Persistencia separada de progreso durante `in-progress`.

## 5) Riesgos o limitaciones que siguen abiertas
> Este sprint **no** cierra el lifecycle completo.

- Sigue abierta la deuda de transición explícita `planned -> in-progress` para encuentros ya planificados (`startEncounterAction`).
- `finalizeEncounterAction` todavía no está endurecida de forma definitiva para requerir `in-progress` en todos los casos.
- El canonical read completo de detail en estado `finished` sigue en deuda y no debe marcarse como cerrado total.
- `ActionError.details` continúa en transición de tipado por capa.

## 6) Impacto en UX
- Menor ambigüedad: “Planificar visita” y “Registrar visita” quedan claramente separadas.
- Patient detail presenta acciones contextualizadas por estado real de encuentros.
- Register permite dos intenciones operativas explícitas sin forzar un único camino.

## 7) Impacto en arquitectura
- Se reduce acoplamiento entre modos de creación y transición de lifecycle.
- Se consolida reuso del pipeline clínico de escritura.
- Se mantiene coherencia con boundary de capas (Server Action → rules → repository → mapper → FHIR client).
- Persiste transición controlada: compatibilidad legacy convive con el modelo objetivo.

## 8) Backlog / tickets afectados
- **Resueltos:** `R1`, `A1`, `R2`, `R3`, `R4`.
- **Parcial:** `L2`.
- **Deuda abierta:** `L1` + deuda explícita de canonical read completo de `finished`.
- **Siguiente fase:** endurecimiento lifecycle + cierre deuda canonical read + tipado de errores.

## 9) Próximos pasos sugeridos
1. Implementar `L1` (`startEncounterAction`) para encounters creados como `planned`.
2. Endurecer `L2` (finalize requiere `in-progress`) con retiro progresivo del fallback transicional.
3. Cerrar deuda de canonical read completo en detail `finished` con validación end-to-end.
4. Avanzar tipado de `ActionError.details` por capa sin romper contrato estable.

---

Este cierre documenta estado real post-sprint: base sólida, transición activa y deuda explícita aún abierta.
