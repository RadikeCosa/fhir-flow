---
description: Architecture and coding rules for the FHIR Flow healthcare learning lab.
applyTo: "**"
---

# FHIR Flow - Architecture & Coding Guidelines

FHIR Flow is a home hospitalization learning lab where kinesiologists manage patient encounters. The application is built on FHIR R4 and follows a hexagonal architecture.

**Stack:** Next.js App Router, TypeScript strict mode, Tailwind CSS v4, Zod, HAPI FHIR R4, Recharts

> Primary architectural authority for encounter lifecycle, practitioner responsibility, canonical read behavior, and transitional write behavior:  
> `docs/adr/ADR-001-visit-lyfecicle-and-write-arquitecture.md`

## Purpose

This document defines the internal development rules that govern architecture, validation, write behavior, terminology, and error handling across the repository.

It is intended to be an authority document. When implementing or reviewing code, contributors must follow these rules unless an ADR explicitly supersedes them.

## Layer Flow

```text
config -> fhir-client -> infrastructure (schemas, mappers, repositories) -> domain -> UI
```

FHIR is an external system. Its structures never cross the domain boundary.

## Non-Negotiable Rules

- UI never calls `fetch`
- UI never consumes raw FHIR JSON
- Domain has no FHIR dependencies
- All FHIR data is validated with Zod before mapping, never after and never without validation
- All HTTP goes through `lib/fhir/fhir-client.ts` exclusively
- Repositories return domain models only, never FHIR resources
- Silent failures are not allowed; throw explicit typed errors
- `any` is not allowed

## Terminology

Use terminology consistently across all layers.

### Technical Term

**Encounter** is the technical term for:

- domain models
- repository interfaces
- mappers
- FHIR resources
- architecture documentation

### Product Term

**Visit** is the product and UI term for:

- labels
- user-facing copy
- product-oriented flows

### Naming Rule

Never mix both terms in the same technical identifier.

Forbidden examples:

- `VisitEncounter`
- `encounterVisit`

## Validation Architecture

Write operations require multi-layer validation. Each layer validates a different concern and must remain within its own responsibility.

### Validation Layers

#### 1. Form Schema (Zod)

**Location:** `app/.../components/{Form}/{form}.schema.ts`

**Responsibility:**

- validate input shape
- validate input format
- validate local field coherence

**Rules:**

- may use `refine()` or `superRefine()` for local consistency checks
- may validate form-level relationships between fields
- must not import from `infrastructure/`

#### 2. Domain Rules Validator

**Location:** `domain/shared/domain-rules.validator.ts`

**Responsibility:**

- validate clinical coherence
- validate business constraints

**Rules:**

- runs in the Server Action after Zod validation and before the repository call
- must be a pure function
- must not make HTTP calls
- must not have side effects
- throws `DomainRuleError` when rules are violated

#### 3. Inverse Mapper

**Location:** `infrastructure/fhir/mappers/{resource}.write.mapper.ts`

**Responsibility:**

- attach mandatory clinical references
- initialize resource status
- transform validated write input into FHIR write payload

**Rules:**

- may throw `FhirMapperError` if required references are missing
- must not validate form data
- must not execute business rules
- must not resolve practitioner identity from config or session
- must remain a pure function

#### 4. FHIR Client

**Location:** `lib/fhir/fhir-client.ts`

**Responsibility:**

- validate FHIR server responses with Zod
- detect `OperationOutcome` errors
- surface rejected writes as typed failures

**Rules:**

- throws `FhirWriteError` if the FHIR server rejects the write

### Validation Flow

```text
Client Component (form data)
  ->
Server Action receives form data
  ->
Layer 1: Zod Form Schema validation
  - valid: continue
  - invalid: return ActionResult { success: false, error: { layer: "validation", ... } }
  ->
Layer 2: Domain Rules Validator
  - pass: continue
  - fail: return ActionResult { success: false, error: { layer: "domain", ... } }
  ->
Write Repository.create(validatedInput)
  ->
Inverse Mapper (pure function, no business validation)
  ->
FHIR Client.post() / postBundle()
  ->
Layer 4: FHIR response validation
  - 200 / 201: return ActionResult { success: true, data: { id } }
  - OperationOutcome or rejected write: return ActionResult { success: false, error: { layer: "fhir", ... } }
```

### Example: `VitalSignRecord` Validation

#### Form Schema

```ts
.refine(
  (data) => {
    if (data.bloodPressureSystolic && !data.bloodPressureDiastolic) {
      return false;
    }
    return true;
  },
  { message: "Blood pressure must include both systolic and diastolic" }
)
```

#### Domain Rules

```ts
validateVitalSignRules(input: VitalSignRecordInput): void {
  if (input.bloodPressureDiastolic > input.bloodPressureSystolic) {
    throw new DomainRuleError("Diastolic cannot exceed systolic");
  }

  if (!hasAtLeastOneVital(input)) {
    throw new DomainRuleError("At least one vital sign is required");
  }
}
```

## Write Phase

**Full reference:** `docs/write-phase-architecture.md`  
**Lifecycle and write authority:** `docs/adr/ADR-001-visit-lyfecicle-and-write-arquitecture.md`

### Authoritative Write Flow

