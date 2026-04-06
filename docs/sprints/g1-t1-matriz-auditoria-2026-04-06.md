# G1 T1 — Matriz de auditoría `surface × invariant × evidencia` (diagnóstico)

- Fecha: 2026-04-06
- Sprint objetivo: `docs/sprints/sprint-tecnico-g1-invariants.md`
- Alcance ejecutado: **solo T1 (diagnóstico/auditoría de evidencia existente)**
- Cambios productivos: **ninguno**

## A. Executive diagnosis

G1 (T1) queda en estado **diagnosticado con cobertura mayormente verde y algunos ámbar de evidencia**.
No aparece bug runtime nuevo verificable en surfaces encounter-centric auditadas.
La evidencia existente sostiene con fuerza la identidad encounter-centric en `patient detail`, `encounter detail` y contrato observable de `encounter history`; los huecos detectados son principalmente de evidencia negativa explícita en ownership/cross-patient para surfaces que dependen de filtros por repositorio.

## B. Files reviewed

### Backlog / arquitectura / checkpoints

- `docs/backlog.md`: contexto del frente global y límites de alcance.
- `docs/backlog-priorizacion-auditoria-2026-04-06.md`: priorización vigente y framing de deuda global vs bounded.
- `docs/validation/validacion-arquitectonica.md`: estado real vigente y límites explícitos de cierres acotados.
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`: contrato de surfaces en `app/` y separación encounter-centric vs longitudinal.
- `docs/sprints/sprint-tecnico-g1-invariants.md`: definición oficial de G1 y de T1.
- `docs/sprints/sprint-auditoria-bounded-v2-continuidad-clinica-transversal-2026-04-06.md`: evidencia bounded previa reutilizable.

### Código/contrato de surfaces

- `app/patients/[id]/data.ts`: selección de source clínico en patient detail.
- `app/patients/[id]/page.tsx`: navegación/CTA desde patient detail.
- `app/patients/[id]/components/LastEncounterSection.tsx`: surface clínica mostrada y enlace a history.
- `app/patients/[id]/encounters/[encounterId]/data.ts`: loader encounter detail y fail-closed patient/encounter.
- `app/patients/[id]/encounters/data.ts`: contrato observable history (lista, maps encounter-centric, fallback longitudinal acotado).
- `app/patients/[id]/encounters/components/EncounterList.tsx`: lista/cards encounter-centric observable.
- `app/patients/[id]/encounters/components/EncounterCard.tsx`: navegación a detail por `encounter.id`.

### Tests reutilizados como evidencia

- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/page.cta-render.test.ts`
- `app/patients/[id]/__tests__/cross-surface.contract.test.ts`
- `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts`

## C. G1 matrix

| Surface | Invariant | Evidencia existente | Estado |
|---|---|---|---|
| patient detail | 1) No-mezcla cross-encounter | `getPatientDetailData` usa una sola fuente clínica (`inProgressEncounter ?? lastFinishedEncounter`) y carga datasets por ese `encounterId`; test guard explícito evita fuga de sibling same-date. | **verde** |
| patient detail | 2) No-mezcla cross-patient / fail-closed ownership+route | Evidencia indirecta por composición `patientId -> activeEpisode -> encounters` y repositorios scoping; no hay guarda negativa explícita tipo “foreign ownership” en este loader. | **ámbar** |
| patient detail | 3) Source-of-truth correcto por surface | Source clínico encounter-centric implementado por `encounterId`; sin fallback temporal en datasets encounter-centric. | **verde** |
| patient detail | 4) Consistencia cross-surface | CTA usa `inProgressEncounter.id`/`nextPlannedEncounter.id`; contrato cross-surface valida que encounter seleccionado en patient detail existe en membresía de history sin exigir orden visual idéntico. | **verde** |
| encounter detail | 1) No-mezcla cross-encounter | Loader carga clínicos estrictamente por `encounterId`; tests de no-mezcla con encounters hermanos (incluyendo same-date). | **verde** |
| encounter detail | 2) No-mezcla cross-patient / fail-closed ownership+route | Guarda explícita: si `encounter.patientId !== patientId`, retorna `encounter: null` y no hidrata clínicos. | **verde** |
| encounter detail | 3) Source-of-truth correcto por surface | Lectura encounter-centric por `encounterId` para `finished` e `in-progress`; sin fallback temporal como fuente en detail. | **verde** |
| encounter detail | 4) Consistencia cross-surface | Navegación entrante y loader convergen sobre `encounterId` de ruta; no se halló contradicción clínica verificable en evidencia existente. | **verde** |
| encounter history | 1) No-mezcla cross-encounter (surface encounter-centric) | Maps por card (`vitalsByEncounterId`, `evaByEncounterId`, `proceduresByEncounterId`) aceptan solo `encounterId` explícito; tests prueban no-filtración de fallback por fecha a maps/cards. | **verde** |
| encounter history | 2) No-mezcla cross-patient / fail-closed ownership+route | Evidencia indirecta por `patientId -> activeEpisode -> encounterList`; no hay test negativo dedicado de ownership mismatch en history route. | **ámbar** |
| encounter history | 3) Source-of-truth correcto por surface | Separación explícita observable: lista/cards encounter-centric por membresía de encounter y maps por `encounterId`; fallback por fecha queda confinado a longitudinal series. | **verde** |
| encounter history | 4) Consistencia cross-surface | `EncounterCard` navega a `/patients/${encounter.patientId}/encounters/${encounter.id}`; contrato cross-surface valida continuidad semántica (misma visita) sin imponer igualdad de orden visual. | **verde** |

## D. Key findings

### Evidencia suficiente ya existente

1. **No-mezcla cross-encounter** fuerte en `encounter detail` y `patient detail` (guards/tests explícitos con sibling y same-date).
2. **Fail-closed ownership** sólido en `encounter detail` (mismatch route patient/encounter retorna nulo y corta carga clínica).
3. **Source-of-truth encounter-centric** claro en las tres surfaces auditadas en su contrato observable, con separación explícita de fallback longitudinal en history.
4. **Consistencia cross-surface** suficiente en continuidad patient detail ↔ history ↔ encounter detail por construcción de href + membresía validada.

### Evidencia parcial / ámbar

1. `patient detail` invariant 2 (cross-patient/fail-closed): cobertura hoy es más de contrato de composición y repositorios que de prueba negativa explícita.
2. `encounter history` invariant 2 (cross-patient/fail-closed): mismo patrón; no aparece bug, pero falta evidencia negativa directa en test route-level.

### Fila roja real

- **No se detectó fila roja** con bug runtime verificable dentro del alcance T1/G1.

## E. Recommended next action

Siguiente ticket lógico: **T2 (hardening mínimo de evidencia negativa de ownership/cross-patient en patient detail e history, sin cambios productivos)**.

Objetivo puntual de T2:
- convertir los dos ámbar (invariant 2 en `patient detail` + `encounter history`) a verde por evidencia explícita,
- manteniendo el límite de no abrir G2/G3/G4,
- sin reabrir `app/patients/[id]/encounters/data.ts` más allá del contrato observable ya auditado.

## F. Constraints respected

- **No hubo cambios productivos**: solo documento diagnóstico de T1.
- **No se reabrieron bounded closures fuera de evidencia nueva**.
- **No se abrió G2/G3/G4**.
- **No se tocó** practitioner consistency encounter write.
- **No se tocó** `ActionError.details` fuera de encounter write.
- **No se reabrió** canonical read bounded de `finished encounter detail`.
- **No se reabrió** cobertura browser bounded ya cerrada.
- **No se convirtió** el ticket en refactor de `encounters/data.ts`.
