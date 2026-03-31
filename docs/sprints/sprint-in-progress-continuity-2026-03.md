# Sprint — In-progress continuity (save → reload → rehydrate)

Fecha: 2026-03  
Estado: **CERRADO**

---

## Resumen de cierre

Este sprint cerró, en alcance acotado, la continuidad clínica del **encounter detail en estado `in-progress`**:

- la UI editable expone dos intenciones explícitas:
  - **Guardar progreso** → `saveEncounterProgressAction`
  - **Finalizar visita** → `finalizeEncounterAction`
- la lectura de datos clínicos para rehidratación se mantiene encounter-centric por `encounterId`;
- el formulario endureció la sincronización con datos canónicos del loader:
  - recomputa `defaultValues` loader-derived;
  - ejecuta `reset(...)` cuando esos valores cambian.

---

## Validación con evidencia (alcance de sprint)

Se agregó evidencia automatizada acotada al surface de encounter detail:

- `save -> reload/remount -> rehydrate` para el mismo `encounterId`;
- no-mezcla entre dos encounters `in-progress` del mismo paciente (encounterIds distintos);
- reemplazo de salida previa por valores loader-derived en render subsiguiente;
- manejo de parcialidad: campos no persistidos permanecen ausentes (sin defaults inventados).

---

## Alcance del cierre

Este cierre aplica **únicamente** a:

- encounter detail `in-progress` (surface editable);
- continuidad encounter-centric por `encounterId` en ese surface.

No constituye cierre de continuidad clínica del sistema completo ni del read model global.

---

## Límites del cierre

- No hubo validación browser E2E.
- No hubo test montado directo del comportamiento RHF `reset(...)` (limitación de entorno).
- No se cierran garantías longitudinales/históricas fuera de `encounterId`.
- No se expandió alcance a `finished` más allá de lo ya validado en su propio track.
