# Sprint — Hardening acotado de ActionError.details fuera de encounter write (fase 3)

- Status: closed-evidence (cierre por evidencia diagnóstica/documental)
- Fecha: 2026-04-05
- Ejecución actual: **T1-A — inventario del perímetro objetivo fuera de encounter write**

## A. Files reviewed

- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/write-phase-architecture.md`
- `docs/sprints/sprint-hardening-contrato-errores-actions-fase1.md`
- `docs/sprints/sprint—hardening-final-action-errordetails-fase2.md`
- `docs/sprints/sprint—practitioner-consistency-encounter-write-flows.md`
- `docs/sprints/sprint-continuidad-clinica-full-system.md`
- `domain/shared/action-result.types.ts`
- `domain/shared/action-error.helpers.ts`
- `domain/shared/__tests__/action-error.helpers.test.ts`
- Server Actions bajo `app/**/actions/*.action.ts`
- Tests de acciones bajo `app/**/actions/__tests__/*.test.ts`

## B. Inventario del perímetro (T1-A)

### Resultado de inventario

No se detectaron Server Actions **fuera de encounter write** que hoy devuelvan `ActionResult` o construyan/propaguen `ActionError`.

La totalidad de Server Actions con `"use server"` y contrato `ActionResult` encontradas pertenece al frente encounter write ya cerrado en fase 2.

### Server Actions encontradas (fuera de perímetro de este sprint)

| Archivo | Frente funcional | Usa helper central | Variantes observadas | Shape actual de `details` | Tests relevantes |
|---|---|---|---|---|---|
| `app/patients/[id]/encounters/new/actions/create-encounter.action.ts` | Encounter write (`new`) | Sí (`buildValidationActionError`, `buildDomainActionError`, `buildFhirActionError`) | `validation`, `domain`, `fhir` | `validation`: `formErrors/fieldErrors`; `domain`: sin `details`; `fhir`: `FhirActionErrorDetails` opcional | `app/patients/[id]/encounters/new/actions/__tests__/create-encounter.action.test.ts` |
| `app/patients/[id]/encounters/new/actions/register-encounter.action.ts` | Encounter write (`register`) | Sí | `validation`, `domain`, `fhir` | Igual al contrato compartido | `app/patients/[id]/encounters/new/actions/__tests__/register-encounter.action.test.ts` |
| `app/patients/[id]/encounters/[encounterId]/actions/start-encounter.action.ts` | Encounter write (`start`) | Sí | `validation`, `domain`, `fhir` | Igual al contrato compartido | `app/patients/[id]/encounters/[encounterId]/actions/__tests__/start-encounter.action.test.ts` |
| `app/patients/[id]/encounters/[encounterId]/actions/save-encounter-progress.action.ts` | Encounter write (`save-progress`) | Sí | `validation`, `domain`, `fhir` | Igual al contrato compartido | `app/patients/[id]/encounters/[encounterId]/actions/__tests__/save-encounter-progress.action.test.ts` |
| `app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts` | Encounter write (`finalize`) | Sí | `validation`, `domain`, `fhir` | Igual al contrato compartido | `app/patients/[id]/encounters/[encounterId]/actions/__tests__/finalize-encounter.action.test.ts` |

### Contrato/herramientas compartidas relevadas

- `ActionResult` se mantiene como contrato estable de Server Action.
- `ActionError` está tipado por capa en tipos compartidos (`validation`, `domain`, `fhir`).
- Helper central disponible para construcción normalizada por capa.

## C. Perímetro excluido explícito

Fuera de este sprint (y fuera de esta ejecución T1-A):

1. **Encounter write fase 2 ya cerrado**
   - `createEncounterAction`, `registerEncounterAction`, `startEncounterAction`, `saveEncounterProgressAction`, `finalizeEncounterAction`.
2. **Continuidad/read/browser E2E**
   - continuidad clínica bounded/full-system;
   - browser E2E bounded/global;
   - hardening read model.
3. **Practitioner/lifecycle**
   - practitioner consistency en encounter write;
   - lifecycle transitions.
4. **Longitudinal/histórico**
   - hardening global longitudinal/histórico fuera del cierre acotado previo.

## D. Riesgos o ambigüedades detectadas (solo inventario)

1. **Perímetro objetivo sin acciones candidatas actuales fuera de encounter write**
   - con el estado del repo relevado, T1-A no identifica acciones no-encounter sobre las que extender adopción de `ActionError.details`.

2. **Ambigüedad documental entre fuentes**
   - backlog/validación: fase 2 cerrada en encounter write y pendiente fuera de ese frente;
   - write-phase: wording aún transicional para `ActionError.details`.

3. **Riesgo de interpretación de alcance**
   - sin un inventario de nuevas acciones no-encounter, el siguiente paso podría confundirse con reapertura de encounter write (explícitamente fuera de alcance).

## E. Confirmación explícita de scope

Se ejecutó **solo T1-A (inventario)**.

No se avanzó a:

- T1-B,
- T2 (matriz de gaps),
- T3 (hardening),
- T4 (regresión/documentación de cierre).

No se tocó código productivo.
No se propusieron fixes.
No se amplió el scope.

---

## F. Resolución diagnóstica del perímetro vacío (checkpoint posterior a T1-A)

### B. Validación del perímetro

Con el estado actual del repo, **no existe perímetro operativo real fuera de encounter write** para esta fase 3.

Evidencia operativa:

- las únicas Server Actions con `"use server"` están bajo `app/patients/[id]/encounters/...` (frente encounter write);
- no aparecen acciones no-encounter que devuelvan `ActionResult` ni construyan `ActionError` usando helper central;
- fuera de `encounters/` solo quedan tipos/helpers compartidos y documentación/tests de helper.

### C. Resolución de la ambigüedad

Diagnóstico: **mezcla de estados** con predominio de drift documental.

1. **Sin deuda real de implementación confirmada** fuera de encounter write en el runtime actual, porque no hay acciones candidatas fuera de ese frente.
2. **Sí hay drift documental** entre fuentes:
   - backlog/validación mantienen pendiente “fuera de encounter write” como deuda abierta de extensión;
   - write-phase mantiene wording transicional amplio para `ActionError.details`.
3. El remanente puede leerse hoy como **deuda nominal sin perímetro operativo actual** (pendiente arquitectónica válida, pero sin landing zone implementable en el estado actual del repo).

### D. Recomendación única

**Cierre por evidencia diagnóstica/documental + corrección documental mínima (T4 documental), sin avanzar a T1-B/T2/T3.**

Rationale de alcance:

- no hay perímetro real para matriz de gaps/hardening;
- avanzar a T1-B/T2 forzaría inventar perímetro o reabrir encounter write, ambos fuera de alcance;
- corresponde registrar cierre por evidencia del perímetro vacío y alinear wording documental para evitar deuda “fantasma”;
- no implica reapertura de encounter write;
- no se sobredeclara cierre global.

### E. Confirmación explícita de scope

- No se tocó código productivo.
- No se reabrió encounter write.
- No se avanzó a T1-B/T2/T3.
- No se amplió scope a UX/read/continuidad/practitioner/lifecycle/longitudinal.
