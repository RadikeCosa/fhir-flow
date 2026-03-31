# Sprint — In-progress continuity (save → reload → rehydrate)

Fecha: 2026-03  
Estado: **CERRADO**

---

## Resumen de cierre

Este sprint cerró, en alcance acotado, la continuidad encounter-centric del flujo crítico en surfaces validadas:

- la UI editable expone dos intenciones explícitas:
  - **Guardar progreso** → `saveEncounterProgressAction`
  - **Finalizar visita** → `finalizeEncounterAction`
- la lectura de datos clínicos para rehidratación se mantiene encounter-centric por `encounterId`;
- se validó el cambio de fuente en patient detail (`inProgressEncounter ?? lastFinishedEncounter`) tras finalizar, sin mezcla de encounters.

---

## Validación con evidencia (alcance de sprint)

Se agregó evidencia automatizada acotada a encounter detail + patient detail:

- **T3 (integrado positivo)**:
  - `planned -> start -> in-progress -> save -> reload/remount -> rehydrate`;
  - `in-progress -> finalize -> finished -> patient detail source switch`;
  - continuidad del mismo `encounterId` en todo el flujo.
- **T4 (guardas negativas)**:
  - encounter detail no puede resolver primaria clínica por sibling encounter (aunque sea misma fecha);
  - patient detail prioriza `inProgressEncounter` sobre siblings `finished` en misma fecha;
  - no contaminación cross-encounter en las surfaces auditadas.

### Evidencia automatizada incorporada

- `app/patients/[id]/encounters/[encounterId]/__tests__/critical-flow.integration.test.ts`
- `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts` (guardas negativas)
- `app/patients/[id]/__tests__/data.test.ts` (guardas negativas)

---

## Alcance del cierre

Este cierre aplica **únicamente** a:

- encounter detail encounter-centric por `encounterId` (flujo `in-progress` y lectura `finished` dentro del circuito validado);
- patient detail para source selection clínico (`inProgressEncounter ?? lastFinishedEncounter`) como punto secundario de consistencia.

No constituye cierre de continuidad clínica del sistema completo ni del read model global.

---

## Limits of closure

- No hubo validación browser E2E.
- No hubo validación montada de RHF `reset(...)`.
- No hubo validación longitudinal/charts.
- No se declara continuidad clínica system-wide fuera de las surfaces validadas.
- No se declara hardening canónico global de `finished` fuera del alcance acotado ya cerrado en su propio track.
- No hubo refactor arquitectónico.
