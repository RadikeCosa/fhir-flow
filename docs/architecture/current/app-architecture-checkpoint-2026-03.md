# App Architecture Checkpoint — March 2026

## Purpose

This document records the latest refactors and architectural adjustments made in `app/` after the write-flow stabilization work.

It is **not** an ADR and does **not** replace the existing architecture documents.
Its purpose is to capture the current state of the UI/app-layer structure, document recent cleanup decisions, and clarify which architectural debts were resolved versus which ones remain intentionally open.

---

## Scope

This checkpoint covers changes in:

- `app/patients/[id]/data.ts`
- `app/patients/[id]/encounters/data.ts`
- `app/patients/[id]/encounters/new/page.tsx`
- `app/patients/[id]/encounters/register/page.tsx`
- `app/patients/[id]/encounters/new/data.ts`
- `app/patients/[id]/encounters/[encounterId]/data.ts`
- `app/patients/[id]/encounters/[encounterId]/page.tsx`
- local route/component organization inside `app/patients/[id]`

It does **not** redefine domain rules, FHIR mapping rules, or encounter lifecycle semantics. Those remain governed by the ADR and write-phase documents.

---

## Main goals of this refactor round

The changes in this round were guided by four goals:

1. make route structure more consistent across sibling pages
2. reduce unnecessary data loading in route loaders
3. improve architectural boundaries between data loaders and UI components
4. keep `page.tsx` files focused on route orchestration rather than data composition

---

## Changes completed

### 1. `encounters/[encounterId]/data.ts` now supports encounter-centric hydration for `in-progress`

The encounter detail loader was extended to hydrate clinical datasets by `encounterId` for both `finished` and `in-progress` encounters.

#### Result
`getEncounterDetailData()` can now resolve:

- `encounter`
- `patient`
- `practitioner`
- encounter-scoped clinical collections (vital signs, EVA, procedures)

Render semantics remain intentional: clinical blocks are still shown only in `finished`, while `in-progress` keeps an encounter-centric editable surface without duplicated read-only blocks.

---

### 2. Read-path consistency was improved for encounter detail

The encounter detail loader now validates that the loaded encounter belongs to the patient identified by the route.

This closes a gap where the read path could theoretically compose:

- one patient from `patientId`
- one encounter from `encounterId`

without explicitly verifying they matched.

#### Result
If the encounter does not belong to the patient, the route behaves as “encounter not found”, preserving the existing UX while preventing inconsistent route rendering.

---

### 3. `patients/[id]/data.ts` was decoupled from UI component types

The patient detail loader previously imported a type from `ReAssessmentSection.tsx`.

That created an undesirable dependency direction:
- loader depending on a React UI component contract

A neutral feature-level type was introduced and both the loader and the UI component now depend on that shared type.

#### Result
Data composition is no longer coupled to a component-local type definition.

This improves:
- architectural boundaries
- future refactor safety
- feature-level type reuse

---

### 4. dead contract data was removed from `encounters/data.ts`

`EncountersPageData` previously included `currentPractitionerId`, even though the route and its components did not consume it.

#### Result
The unused field was removed from:
- the interface
- the loader return shape
- related imports

This was a conservative cleanup only. No broader redesign of the loader contract was attempted in this step.

---

### 4.1. `encounters/data.ts` now separates encounter-centric vs longitudinal intent more explicitly

The read model used by encounters list/history keeps both concerns, but now with clearer boundaries:

- encounter-centric composition by `encounterId` for encounter-specific surfaces
- date-based fallback constrained to longitudinal composition only

#### Result
Temporal fallback is no longer described as a generic strategy. It is explicitly scoped to longitudinal read behavior (charts/history) and should not leak into encounter-centric surfaces.

---

### 5. `encounters/new/page.tsx` now follows the same route pattern as its siblings

The “new encounter” route used to resolve repositories and compose route data directly inside `page.tsx`.

A local `data.ts` was introduced so the route now follows the same convention already used by sibling routes:

- `page.tsx` handles route orchestration and rendering
- `data.ts` handles server-side data composition

#### Result
`encounters/new/page.tsx` is now structurally aligned with:

- `patients/[id]/page.tsx`
- `patients/[id]/encounters/page.tsx`
- `patients/[id]/encounters/[encounterId]/page.tsx`

The behavior and UX were intentionally preserved.

---

### 6. patient detail components were reorganized and colocated more accurately

Components used exclusively by the patient detail route were moved under the `[id]` route subtree.

This reduced ambiguity between:
- components shared across the patients subapp
- components local to the patient detail route

`SectionCard` was also moved to a more appropriate shared location within the patients area.

#### Result
The tree is now clearer about what is:
- route-local
- shared within `patients`
- global across the app

---

### 6.1. patient detail now uses a single encounter-centric clinical source

Patient detail now resolves one clinical encounter source:

- `inProgressEncounter ?? lastFinishedEncounter`

Clinical datasets (vital signs, EVA, procedures) are loaded from that same `encounterId`.

#### Result
Patient detail no longer mixes the encounter shown in UI with clinical data from a different encounter.
No date fallback is used in this encounter-centric surface.

---

### 7. encounter detail presentation was cleaned up

The encounter detail screen no longer exposes raw internal identifiers as primary visible information in the form area.

Additional small presentation fixes were made so route context is shown with more user-facing information and less infrastructure leakage.

#### Result
The boundary between route data and user-visible presentation is cleaner.

