# ADR-001: Encounter Lifecycle and Write Architecture

**Status:** Proposed  
**Date:** 2026-03  
**Project:** FHIR Flow

> Este ADR es el documento de autoridad para:
> - ciclo de vida de Encounter (planned, in-progress, finished, cancelled)
> - responsabilidad de practitioner en el write flow
> - dirección de atomicidad de write (current finalization vs future draft path)
> - dirección de ActionResult / ActionError
> - canonical read behavior para encounter detail

## Context

FHIR Flow models home care visits using the FHIR R4 `Encounter` resource.

The current write flow already supports creating a planned encounter and closing it through a final transactional write. However, the implemented runtime behavior is still a simplified subset of the intended lifecycle:

- `createEncounter` creates an `Encounter` in `planned`
- `finalizeEncounter` closes it directly in `finished`
- the domain already defines `in-progress` and `cancelled`
- the UI already anticipates `in-progress`
- there is still no explicit write operation that produces `in-progress`

At the same time, several architectural inconsistencies need to be resolved before the write flow evolves further:

- practitioner context is resolved inconsistently between create and finalize
- the create inverse mapper still reads configuration directly instead of receiving complete write context from the Server Action
- all clinical data currently gets created only at finalization time
- the error contract exposes useful validation details, but the form layer cannot consume them safely
- the Encounter detail page is not yet the canonical read surface for a completed encounter

This ADR defines the architectural baseline for:
- Encounter lifecycle
- practitioner responsibility in write flows
- current and future write atomicity
- ActionResult / ActionError direction
- canonical read behavior for encounter detail

This ADR does not implement new features by itself. It exists to align repository code, documentation, and upcoming hardening tickets.

## Decisions

### 1. Vocabulary

Two vocabularies are used in different layers:

- **Visit** is the product/UI term
- **Encounter** is the technical/domain/FHIR term

#### Rule

- UI labels, breadcrumbs, user-facing messages, and product-oriented documentation must use **visit**
- domain types, repository interfaces, server actions, mappers, schemas, and FHIR documentation must use **Encounter**
- mixed identifiers such as `VisitEncounter`, `encounterVisit`, or similar hybrids are not allowed

#### Rationale

The project already uses this distinction informally. Formalizing it prevents naming drift and makes product language clearer without weakening the technical model.

---

### 2. Official lifecycle

The official lifecycle of a visit is:

- `planned`
- `in-progress`
- `finished`
- `cancelled`

#### State meanings

##### `planned`
A visit has been scheduled but not yet started.  
No clinical data is expected yet.

- operational state
- editable
- intended detail behavior: planning/start context

##### `in-progress`
A visit has been started and may contain partial clinical data.

- operational state
- editable
- intended detail behavior: active clinical form with partial save and finalization

##### `finished`
A visit has been closed and contains the final clinical data required by the system.

- terminal state
- read-only
- intended detail behavior: canonical clinical read view

##### `cancelled`
A scheduled or active visit has been cancelled.

- terminal state
- read-only
- intended detail behavior: readonly cancelled visit with cancellation context

#### Transitional reality

The system currently operates in practice with:

`planned -> finished`

This is explicitly treated as a **transitional legacy simplification**, not as the target lifecycle.

#### Rationale

The domain and UI already anticipate `in-progress`, but no write transition exists yet. This ADR formalizes the intended lifecycle while clearly documenting the current temporary behavior.

---

### 3. Allowed transitions

#### Target transition model

- `planned -> in-progress`
- `in-progress -> finished`
- `planned -> cancelled`
- `in-progress -> cancelled`

`finished` and `cancelled` are terminal states.

#### Transitional compatibility

Until `startEncounterAction` exists, the system may continue to allow:

- `planned -> finished`

This path is considered **compatibility-only** and must be removed once `in-progress` becomes operational in write flow.

#### Consequence

`finalizeEncounterAction` is expected to become stricter in the future:

- today it may accept `planned`
- once `startEncounterAction` exists, it should require `in-progress`

#### Rationale

This makes the transition map explicit and avoids treating the current simplified path as permanent design.

---

### 4. Practitioner model and responsibility

The current system assumes **one practitioner per application instance**.

This ADR does **not** introduce multi-practitioner support.

#### Current model

- `CURRENT_PRACTITIONER_ID` is instance configuration
- the current practitioner identity is resolved server-side
- the resolved practitioner context must be passed into the write input before repository execution

#### Responsibility split

##### Configuration
`config/fhir.config.ts` is responsible for exposing the configured practitioner id for the instance.

##### Server Action
The Server Action is responsible for resolving the current practitioner through the FHIR layer and obtaining:

- `performerId`
- `practitionerName`

##### Domain write input
Write inputs must carry the practitioner context explicitly.

##### Mapper
Reverse mappers must use practitioner data from the write input and must **not** read config directly.

