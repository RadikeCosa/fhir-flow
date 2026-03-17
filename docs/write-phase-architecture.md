# FHIR Flow — Write Phase Architecture

*Reference document · Write phase v1.3 · Marzo 2026*

This document is the authoritative reference for all **write operations** in FHIR Flow.
It complements `copilot_instructions.md`, which covers global architecture rules.
When both documents address the same topic, this document takes precedence for write-related code.

---

## 1. Core Principle

Write operations follow the **same hexagonal architecture** as read operations but in reverse direction.

Read flow:

```
FHIR Server → FHIR Client → Zod → Read Mapper → Domain Model → UI
```

Write flow:

```
UI → Server Action → Zod → Domain Rules → Write Repository → Inverse Mapper → FHIR Client → FHIR Server
```

The same layer boundaries apply. FHIR never crosses the domain boundary in either direction.

---

## 2. Clinical Write Flow — Planned Phases

Write features are implemented in this order, following the natural clinical workflow:

| Phase | Feature | FHIR Resource | Complexity |
|---|---|---|---|
| 1 | Create planned encounter with clinical note | `Encounter` | Single resource POST |
| 2 | Register vital signs in an encounter | `Observation` ×N | Transaction Bundle |
| 3 | Register procedures in an encounter | `Procedure` ×N | Transaction Bundle |
| 4 | Register clinical assessments (EVA, etc.) | `Observation` | Single resource POST |
| 5 | Close visit (planned → finished) | `Encounter` PATCH | Single resource update |

Each phase exercises the same write stack with a different resource.
The pattern learned in Phase 1 scales directly to all subsequent phases.

---

## 3. UI Architecture — Clinical Navigation Flow

### 3.1 Entry Point — Patient Detail Page

The "Plan visit" button lives in the **EpisodeOfCare section** of the patient detail page (`/patients/[id]`).

Rules:
- The button only renders when `episodeOfCare.status === "active"`
- If the episode is closed, no button is shown — enforced in the Server Component, no client logic needed
- Clicking the button navigates to the create encounter form page

### 3.2 Create Encounter Form Page

Route: `/patients/[id]/encounters/new`

A dedicated page with a form to plan a new visit:
- Visit type (initial / follow-up / re-assessment / discharge)
- Planned date and time
- Optional clinical preparation note

On successful submission, redirects to the new encounter's detail page.

### 3.3 Encounter Detail Page

Route: `/patients/[id]/encounters/[encounterId]`

Renders differently based on encounter status:

- `status: "planned"` → encounter info + **write forms** to register clinical data
- `status: "finished"` → encounter info + **read-only** clinical data

The Server Component checks `encounter.status` and renders accordingly.
This is the page where Phases 2–5 progressively add new capabilities.

### 3.4 Known Technical Debt

Registering observations on a `planned` encounter without transitioning it to `finished` is clinically imprecise.
This is a deliberate simplification for the learning lab.
Phase 5 (close visit) resolves this debt by implementing the status transition explicitly.

See section 11: Technical Debt Register for the complete list.

---

## 4. New Actors in the Write Phase

### 4.1 Server Action

The **only** entry point for write operations from the UI.

Responsibilities:
- Receive raw form data from a Client Component
- Validate input using a **Zod form schema** (independent from FHIR schemas)
- **Call domain rules validator** (NEW in v1.3)
- Call the write repository
- Call `revalidatePath` or `redirect` on success
- Return `ActionResult` — never throw toward the client

Rules:
- Lives inside `app/` co-located with the route it serves: `app/.../actions/{name}.action.ts`
- Never contains FHIR logic
- Never calls `fetch` directly
- Always returns `ActionResult`
- Must call `validateDomainRules()` after Zod validation, before repository call

### 4.2 Domain Rules Validator

Validates **clinical coherence and business constraints** after Zod validates shape.

Responsibilities:
- Receive a Zod-validated domain write input
- Check clinical rules (e.g., "diastolic ≤ systolic", "at least one vital is required")
- Check business rules (e.g., "discharge encounter must have a discharge reason")
- Throw explicit `DomainRuleError` if any rule is violated
- Be a **pure function** with no side effects

Rules:
- Lives in `domain/shared/domain-rules.validator.ts`
- Never calls the FHIR client or repository
- Never makes HTTP calls
- Never queries the database (use Server Action for context if needed)
- Is called by Server Action, not by any other layer
- Always throws on violation — never returns an error object