```text
Client Component -> Server Action -> Zod -> Domain Rules Validator -> Write Repository -> Inverse Mapper -> FHIR Client -> FHIR Server
```

### Current Implemented Write Model

The current runtime behavior is a simplified transitional model.

#### Create Planned Encounter

- single `Encounter` POST

#### Finalize Encounter

- transactional write that closes the `Encounter`
- persists the clinical resources required at finalization time

### Effective Runtime Transition Today

```text
planned -> finished
```

This transition is accepted as **transitional compatibility**, not as the target lifecycle design.

### Official Lifecycle Direction

The official architectural lifecycle is:

```text
planned -> in-progress -> finished
```

Alternative terminal state:

```text
cancelled
```

### Current Reality vs Future Direction

- `in-progress` already exists in domain and UI expectations
- there is still no explicit write operation that produces `in-progress`
- `planned -> finished` remains temporarily allowed until `startEncounterAction` exists
- once `in-progress` becomes operational in write flow, finalization must require `in-progress` instead of `planned`

### Accepted Write Evolution

The long-term write direction is:

1. Create planned encounter
2. Start encounter
3. Save partial clinical data while the encounter is `in-progress`
4. Finalize encounter
5. Read the completed encounter from the canonical detail page

This direction is accepted, but it is not fully implemented yet and must follow ADR-001.

### Write Rules

- Server Actions are the only write entry point from the UI
- Server Actions always return `ActionResult`; they never throw toward the client
- `ActionResult` is the stable contract; future improvements apply to typed `ActionError.details`, not to removing `ActionResult`
- Every written resource must carry its required clinical references
- Multi-resource writes use a FHIR Transaction Bundle
- Write input types are separate from read models and do not carry `id`
- The inverse mapper is separate from the read mapper and is always a pure function
- Form Zod schemas and FHIR Zod schemas never cross-import
- Domain rules validation is mandatory between Zod validation and the repository call
- Resource status is always set in the inverse mapper, never in the form
- Practitioner identity is resolved in the Server Action and then passed through the write input
- Inverse mappers must never import practitioner identity from config
- The "Plan visit" button only renders when `EpisodeOfCare.status` is `active`; this is enforced in the Server Component

## Encounter Lifecycle Rules

### Official Lifecycle States

- `planned`
- `in-progress`
- `finished`
- `cancelled`

### State Meaning

#### `planned`

A scheduled encounter that has not started yet.

- no clinical write is required yet

#### `in-progress`

An encounter that has started and may contain partial clinical data.

- editable

#### `finished`

A closed encounter.

- read-only

#### `cancelled`

A cancelled encounter.

- read-only

### Transitional Compatibility Rule

Until `startEncounterAction` is implemented, `finalizeEncounterAction` may operate on encounters in `planned`.

This is a legacy compatibility rule. It is not the intended final architecture.

## Practitioner Responsibility Rules

The current system assumes one practitioner per application instance.

### Current Model

- `CURRENT_PRACTITIONER_ID` is instance configuration only
- Server Actions resolve practitioner identity through `getCurrentPractitioner()`
- write inputs must carry practitioner context explicitly

### Required Write Context

Write inputs must include:

- `performerId`
- `practitionerName`

### Responsibility Boundaries

- repositories receive practitioner context through the write input
- inverse mappers use practitioner context from the input only
- create and finalize flows must follow the same practitioner model

This document does not introduce multi-practitioner behavior.

## Canonical Read Rules

The canonical read surface for a single encounter is:

`app/patients/[id]/encounters/[encounterId]/page.tsx`

### Canonical Read Requirements

- the encounter history page is a summary and navigation surface
- a finished encounter detail must hydrate clinical data from repositories
- post-submit UI state is never the canonical source of truth
- after finalization, the redirect should land on encounter detail, which must re-read persisted data

## Error Contract Rules

Server Actions always return `ActionResult`.

### Stable Error Contract

The following `ActionError` fields are stable top-level fields:

- `layer`
- `message`
- `code`

### Current Transitional Detail

- `details: unknown` is transitional
- validation errors should evolve toward typed field-level details
- the target direction is a typed error model by layer

### Error Layers

- `validation`
- `domain`
- `fhir`

### UI Requirement

The UI should be able to consume field-level validation details safely once typed support is implemented.

## Forbidden

The following are forbidden:

- UI calling `fetch`
- UI consuming raw FHIR JSON directly
- domain importing FHIR types or FHIR schemas
- inverse mapper validating form data
- inverse mapper executing business rules
- inverse mapper resolving practitioner identity from config
- repositories returning raw FHIR resources
- silent catch blocks
- skipping domain rules validation in write flows
- treating `planned -> finished` as the final lifecycle design
- using encounter history as the canonical read surface for a single finished encounter

## Implementation Order

### Per Write Phase

1. `ActionResult`
2. `ActionError`
3. write input type
4. domain rules validator
5. repository interface
6. `fhir-client`
7. inverse mapper
8. repository implementation
9. Server Action
10. form schema
11. Client Component
12. wire into the page

### For Lifecycle Evolution

1. Harden current create and finalize contracts
2. Align practitioner context in create and finalize
3. Make encounter detail the canonical read surface for finished encounters
4. Introduce explicit `startEncounterAction`
5. Introduce partial write support for `in-progress`
6. Remove transitional `planned -> finished` behavior
