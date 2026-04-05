# FHIR Flow - Write Phase Architecture

*Operational reference for write flow · March 2026*

This document is the operational reference for write behavior in FHIR Flow.

It complements `.github/instructions/copilot.instructions.md`, which defines the global architecture rules for the repository.

> Primary authority for lifecycle, practitioner responsibility, canonical read behavior, and transitional write behavior:
> `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`

When this document and the ADR address the same topic, the ADR is authoritative.

## Purpose

This document defines how write operations work today, which architectural rules are already in force, which transitional behaviors are still accepted, and which changes are accepted as future direction but not yet implemented.

It is not a product roadmap and it is not a speculative design document. It should describe the write flow as contributors must implement it now, while making technical debt and accepted future direction explicit.

## Core Principle

Write operations follow the same hexagonal architecture as read operations, but in reverse direction.

### Read Flow

```text
FHIR Server -> FHIR Client -> Zod -> Read Mapper -> Domain Model -> UI
```

### Write Flow

```text
UI -> Server Action -> Zod -> Domain Rules Validator -> Write Repository -> Inverse Mapper -> FHIR Client -> FHIR Server
```

FHIR is an external system. FHIR resources do not cross the domain boundary in either direction.

## Write Responsibilities by Layer

### Server Action

The Server Action is the only write entry point from the UI.

**Responsibilities:**

- receive raw form data from the client
- validate input through the form Zod schema
- resolve practitioner context on the server when required
- call the domain rules validator after Zod validation
- call the write repository
- return `ActionResult`
- redirect or revalidate on success

**Rules:**

- lives under `app/.../actions/`
- never calls `fetch` directly
- never contains FHIR mapping logic
- never throws expected write errors toward the client
- always translates expected failures into `ActionResult`

### Domain Rules Validator

The domain rules validator enforces clinical coherence and business constraints after form validation and before repository execution.

**Location:** `domain/shared/domain-rules.validator.ts`

**Rules:**

- must be a pure function
- must not perform HTTP calls
- must not query repositories directly
- must not have side effects
- throws `DomainRuleError` on violation

### Write Repository

The write repository receives validated domain write input, invokes the inverse mapper, and executes the write through the FHIR client.

**Rules:**

- returns domain-level write results only
- never returns raw FHIR resources
- does not own the `ActionResult` contract
- propagates typed failures upward

`ActionResult` is the stable response contract of the Server Action, not of the repository layer.

### Inverse Mapper

The inverse mapper transforms validated write input into FHIR write payloads.

**Location:** `infrastructure/fhir/mappers/{resource}.write.mapper.ts`

**Rules:**

- is separate from read mappers
- is always a pure function
- never receives raw form data
- never resolves practitioner identity from config or session
- never executes business rules
- may throw `FhirMapperError` when required references are missing
- sets resource status inside the mapper when the resource requires it

### FHIR Client

The FHIR client executes HTTP writes and validates FHIR-side responses.

**Location:** `lib/fhir/fhir-client.ts`

**Rules:**

- validates FHIR responses
- detects `OperationOutcome` failures
- throws typed FHIR write errors
- never decides business behavior

## Validation Architecture

Write operations use multiple validation boundaries. Each boundary validates a different concern and must keep its own responsibility.

### 1. Form Schema

**Location:** `app/.../components/{Form}/{form}.schema.ts`

**Responsibility:**

- validate input shape
- validate field format
- validate local field coherence

**Rules:**

- may use `refine()` or `superRefine()` for local consistency checks
- may validate relationships between fields when the check is local to the form
- must not import from `infrastructure/`
- must not implement repository-dependent or clinical business rules

### 2. Domain Rules Validator

**Responsibility:**

- validate clinical coherence
- validate business constraints
- enforce rules that belong to the domain and not to input syntax

### 3. Inverse Mapper

**Responsibility:**

- attach mandatory references
- initialize required FHIR write fields
- construct the FHIR write payload from validated input

### 4. FHIR Client

**Responsibility:**

- validate the FHIR server response
- surface rejected writes as typed failures

### Validation Flow

```text
Client Component submits form data
  ->
Server Action receives raw input
  ->
Layer 1: Zod form validation
  - valid: continue
  - invalid: return ActionResult { success: false, error: { layer: "validation", ... } }
  ->
Layer 2: Domain rules validation
  - pass: continue
  - fail: return ActionResult { success: false, error: { layer: "domain", ... } }
  ->
Write repository executes
  ->
Inverse mapper builds FHIR payload
  ->
FHIR client sends write and validates response
  ->
Layer 4: FHIR response result
  - success: return ActionResult { success: true, data?: ... }
  - rejected write: return ActionResult { success: false, error: { layer: "fhir", ... } }
```