---

### 8. separación explícita entre planning y register quedó operativa

La estructura de rutas y CTAs ya refleja dos entry points distintos:

- `/patients/[id]/encounters/new` para planificar visita
- `/patients/[id]/encounters/register` para registrar visita

En patient detail, los CTAs condicionados por `inProgressEncounter` y `nextPlannedEncounter` cubren 4 estados explícitos.

#### Result
El app layer dejó de mezclar semánticas de planificación y registro en una sola entrada.

## Architectural outcomes

After this refactor round, the `patients` area now follows a more consistent route pattern.

### Current route convention

For route-level screens with meaningful server-side composition, the intended structure is:

- `page.tsx` → route orchestration and rendering
- `data.ts` → server-side composition / route data contract
- `components/` → local UI for that route
- `actions/` → route-local server mutations
- `*.schema.ts` → local form validation schema when applicable

This convention is now consistently present in the main patient/encounter routes.

---

## What improved

### Stronger boundaries
- loaders no longer depend on component-local UI types
- route contracts are closer to what pages actually consume
- route-level data loading is more explicit and colocated

### Better consistency
- sibling routes now follow the same structure
- the `encounters/new` route is no longer a notable outlier

### Lower accidental complexity
- dead fields were removed from loader contracts
- route loaders no longer fetch unused clinical data in known cases

### Cleaner UI contracts
- route pages receive more intentional data
- user-facing screens expose fewer internal identifiers

---

## What remains intentionally unresolved

This refactor round did **not** attempt to solve the following:

### 1. canonical read for finished encounter detail (validated, bounded scope)
`finished encounter detail` quedó validado como path canónico encounter-centric en alcance acotado (lectura por `encounterId`, sin fallback temporal como source of truth, con pruebas de no-mezcla y aislamiento de paciente).

Este cierre no implica completion del read model global: cualquier garantía fuera de este surface permanece abierta.

### 1.1. In-progress continuity (encounter detail) now has bounded closure
En `encounter detail` para `in-progress`, el app layer ahora cuenta con:

- path explícito de UI para guardar progreso;
- rehidratación loader-based por `encounterId`;
- sincronización del formulario basada en `reset(...)` cuando cambian valores canónicos derivados del loader.

Esto cierra un tramo **acotado** de continuidad (`save -> reload/remount -> rehydrate`) en ese surface.

Límite explícito: este avance **no** equivale a completar el read model ni a cerrar continuidad clínica system-wide fuera de encounter detail.

### 2. final shape of `encounters/data.ts`
The encounters loader still serves both:
- longitudinal chart data
- encounter-indexed detail maps

This is acceptable for now, but may deserve a future redesign if the route grows further.

### 3. `EncounterList` grouping/view-model logic
`EncounterList.tsx` still contains presentation-adjacent grouping logic such as:
- planned vs previous encounters
- first planned encounter prioritization
- “+N more” summary behavior

This is currently considered an acceptable imperfection, not an urgent architectural problem.

### 4. `FinalizeEncounterForm` internal size
`FinalizeEncounterForm` remains a relatively large client component.
It is currently acceptable because it is still route-local and cohesive enough, but it remains a candidate for future partitioning if the flow grows.

### 5. encounter lifecycle target state
The runtime implementation now supports explicit transition for planned encounters (`planned -> in-progress -> finished`) via `startEncounterAction` + stricter finalization.
Direct register creation can still initialize an encounter as `finished` by explicit user intention.
The official lifecycle target remains defined in the ADR and has not changed as part of this refactor round.

---

## Current guidance for future changes in `app/`

When changing route-level UI in the patients/encounters area:

1. prefer adding or updating a local `data.ts` instead of growing `page.tsx`
2. keep loader contracts aligned to actual page usage
3. do not define loader types inside React UI components
4. keep route-local forms colocated with their schema and actions
5. avoid introducing dead fields “just in case”
6. treat grouping/ordering logic carefully: move it only when it becomes clearly reusable or too heavy for UI

---

## Status summary

### Resolved in this round
- encounter-centric hydration path in encounter detail (`finished` + `in-progress`)
- patient/encounter read-path mismatch handling
- UI type dependency inside patient detail loader
- dead field in encounters page loader
- route-pattern inconsistency in `encounters/new`
- route-local component colocation issues
- some infrastructure leakage into encounter detail presentation
- patient detail clinical-source mismatch (single encounter source + same `encounterId` datasets)
- explicit separation between encounter-centric reads and longitudinal date fallback

### Still open
- canonical-read cleanup fuera de `finished encounter detail` (por ejemplo, history load shape y otras surfaces)
- possible future redesign of `encounters/data.ts`
- possible future slimming of `EncounterList`
- possible future partitioning of `FinalizeEncounterForm`
- lifecycle transition beyond the current transitional runtime model
- complete in-progress clinical continuity in UI (do not treat as closed by finished-detail validation)
- continuidad system-wide fuera de encounter detail `in-progress` (incluye validación browser E2E y escenarios longitudinales/históricos)

---

## Related documents

For authoritative architectural rules and lifecycle decisions, see:

- `guia-rapida.md`
- `docs/validation/validacion-arquitectonica.md`
- `write-phase-architecture.md`
- `ADR-001-encounter-lifecycle-and-write-architecture.md`

This checkpoint is intentionally narrower: it records the current state of the `app/` layer after the latest refactor round.