#### Immediate architectural correction required

`CreateEncounterInput` must include:

- `performerId: string`
- `practitionerName: string`

The create mapper must stop importing practitioner config directly.

#### Rationale

Mappers must remain pure transformation functions. Practitioner resolution belongs to the Server Action, not to the mapper.

#### Extension note

If the project evolves toward multi-practitioner behavior in the future, the natural extension point is the server-side identity resolution layer, not the mapper layer.

---

### 5. Write atomicity

This ADR distinguishes three levels clearly:

#### 5.1 Current implemented model

Today, all clinical data is created at finalization time.

`finalizeEncounter` currently performs a single transactional FHIR bundle that includes:

- Encounter update
- vital Observations
- EVA Observation
- Procedures

This is the correct description of the current implemented model.

#### 5.2 Accepted architectural direction

Once `in-progress` becomes an operational state, the system should support **partial clinical persistence before final closure**.

That implies a future operation conceptually distinct from finalization, referred to here as:

- `saveEncounterDraft`

This future capability is accepted as an architectural direction.

#### 5.3 Still-open operational design decisions

The following are intentionally **not closed** by this ADR:

- deduplication strategy between draft data and finalization
- update-versus-append behavior for draft writes
- idempotency strategy for repeated draft saves
- exact persistence strategy for draft writes:
  - batch bundle
  - transaction bundle
  - individual POST/PUT operations
- minimal scope of draft support in the first iteration

#### Principle

Future atomicity should be thought of **per operation**, not as “all-or-nothing for the entire visit lifecycle”.

#### Rationale

The current bundle-at-finalize model is acceptable for the current simplified lifecycle. The future draft model is accepted directionally, but operational details should be decided in the dedicated implementation ticket, not guessed prematurely here.

---

### 6. `clinicalNote` rule

This ADR distinguishes between:

- the rule currently implemented
- the correct architectural placement of the rule
- the possibility of future clinical revision

#### Current implemented rule

`clinicalNote` is currently required when finalizing a visit.

#### Architectural judgment

That rule is currently placed in the correct layer:

- format-level validation belongs in Zod/schema
- business requirement of final clinical note belongs in domain validation

Therefore:

- schema-level presence may remain permissive or minimally strict
- domain rules remain the final authority for closure requirements

#### UX consequence

The UI should clearly indicate that `clinicalNote` is required when closing a visit, so the user does not discover that only after submit.

#### Future openness

The current rule should not be treated as eternal clinical truth.

If clinical criteria later require conditional behavior by `visitType`, that evolution should happen in domain rules, not by moving the rule into schema.

#### Rationale

This preserves the correct architecture while acknowledging that the current business rule is a valid implemented rule, but still reviewable if clinical requirements evolve.

---

### 7. Error contract direction

`ActionResult<T>` remains the correct high-level response contract for Server Actions.

The direction of evolution is to move `ActionError.details` away from `unknown` and toward a typed discriminated model by error variant.

#### Stable guarantees for all UI consumers

Every UI consumer must be able to rely on:

- `layer`
- `message`
- `code` when present

This enables generic banners and fallback rendering.

#### Direction for typed variants

##### Validation error
Must support stable field-level and form-level validation output.

Expected capability:
- `fieldErrors`
- `formErrors`

##### Domain error
Must support stable business-rule identification.

Expected capability:
- `message`
- `code`

Additional details are optional and not required for base UI handling.

##### FHIR error
Must support structured FHIR-side failure information when relevant.

Expected capability may include:
- `OperationOutcome`
- normalized issue list
- transport or HTTP context when useful

#### Important note

This ADR closes the **direction** toward typed error variants, but does not freeze the exact final TypeScript shape yet.

#### Rationale

The repo already produces useful validation detail, but the current `unknown` contract prevents safe UI consumption. The change should be directional and explicit, while allowing exact implementation shape to be decided in the dedicated ticket.

---

### 8. Canonical read model

The canonical read unit for a single visit is:

`/patients/[id]/encounters/[encounterId]`

#### Rule

The visit detail page must be the canonical read surface for a specific visit.

That means:

- after finalization, redirect goes to visit detail
- the detail page must rehydrate from repositories / source of truth
- it must not depend on ephemeral client submit state as the canonical source

#### History page role

The encounters history page is a summary and navigation surface.

It may expose useful indicators or compact summaries, but it must not remain the primary clinical read surface for an individual visit.

#### Current inversion acknowledged

Today the repo is inverted:

- history hydrates more clinical data than detail
- detail of a finished visit only shows Encounter-level fields

This is recognized as technical debt and must be corrected by the “canonical detail by state” ticket.

#### Rationale

A specific visit must be readable from its own detail URL. The history page should guide and summarize, not replace the canonical detail view.

---

## Consequences