## ActionResult Contract

`ActionResult` is the stable write contract exposed by Server Actions.

```ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: ActionError }
```

### Stable Top-Level Error Fields

The following `ActionError` fields are stable:

- `layer`
- `message`
- `code`

### Error Layers

- `validation`
- `domain`
- `fhir`

### Transitional Detail Field

`details: unknown` remains transitional.

The accepted direction is to evolve toward typed error details by layer, without removing `ActionResult` as the Server Action contract.

Checkpoint note (2026-04-05): in encounter write, typed/normalized details are already closed in bounded scope. Outside encounter write, the current repo state has no active server-action perimeter to extend in implementation yet; remaining work is primarily documentary/drift alignment until such perimeter exists.

## Current Implemented Model

The current implemented model is a transitional write model, not the target lifecycle design.

### Create Planned Encounter

Current behavior:

- creates a single `Encounter`
- writes the encounter in `planned`
- uses a single-resource write

### Finalize Encounter

Current behavior:

- closes the encounter in `finished`
- persists the clinical resources currently supported at finalization time
- performs the write as a transactional bundle when multiple resources are involved

### Effective Runtime Lifecycle Today

```text
planned -> in-progress -> finished
```

Direct registration remains available as a creation mode that can initialize an encounter in `finished` (`completionMode: "complete"`), but this is not a transition from an existing `planned` encounter.

## Official Lifecycle and Transitional Compatibility

### Official Lifecycle

The official lifecycle defined by the ADR is:

```text
planned -> in-progress -> finished
```

Alternative terminal state:

```text
cancelled
```

### Current Transitional Compatibility

`startEncounterAction` now exists for encounters created as `planned` and enables:

```text
planned -> in-progress
```

For encounters created as `planned`, finalization now requires `in-progress`.

### Consequence for Finalization

The finalization flow is now stricter in runtime:

- `finalizeEncounterAction` does not accept `planned`
- finalization requires `in-progress`

## Practitioner Responsibility

The current system assumes one practitioner per application instance.

This document does not introduce multi-practitioner behavior.

### Rule

Practitioner identity is resolved in the Server Action and then passed through the write input.

### Required Write Context

Write inputs must carry practitioner context explicitly when needed, including:

- `performerId`
- `practitionerName`

### Boundary Rules

- configuration may expose the configured practitioner id for the instance
- Server Actions resolve the practitioner through the server-side flow
- repositories receive practitioner context through the write input
- inverse mappers use practitioner data from the input only
- inverse mappers must not read practitioner configuration directly

## Encounter Write Rules

### Encounter Creation

Encounter creation writes a planned encounter.

**Required references:**

```text
subject: Patient/{patientId}
episodeOfCare: EpisodeOfCare/{episodeOfCareId}
participant.individual: Practitioner/{performerId}
```

**Rules:**

- creation input is separate from the read model
- creation input does not carry an `id`
- the inverse mapper sets `status: "planned"`
- the Server Action owns redirect behavior after success

### Encounter Finalization

Encounter finalization closes the encounter and persists the currently supported clinical write payload.

**Rules:**

- the write operation must preserve required encounter references
- finalization belongs to the Server Action -> repository -> inverse mapper -> FHIR client flow
- the write repository executes the persistence operation, but the Server Action owns the `ActionResult` returned to the UI

## Current Clinical Write Scope

The write flow currently supports two operational clinical persistence paths:

- `registerEncounterAction`: creates the encounter as `in-progress` (`completionMode: "start"`) or `finished` (`completionMode: "complete"`) and writes the corresponding clinical snapshot in a transaction
- `saveEncounterProgressAction`: persists partial progress for encounters already in `in-progress`, replacing managed clinical resources with ownership metadata
- `startEncounterAction`: transitions an existing `planned` encounter to `in-progress`

### Operational Reality Today

- planning (`/encounters/new`) remains separated from registration (`/encounters/register`)
- register, start, and save-progress are runtime operations already available
- direct registration may still create encounters directly as `finished` (`completionMode: "complete"`)
- for encounters created as `planned`, lifecycle transitions now follow explicit `planned -> in-progress -> finished`

