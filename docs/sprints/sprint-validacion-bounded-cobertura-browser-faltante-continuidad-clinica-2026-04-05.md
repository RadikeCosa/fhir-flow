# Sprint — Validación bounded de cobertura browser faltante en continuidad clínica

- Status: proposed-ready
- Fecha: 2026-04-05
- Tipo: validación (sin cambios productivos por defecto)

## 1) Objetivo

Cerrar ambigüedades operativas del frente de cobertura browser faltante en continuidad clínica, manteniendo alcance bounded y ejecución secuencial T1 -> T2.

Este sprint:

- valida cobertura faltante con evidencia;
- no implementa features nuevas;
- no abre hardening salvo evidencia runtime nueva y verificable.

## 2) Autoridad y consistencia documental

Referencias de autoridad/estado vigentes:

- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`

Compatibilidad explícita con cierres previos:

- no reabre practitioner consistency;
- no reabre ActionError.details fase 3 fuera de encounter write;
- no reabre longitudinal/histórico global;
- no reabre lifecycle.

## 3) Alcance incluido

Solo dos huecos de cobertura bounded:

1. `patient detail` browser con coexistencia explícita `in-progress + finished`.
2. contraste post-finalize con más de un outcome contractual válido.

## 4) Definición operativa obligatoria para T1

### 4.1 “Coexistencia explícita” (definición canónica)

Se considera coexistencia explícita únicamente cuando se cumplen todos estos puntos:

- mismo `patientId`;
- mismo `episodeOfCareId` activo;
- un encounter `in-progress`;
- un encounter `finished`.

Invariante contractual a validar en `patient detail`:

- `patient detail` prioriza el encounter `in-progress` como fuente clínica;
- no mezcla datasets clínicos provenientes del sibling `finished`.

### 4.2 Prerequisito histórico fuera de alcance

El drift histórico del test EVA encounter-scoped:

- está resuelto;
- queda fuera de alcance de este sprint;
- no debe contaminar decisiones ni diagnóstico de T1/T2.

## 5) Landing zone (solo diagnóstico/validación)

Primaria:

- `e2e/flows/encounter-continuity.spec.ts`
- `e2e/flows/encounter-finalize.seeded.spec.ts`
- `e2e/support/load-continuity-minimal-seed.ts`
- `e2e/support/load-finalize-minimal-seed.ts`
- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/cross-surface.contract.test.ts`

Regla de frontera:

- `app/patients/[id]/encounters/data.ts` queda **fuera** como objeto de cambio;
- puede consultarse únicamente como referencia diagnóstica de límites encounter-centric vs longitudinal.

## 6) Secuencia de ejecución (no paralela)

T1 y T2 se ejecutan **en secuencia**. No se ejecutan en paralelo.

- T1 produce baseline y clasificación de cobertura.
- T2 ejecuta contraste de outcomes contractuales sobre la base validada de T1.

## 7) T1 — Validación bounded de coexistencia explícita

Objetivo T1:

- verificar cobertura browser del escenario de coexistencia explícita;
- confirmar que se mantiene prioridad de `in-progress` y no-mezcla con sibling `finished`.

Salida esperada T1 (obligatoria):

- tabla breve con:
  - seed/escenario usado,
  - invariant esperado,
  - evidencia existente,
  - estado (`cubierto` | `hueco de cobertura` | `gap runtime verificable`).

Regla de gate:

- si no hay gap runtime verificable, no se abre hardening.

## 8) T2 — Contraste de outcomes contractuales post-finalize

T2 debe contrastar explícitamente estos dos outcomes candidatos (sin inventar terceros):

1. **Empty-state válido post-finalize**.
2. **Patient detail con última visita visible (o equivalente contractual)** cuando siga existiendo contexto activo relevante.

Salida esperada T2 (obligatoria):

- matriz outcome -> seed/escenario -> evidencia -> estado (`válido` | `no reproducible` | `gap`).

Regla de no invención:

- T2 no define outcomes fuera de estos dos contratos candidatos;
- cualquier outcome adicional queda fuera de sprint y se documenta como pendiente, no como alcance nuevo.

## 9) Alcance excluido (guardrails)

Explícitamente fuera de este sprint:

- cambios productivos en app/domain/infrastructure;
- apertura de frentes practitioner, ActionError fase 3, longitudinal global, lifecycle;
- modificación de backlog o validación arquitectónica;
- refactor de read model.

## 10) Definición de listo para arrancar T1

Este sprint doc queda listo para arrancar T1 cuando:

- la definición de coexistencia explícita se respeta tal cual sección 4.1;
- se mantiene secuencia T1 -> T2 (sin paralelo);
- se respeta la frontera de no cambio productivo y guardrails.
