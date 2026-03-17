---
description: Architecture and coding rules for the FHIR Flow healthcare learning lab.
applyTo: "**"
---

# FHIR Flow — Architecture & Coding Guidelines

Home hospitalization app where kinesiologists manage patient visits. Built on **FHIR R4** with **hexagonal architecture**.

Stack: Next.js App Router · TypeScript strict · Tailwind CSS v4 · Zod · HAPI FHIR R4 · Recharts

---

# Layer Flow

```
config → fhir-client → infrastructure (schemas · mappers · repositories) → domain → UI
```

FHIR is an external system. Its structures never cross the domain boundary.

---

# Non-Negotiable Rules

- UI never calls `fetch`
- UI never consumes raw FHIR JSON
- Domain has no FHIR dependencies
- All FHIR data is validated with **Zod before mapping** — never after, never without
- All HTTP goes through `lib/fhir/fhir-client.ts` exclusively
- Repositories return domain models only — never FHIR resources
- Never fail silently — throw explicit typed errors
- No `any`

---

# Validation Architecture

Write operations require **multi-layer validation**. Each layer validates a different aspect.

## Validation Layers (in order)

1. **Form Schema (Zod)** — shape, format, required fields
   - Location: `app/.../components/{Form}/{form}.schema.ts`
   - Scope: User input syntax (is it a valid ISO datetime? is the field filled?)
   - Can use `refine()` / `superRefine()` for **local field coherence** (e.g., if pressure systolic exists, diastolic must also exist)
   - **Cannot** import from `infrastructure/` — form is UI-only

2. **Domain Rules Validator** — clinical coherence, business constraints
   - Location: `domain/shared/domain-rules.validator.ts`
   - Scope: Clinical and business logic (e.g., "diastolic cannot be higher than systolic", "discharge encounter must include a discharge note")
   - Called by Server Action **after** Zod validation, **before** repository
   - Pure function. No HTTP calls. No side effects.
   - Throws `DomainRuleError` if rules are violated

3. **Inverse Mapper** — reference validity, status initialization
   - Location: `infrastructure/fhir/mappers/{resource}.write.mapper.ts`
   - Scope: Attach mandatory clinical references, verify they are non-empty, set resource status
   - Throws `FhirMapperError` if required references are missing
   - **Does not validate form data** — assumes input is already validated by layers 1–2

4. **FHIR Client** — HTTP response validation
   - Location: `lib/fhir/fhir-client.ts`
   - Scope: Validate FHIR server response with Zod, detect `OperationOutcome` errors
   - Throws `FhirWriteError` if server rejects the write

## Validation Flow Diagram

```
Client Component (form data)
        ↓
Server Action receives form data
        ↓
Layer 1: Zod Form Schema validation
   ✓ If valid → continue
   ✗ If invalid → return ActionResult { success: false, error: { layer: "validation", ... } }
        ↓
Layer 2: Domain Rules Validator
   ✓ If rules pass → continue
   ✗ If rules fail → return ActionResult { success: false, error: { layer: "domain", ... } }
        ↓
Write Repository.create(validatedInput)
        ↓
Inverse Mapper (pure function, no validation)
        ↓
FHIR Client.post() / .postBundle()
        ↓
Layer 3: FHIR response validation (built into fhir-client)
   ✓ If 201/200 → return ActionResult { success: true, data: { id } }
   ✗ If OperationOutcome → return ActionResult { success: false, error: { layer: "fhir", ... } }
```

## Example: VitalSignRecord validation

**Form Schema** (Zod refine):
```typescript
.refine(
  (data) => {
    // If systolic exists, diastolic must also exist
    if (data.bloodPressureSystolic && !data.bloodPressureDiastolic) {
      return false;
    }
    return true;
  },
  { message: "Blood pressure must include both systolic and diastolic" }
)
```

**Domain Rules** (separate validator):
```typescript
// domain-rules.validator.ts
validateVitalSignRules(input: VitalSignRecordInput): void {
  if (input.bloodPressureDiastolic > input.bloodPressureSystolic) {
    throw new DomainRuleError("Diastolic cannot exceed systolic");
  }
  if (!hasAtLeastOneVital(input)) {
    throw new DomainRuleError("At least one vital sign is required");
  }
}
```

---

# Write Phase

> Full reference: `docs/write-phase-architecture.md`

Write flow:

```
Client Component → Server Action → Zod → Domain Rules Validator → Write Repository → Inverse Mapper → FHIR Client → FHIR Server
```

Planned phases — in implementation order:

1. Create planned encounter with clinical note — single `Encounter` POST
2. Register vital signs — multiple `Observation` via Transaction Bundle
3. Register procedures — multiple `Procedure` via Transaction Bundle
4. Register assessments — single `Observation` POST
5. Close visit — `Encounter` status update

Rules:

- Server Actions are the only write entry point from the UI
- Server Actions always return `ActionResult` — never throw toward the client
- Every resource written must carry its required clinical references
- Multi-resource writes use a **FHIR Transaction Bundle** — individual POSTs are forbidden
- Write input types are separate from read models and have no `id`
- Inverse mapper is separate from the read mapper and is always a pure function
- Form Zod schema and FHIR Zod schema never cross-import
- Domain rules validation is **mandatory** between Zod and the repository — never skip
- Resource status is always set in the inverse mapper — never in the form or Server Action
- "Plan visit" button only renders when EpisodeOfCare status is active — enforced in the Server Component

Implementation order (per phase): `ActionResult` → `ActionError` → write input type → domain rules validator → repository interface → fhir-client → inverse mapper → repository impl → Server Action → form schema → Client Component → wire into page

---

*FHIR Flow · Coding Guidelines · v1.3*