## Accepted Architectural Direction

The ADR accepts the following direction for future evolution:

1. Create planned encounter
2. Start encounter
3. Persist partial clinical data while the encounter is `in-progress`
4. Finalize encounter
5. Read the completed encounter from the canonical detail page

This direction is accepted.

It is not fully implemented yet.

This document must not describe those future operations as already available unless the code actually implements them.

## Canonical Read After Write

The canonical read surface for a single encounter is:

`app/patients/[id]/encounters/[encounterId]/page.tsx`

### Rule

After a successful write flow, the canonical follow-up read for a single encounter belongs on encounter detail.

### Important Current State

The ADR defines finished encounter detail as the canonical read target.

That canonical intent is in force architecturally, and current implementation has concrete progress (encounter-centric hydration paths and redirects to detail after finalize).
However, canonical read hardening for `finished` must still be treated as open debt until all remaining state/consistency gaps are explicitly validated end-to-end.

## FHIR Client Write Behavior

The FHIR client is responsible for executing write requests and validating the write result.

### Required Behavior

- detect `OperationOutcome`
- treat rejected writes as failures even if the transport status is superficially successful
- surface failures as typed FHIR write errors
- return control to the repository layer without leaking raw FHIR payloads into the UI contract

### Write Method Principles

- single-resource writes use the appropriate client method for one resource
- multi-resource atomic writes use a FHIR Transaction Bundle
- the client executes the HTTP call only; it does not decide domain behavior

## Zod and FHIR Schemas

The repository uses independent schema boundaries.

| Schema Boundary | Responsibility | Location |
|---|---|---|
| Form schema | validate raw user input | `app/.../components/{Form}/{form}.schema.ts` |
| Form local refinements | validate local cross-field coherence | same form schema file |
| FHIR schema | validate FHIR responses | `infrastructure/fhir/schemas/` |

### Rules

- form schemas do not import from `infrastructure/`
- FHIR schemas do not import from `app/`
- form-level local coherence checks stay in Zod
- domain rules stay in `domain/shared/domain-rules.validator.ts`

## Technical Debt and Transitional Behavior

The following points are recognized explicitly as current debt or transitional compatibility.

### 1. Transitional Lifecycle Simplification

The runtime still supports direct registration with immediate completion:

```text
register (complete) -> finished
```

This remains an accepted creation mode and must not be confused with lifecycle transitions for encounters created as `planned`.

### 2. Clinical Data Persistence Concentrated at Finalization

Clinical data is currently created at finalization time rather than through a separated start/save/finalize model.

This is the current implemented model, not the target end state.

### 3. Canonical Finished Detail Still Transitional

Encounter detail remains the canonical target by architecture, but complete canonical read coverage for `finished` must remain explicit debt until the pending detail hardening is closed end-to-end.

### 4. Error Detail Typing Still Transitional

`ActionResult` is stable, but `ActionError.details` is still transitional and not yet fully typed by layer.

This statement is global/transitional in scope and must not be read as a reopen signal for encounter write bounded closure.

## Implementation Guidance

When contributors add or modify write behavior, they must preserve the following order of responsibility:

1. Server Action receives input
2. Zod validates input shape and local coherence
3. Domain rules validate clinical and business logic
4. Write repository executes the use case
5. Inverse mapper produces FHIR write payloads
6. FHIR client performs the HTTP write and validates the FHIR response
7. Server Action returns `ActionResult`

## Operational Summary

### In Force Now

- Server Actions are the only write entry point from the UI
- `ActionResult` is the stable write contract at the Server Action boundary
- practitioner context is resolved in the Server Action
- inverse mappers are pure functions
- repositories do not return raw FHIR resources
- multi-resource writes use FHIR Transaction Bundle semantics where required
- `/patients/[id]/encounters/new` is planning and `/patients/[id]/encounters/register` is direct registration
- `registerEncounterAction` is operational with `completionMode: "start" | "complete"`
- `saveEncounterProgressAction` is operational for in-progress partial persistence
- encounter detail is the canonical read target by architecture

### Accepted but Not Fully Implemented

- full canonical read hardening for finished encounter detail
- peripheral follow-ups around canonical finished detail (for example, keeping history lean)
- typed error detail models by layer
  - note: encounter write bounded closure is already achieved; further extension depends on a real non-encounter implementation perimeter

### Explicitly Transitional

- finalization-time concentration of currently supported clinical writes