This ADR enables and constrains the next implementation steps.

### Immediate consequences

- `CreateEncounterInput` must be extended to include `performerId`
- the create mapper must stop reading practitioner config directly
- transitional `planned -> finished` behavior must be documented explicitly as temporary
- the canonical-read gap in finished encounter detail becomes an explicit debt item
- the error contract direction becomes explicit for future typing work

### Medium-term consequences

The next write evolution will likely introduce explicit operations such as:

- start visit
- save draft
- finalize visit

But the exact draft persistence design is intentionally left open for its own ticket.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `planned -> finished` remains normalized as if it were final design | Document it explicitly as compatibility-only transitional behavior |
| Practitioner handling stays inconsistent between create and finalize | Move practitioner context fully into write input and keep mappers pure |
| Draft write gets designed prematurely without enough operational clarity | Keep draft direction accepted, but leave deduplication/idempotency/open mechanics to dedicated ticket |
| `clinicalNote` becomes treated as immutable doctrine | Document it as current rule plus future review possibility |
| Error typing change breaks current consumers | Keep stable top-level fields and evolve typed details in a backwards-compatible way |
| History continues to act as canonical clinical view | Explicitly define detail as canonical and open a follow-up implementation ticket |

---

## Decision status summary

### Closed decisions

- UI/product uses **visit**
- technical layers use **Encounter**
- official lifecycle includes `planned`, `in-progress`, `finished`, `cancelled`
- `finished` and `cancelled` are terminal
- practitioner resolution belongs to the Server Action
- mappers must not read practitioner config directly
- canonical read for an individual visit belongs to the detail page
- error contract direction must move away from `details: unknown`

### Partially closed decisions

- `planned -> finished` remains temporarily allowed until explicit start exists
- future partial persistence during `in-progress` is accepted directionally
- typed error variants are accepted directionally, but exact final shape is still implementation detail
- current `clinicalNote` rule remains in force, but may be clinically revisited later

### Open decisions

- exact behavior of `startEncounterAction`
- exact draft persistence mechanics
- deduplication/idempotency strategy for partial writes
- cancellation behavior and cancellation payload requirements
- whether `clinicalNote` later becomes conditional by `visitType`
- how far history simplification should go once detail becomes canonical

---

## Acceptance criteria for this ADR

This ADR is accepted when:

1. It is added to the repository as a formal ADR
2. Other architecture documents reference it as the source of authority for lifecycle and write responsibilities
3. Future tickets use it as the baseline for:
   - create/finalize hardening
   - practitioner context correction
   - start/save/finalize split
   - canonical detail read
   - typed action errors

---

## Follow-up tickets enabled by this ADR

- hardening of `createEncounter` and `finalizeEncounter`
- add `performerId` to create write input
- remove practitioner config usage from create mapper
- define and implement explicit start operation
- define detail page as canonical read by state
- evolve `ActionError` typing away from `unknown`

---

## References

This ADR should be referenced from and aligned with:

- `docs/write-phase-architecture.md`
- `copilot.instructions.md`
- encounter detail flow under `app/patients/[id]/encounters/[encounterId]/`
- shared action result types under `domain/shared/action-result.types.ts`

---

## 9. Encounter creation modes

This ADR distinguishes two different concepts that must not be conflated:

- **Lifecycle** describes the state transitions of an existing Encounter
- **Creation modes** describe how an Encounter is initially created

Creation modes do not replace lifecycle rules. They only define the initial state at the moment of creation. After creation, the normal lifecycle transitions still apply.

### Valid creation modes

The system supports three valid creation modes:

- **create planned**: used through the plan visit flow to create an Encounter in `planned`
- **create in-progress**: used through the register visit flow when the visit is opened with partial save semantics
- **create finished**: used through the register visit flow when the visit is created and finalized immediately

These creation modes define the first persisted state of the Encounter. They do not change the lifecycle model once the Encounter exists.

### Model update

The Encounter model explicitly allows direct creation in the following states:

- `planned`
- `in-progress`
- `finished`

This means an Encounter may be created directly as `in-progress` or directly as `finished` when the register visit flow requires it.

### Interaction with lifecycle

The canonical lifecycle remains:

`planned -> in-progress -> finished`

The lifecycle still governs state transitions after creation.

- `startEncounterAction` is still required only for Encounters that were created as `planned`
- `finalizeEncounterAction` should eventually require `in-progress`, except for the temporary compatibility path described below

Creation mode only determines the initial state. Once the Encounter has been created, lifecycle rules decide which transitions are valid next.

### Transitional compatibility

The current compatibility rule remains in place:

- `planned -> finished` is still temporarily allowed

At the same time, the register visit flow may create an Encounter directly as `finished`.

This compatibility behavior does not replace the canonical lifecycle. It only preserves the existing temporary path while direct creation modes are introduced.