Example:
```typescript
// domain/shared/domain-rules.validator.ts

export function validateEncounterRules(input: EncounterInput): void {
  // All checks are explicit. No silent failures.
  if (!input.performerId) {
    throw new DomainRuleError("Encounter must have a performer");
  }
  if (!input.periodStart) {
    throw new DomainRuleError("Encounter must have a planned start date");
  }
  // Add more rules as needed per phase
}
```

### 4.3 Inverse Mapper

Transforms a **domain write input** into one or more **FHIR resources**.

Responsibilities:
- Receive a validated domain write input type
- Produce valid FHIR resource(s) ready to send
- Attach mandatory clinical references
- Be a **pure function** with no side effects

Rules:
- Lives in `infrastructure/fhir/mappers/{resource}.write.mapper.ts`
- Always a separate file from the read mapper
- Never receives raw form data
- Never calls the FHIR client directly
- Always sets resource status — never delegated to form or Server Action
- Can throw `FhirMapperError` if required references are missing (shouldn't happen after domain rules validation, but as a safety net)

### 4.4 Write Repository Method

An additional method on the existing repository interface.

Responsibilities:
- Receive a domain write input type
- Call the inverse mapper
- Send the result through the FHIR client
- Return `ActionResult` with the created resource ID — never return a FHIR resource

Rules:
- Defined on the existing domain repository interface
- Implemented in the existing FHIR repository class
- Errors propagate to the Server Action — never caught silently
- Must return `ActionResult<{ id: string }>` (see section 5.1)

---

## 5. ActionResult Type

All write operations return a typed `ActionResult`. No exceptions reach the client.

```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: ActionError }
```

Lives in `domain/shared/action-result.types.ts`.
Defined once. Reused by all write operations across all phases.

### 5.1 ActionError Type

Errors are **typed by layer**, not generic strings.

```typescript
type ErrorLayer = "validation" | "domain" | "fhir"

type ActionError = {
  layer: ErrorLayer
  message: string
  code?: string  // e.g., "PRESSURE_INCOMPLETE", "FHIR_CONFLICT", "MISSING_REFERENCE"
  details?: unknown  // e.g., full OperationOutcome for layer: "fhir"
}

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: ActionError }
```

**Layer meanings:**

| Layer | Source | Thrown by | Example |
|-------|--------|-----------|---------|
| `validation` | Form Zod schema | Server Action (Zod.parse error) | Invalid datetime format |
| `domain` | Domain rules validator | `validateDomainRules()` | Diastolic > systolic |
| `fhir` | FHIR Client response | `fhir-client.ts` post() / postBundle() | Server rejected with OperationOutcome |

**Example usage in Server Action:**

```typescript
export async function createEncounterAction(
  formData: unknown
): Promise<ActionResult<{ encounterId: string }>> {
  // Layer 1: Zod validation
  const parseResult = createEncounterFormSchema.safeParse(formData);
  if (!parseResult.success) {
    return {
      success: false,
      error: {
        layer: "validation",
        message: "Invalid form data",
        code: "FORM_VALIDATION_FAILED",
        details: parseResult.error.flatten()
      }
    };
  }

  // Layer 2: Domain rules validation
  try {
    validateEncounterRules(parseResult.data);
  } catch (error) {
    if (error instanceof DomainRuleError) {
      return {
        success: false,
        error: {
          layer: "domain",
          message: error.message,
          code: error.code
        }
      };
    }
    throw error;
  }

  // Layer 3: Repository (includes mapper + FHIR client)
  try {
    const result = await encounterRepository.create(parseResult.data);
    return {
      success: true,
      data: { encounterId: result.id }
    };
  } catch (error) {
    if (error instanceof FhirWriteError) {
      return {
        success: false,
        error: {
          layer: "fhir",
          message: error.message,
          code: error.code,
          details: error.operationOutcome
        }
      };
    }
    throw error; // Unexpected error, let it bubble (should be logged)
  }
}
```

---

## 6. Write Input Types

Every resource that supports write operations has a dedicated **write input type** in the domain.
Write input types are always separate from read models.

| Read model | Write input type |
|---|---|
| Has `id` (resource exists in FHIR) | Has **no `id`** (resource does not exist yet) |
| Has resolved references `{ id, display }` | Has string references: `patientId`, `encounterId`, `performerId` |
| Represents stored data for display | Represents professional intent |

Write input types live in:

```
domain/{resource}/{resource}.write-input.ts
```

---

## 7. Phase 1 — Encounter Write Specifics

### 7.1 EncounterInput

Fields required to create a planned encounter:

| Field | Type | Notes |
|---|---|---|
| `patientId` | string | Reference to Patient |
| `episodeOfCareId` | string | Reference to EpisodeOfCare |
| `performerId` | string | Reference to Practitioner (from env: CURRENT_PRACTITIONER_ID) |
| `visitType` | EncounterVisitType | initial / follow-up / re-assessment / discharge |
| `periodStart` | string | ISO datetime — planned visit date and time |
| `clinicalNote` | string \| null | Optional preparation note |

### 7.2 Mandatory References on Encounter

Every Encounter written to FHIR must include:

```
subject:       { reference: "Patient/{patientId}" }
episodeOfCare: [{ reference: "EpisodeOfCare/{episodeOfCareId}" }]
participant:   [{ individual: { reference: "Practitioner/{performerId}" } }]
```

The inverse mapper is responsible for attaching these.
If any required reference is missing, the mapper must throw a typed error before calling FHIR.

### 7.3 Initial Status

Every Encounter created through this form starts with `status: "planned"`.
Status is set by the inverse mapper, never by the form or Server Action.

### 7.4 Post-creation Redirect

On success, the Server Action calls `redirect` to `/patients/[id]/encounters/[newEncounterId]`.
The new encounter ID is extracted from the FHIR server's response by the repository and returned in `ActionResult<{ encounterId: string }>`.

---

## 8. Phase 2 — VitalSignRecord Write Specifics

### 8.1 The Multi-Observation Problem

In the read direction, the mapper **aggregates** multiple FHIR Observations into one `VitalSignRecord`.
In the write direction, the inverse mapper **decomposes** one `VitalSignRecordInput` into **multiple FHIR Observation resources** — one per parameter with a non-null value.

### 8.2 Atomic Write via FHIR Transaction Bundle

Multiple Observations must be written atomically using a **FHIR Transaction Bundle**.

```
Bundle
  resourceType: "Bundle"
  type: "transaction"
  entry: [
    { resource: Observation, request: { method: "POST", url: "Observation" } },
    ...
  ]
```

Individual POSTs for multi-Observation writes are forbidden.

### 8.3 Mandatory References on Observations

```
subject:   { reference: "Patient/{patientId}" }
encounter: { reference: "Encounter/{encounterId}" }
performer: [{ reference: "Practitioner/{performerId}" }]
```

### 8.4 LOINC Codes

| Parameter | LOINC Code | Unit |
|---|---|---|
| Heart rate | 8867-4 | /min |
| Respiratory rate | 9279-1 | /min |
| Oxygen saturation | 59408-5 | % |
| Body temperature | 8310-5 | Cel |
| Blood pressure systolic | 8480-6 | mm[Hg] |
| Blood pressure diastolic | 8462-4 | mm[Hg] |

Blood pressure produces **two Observations** when recorded.

---

## 9. FHIR Client — Write Methods

The existing `fhir-client.ts` must be extended with:

- `post(path, body)` — single resource POST, returns the created resource
- `postBundle(bundle)` — Transaction Bundle POST to `/fhir`

Rules:
- Both methods detect `OperationOutcome` in the response and throw a typed `FhirWriteError`
- `post()` extracts and returns the new resource ID from the response (needed for Phase 1 redirect)
- `postBundle()` verifies no failed entries in the response Bundle
- A `201 Created` with an `OperationOutcome` body is an error, not a success
- The client never decides what to write — it only executes the HTTP call

`post()` is used in Phases 1 and 4 (single resource writes).
`postBundle()` is used in Phases 2 and 3 (multi-resource writes).

---

## 10. Zod Schemas — Three Independent Boundaries

| Schema | Purpose | Location |
|---|---|---|
| Form schema | Validates raw user input | `app/.../components/{Form}/{form}.schema.ts` |
| Form refine/superRefine | Cross-field coherence (local only) | Same as form schema |
| FHIR response schema | Validates FHIR server responses | `infrastructure/fhir/schemas/` |

Rules:
- Form schemas must not import from `infrastructure/`
- FHIR schemas must not import from `app/`
- Form `refine()` can check local coherence (e.g., "if systolic exists, diastolic must exist") but **cannot** implement clinical rules
- Clinical rules belong in `domain/shared/domain-rules.validator.ts`

---

## 11. Domain Rules Validator

Validates **clinical coherence and business constraints** that cross-cut form fields or require domain context.

Lives in: `domain/shared/domain-rules.validator.ts`

### 11.1 When to Use Domain Rules Validator

Use domain rules when validation requires:
- **Context** (e.g., "this discharge note is required if visitType is discharge")
- **Clinical logic** (e.g., "diastolic ≤ systolic")
- **Cross-cutting concerns** (e.g., "at least one vital sign is present")
- **Business constraints** (e.g., "a new encounter cannot overlap with an active one")

### 11.2 When NOT to Use Domain Rules Validator

Don't use domain rules for:
- **Simple format checks** (use Zod)
- **Field-level constraints** (use Zod `refine()`)
- **HTTP calls** (HTTP belongs in FHIR Client, not validator)
- **Database queries** (pass context from Server Action if needed)

### 11.3 Error Type

Domain rules throw `DomainRuleError`:

```typescript
export class DomainRuleError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "DomainRuleError";
  }
}
```

### 11.4 Example: Encounter Domain Rules

```typescript
// domain/shared/domain-rules.validator.ts

export function validateEncounterRules(input: EncounterInput): void {
  if (!input.performerId) {
    throw new DomainRuleError(
      "Encounter must have a performer",
      "MISSING_REFERENCE"
    );
  }

  if (!input.periodStart) {
    throw new DomainRuleError(
      "Encounter must have a planned start date",
      "INVALID_PERIOD"
    );
  }

  // Add more rules as phases progress
  // Phase 2: validateVitalSignRules
  // Phase 3: validateProcedureRules
  // etc.
}
```

---

## 12. Technical Debt Register

This is a living register of **deliberate simplifications** made for the learning lab. Each item documents:
- **What** was simplified
- **Why** it was simplified
- **When** it will be addressed (which phase)

| Item | Description | Reason | Resolution Phase | Notes |
|------|-------------|--------|------------------|-------|
| Encounter status transitions | Encounters start as `"planned"` and jump directly to `"finished"`. No intermediate states (`"arrived"`, `"in-progress"`). | MVP simplification. Intermediate states add conditional logic to many forms. | Phase 5 | Clinically imprecise but acceptable for learning lab. Phase 5 will implement full state machine. |
| Observations on planned Encounter | Vital signs, procedures, and assessments can be recorded on a `"planned"` Encounter without changing its status. | Clinical reality requires status transition during visit, but simplifying for Phase 1–4. | Phase 5 | Phase 5 closes this by implementing status transitions. Acknowledged in section 3.4. |
| No encounter overlap detection | A practitioner can create overlapping Encounters for the same patient. | Would require a reference to active Encounters at form submission time. | TBD (Phase 4?) | Low priority for learning lab. Relevant if booking system is added. |
| Domain rules validator is stateless | Domain rules cannot query the database or call external services. | Keeps validator pure and testable. | TBD | If rule checks require DB context, pass it from Server Action. |
| No transaction rollback handling | If a Bundle transaction partially fails, the client receives the failed Bundle response but doesn't retry or partially recover. | FHIR server guarantees atomicity. Learning lab simplifies client-side error handling. | TBD | Production code should implement retry logic for transient failures. |

---

## 13. Folder Structure

```
domain/
  shared/
    action-result.types.ts                          ← NEW (Phase 1, reused by all phases)
    domain-rules.validator.ts                       ← NEW (Phase 1, reused by all phases)
    error-types.ts                                  ← NEW (DomainRuleError, FhirMapperError)
  encounters/
    encounter.ts                                    ← existing read model
    encounter.repository.ts                         ← extended with create() method
    encounter.write-input.ts                        ← NEW (Phase 1)
  vital-sign-record/
    vital-sign-record.types.ts                      ← existing read model
    vital-sign-record.repository.ts                 ← extended with create() method
    vital-sign-record.write-input.ts                ← NEW (Phase 2)

infrastructure/fhir/
  mappers/
    encounter.mapper.ts                             ← existing read mapper (unchanged)
    encounter.write.mapper.ts                       ← NEW (Phase 1)
    vital-sign-record.mapper.ts                     ← existing read mapper (unchanged)
    vital-sign-record.write.mapper.ts               ← NEW (Phase 2)
  repositories/
    encounter.fhir-repository.ts                    ← extended with create()
    vital-sign-record.fhir-repository.ts            ← extended with create()

lib/fhir/
  fhir-client.ts                                    ← extended with post() and postBundle()
  fhir-errors.ts                                    ← NEW (FhirWriteError, FhirMapperError)

app/patients/[id]/
  page.tsx                                          ← "Plan visit" button added to EpisodeOfCare section
  encounters/
    new/
      page.tsx                                      ← NEW (Phase 1): create encounter form page
      actions/
        create-encounter.action.ts                  ← NEW (Phase 1)
      components/
        CreateEncounterForm/
          index.tsx                                 ← NEW (Phase 1)
          create-encounter-form.schema.ts           ← NEW (Phase 1)
    [encounterId]/
      page.tsx                                      ← NEW: detail page, conditional render by status
      actions/
        record-vital-signs.action.ts               ← NEW (Phase 2)
      components/
        VitalSignsForm/
          index.tsx                                 ← NEW (Phase 2)
          vital-signs-form.schema.ts               ← NEW (Phase 2)
```

---

## 14. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Write input type | `{Resource}Input` | `EncounterInput`, `VitalSignRecordInput` |
| Domain rules function | `validate{Resource}Rules` | `validateEncounterRules` |
| Domain rules validator file | Always `domain-rules.validator.ts` | Shared across all resources |
| Inverse mapper file | `{resource}.write.mapper.ts` | `encounter.write.mapper.ts` |
| Inverse mapper function | `mapToFhir{Resource}` | `mapToFhirEncounter` |
| Server Action file | `{verb}-{resource}.action.ts` | `create-encounter.action.ts` |
| Server Action function | `{verb}{Resource}Action` | `createEncounterAction` |
| Write repository method | `create` | `encounterRepo.create(input)` |
| Form schema file | `{form-name}.schema.ts` | `create-encounter-form.schema.ts` |
| Form schema type | `{FormName}FormValues` | `CreateEncounterFormValues` |
| Error types | `{Context}Error` | `DomainRuleError`, `FhirWriteError`, `FhirMapperError` |

---

## 15. Implementation Order (per phase)

For every new write feature, always follow this sequence:

1. `domain/shared/action-result.types.ts` — once, skip if already exists
2. `domain/shared/error-types.ts` — once, skip if already exists (DomainRuleError, FhirMapperError, etc.)
3. `domain/{resource}/{resource}.write-input.ts`
4. Extend `domain/{resource}/{resource}.repository.ts` with write method signature
5. `domain/shared/domain-rules.validator.ts` — add `validate{Resource}Rules()` function
6. Extend `lib/fhir/fhir-client.ts` with `post()` / `postBundle()` — once per method, skip if already exists
7. Extend `lib/fhir/fhir-errors.ts` if needed (FhirWriteError, FhirMapperError)
8. `infrastructure/fhir/mappers/{resource}.write.mapper.ts`
9. Extend `infrastructure/fhir/repositories/{resource}.fhir-repository.ts` with create() implementation
10. `app/.../actions/{verb}-{resource}.action.ts`
11. `app/.../components/{Form}/{form}.schema.ts`
12. `app/.../components/{Form}/index.tsx`
13. Wire Client Component into the Server Component page

---

## 16. Forbidden Patterns

- Server Action calling `fetch` directly
- Client Component calling a repository method directly
- Writing to FHIR without required clinical references
- Individual POSTs for multi-resource writes — use Transaction Bundle
- Catching errors silently inside write repositories
- Catching errors silently inside domain rules validator
- Form schema importing from FHIR infrastructure
- Form schema implementing clinical rules (use domain rules validator)
- Write input type containing FHIR field names
- Inverse mapper containing HTTP logic
- Inverse mapper validating rules (mapper assumes input is already valid)
- Setting resource status from the Server Action or form — always set in the inverse mapper
- Rendering "Plan visit" button when EpisodeOfCare is not active
- Domain rules validator making HTTP calls
- Domain rules validator querying the database (pass context from Server Action if needed)
- Using `any` type in error objects
- Server Action catching all errors with `.catch()` without differentiating error types

---

*FHIR Flow · Write Phase Architecture · v1.3*