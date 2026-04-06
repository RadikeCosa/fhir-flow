# Sprint — Continuidad clínica full-system `in-progress` (auditoría global acotada)

- Status: closed-by-evidence (single-gap)
- Fecha: 2026-04-06

## 1) Pregunta central

¿Qué brecha real sigue abierta para considerar validada la continuidad clínica full-system de `in-progress` fuera del alcance bounded ya cerrado, y cuál es el único siguiente movimiento correcto para cerrarla o acotarla?

## 2) Diagnóstico ejecutivo

Estado observado en el perímetro auditado:

- `encounter detail` (encounter-centric) y `patient detail` (source switching encounter-centric) ya están cerrados en bounded scope con evidencia test/browser previa.
- `encounter history` mantiene su contrato longitudinal vs encounter-centric con guardrails de no contaminación de maps/cards encounter-centric.
- El hueco principal remanente del frente global `in-progress` era de **evidencia cross-surface pre-finalize** (no de bug runtime confirmado): faltaba una prueba browser explícita de roundtrip `encounter detail -> patient detail -> history -> return encounter detail` manteniendo el mismo encounter `in-progress` antes de finalizar.

Conclusión:

- clasificación dominante: **gap de evidencia**;
- sin bug runtime nuevo verificable en surfaces auditadas;
- sin necesidad de fix productivo ni reapertura de G1–G4 o de canonical read `finished`.

## 3) Mapa de continuidad `in-progress` (global en perímetro auditado)

### A. Encounter detail

- Cerrado bounded: rehidratación encounter-centric por `encounterId`, guardas no-mix, save-progress y continuidad por remount/reload.
- Riesgo global remanente previo: evidencia de navegación cross-surface antes de finalize.

### B. Patient detail

- Cerrado bounded: selección de fuente `inProgressEncounter ?? lastFinishedEncounter` y carga clínica desde esa misma fuente.
- Riesgo global remanente previo: validar navegación ida/vuelta con history en estado `in-progress` sin mezclar encounter.

### C. Encounter history

- Cerrado bounded de frontera: fallback por fecha confinado a longitudinal/histórico; maps encounter-centric estrictos por `encounterId`.
- Riesgo global remanente previo: evidencia browser de roundtrip usando history como superficie intermedia durante `in-progress`.

### D. Navegación/browser cross-surface

- Cobertura previa: save/reload/remount/rehydrate y flujo con finalize.
- Brecha específica abierta: falta de evidencia browser del roundtrip cross-surface completo **sin finalizar**.

## 4) Único siguiente movimiento correcto

Agregar una única evidencia browser dirigida al hueco más crítico del frente global `in-progress`:

- escenario `in-progress` pre-finalize con secuencia:
  - save-progress en `encounter detail`;
  - navegación a `patient detail`;
  - navegación a `encounter history`;
  - retorno al mismo `encounter detail`;
  - verificación de persistencia del mismo estado clínico y del mismo `encounterId` sin mezcla cross-encounter.

Motivo de priorización:

- es el hueco de mayor valor sistémico que quedaba fuera del bounded closure;
- acota la deuda global sin abrir múltiples subfrentes;
- evita introducir cambios productivos sin bug runtime.

## 5) Ejecución realizada

Se ejecutó el movimiento propuesto como evidencia mínima (sin cambios productivos):

- Se agregó el test browser:
  - `in-progress continuity survives patient detail <-> history <-> encounter detail roundtrip before finalize`
  - archivo: `e2e/flows/encounter-cross-surface-no-mix.spec.ts`

Cobertura del nuevo escenario:

- guarda progreso en `encounter detail` del target `in-progress`;
- verifica render consistente en `patient detail`;
- verifica presencia en `history` y navegación de retorno al target;
- confirma rehidratación del mismo valor clínico en `encounter detail` y ausencia de mezcla con sibling.

Resultado:

- cierre del hueco principal como **evidencia browser cross-surface pre-finalize en alcance acotado**;
- **sin bug runtime nuevo verificable**;
- **sin cambios productivos adicionales**;
- sin reapertura de frentes cerrados.

## 6) Límites respetados

- no se reabrió G1;
- no se reabrió G2;
- no se reabrió G3;
- no se reabrió G4;
- no se reabrió canonical read bounded de `finished`;
- no se tocó practitioner consistency;
- no se tocó `ActionError.details`;
- no hubo refactor general de loaders;
- no se sobredeclara cierre global/system-wide absoluto.
