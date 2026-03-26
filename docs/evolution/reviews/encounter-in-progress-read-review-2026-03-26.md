# Encounter read/render review after introducing `in-progress`

Date: 2026-03-26

## Findings

### 1) Patient detail selects only `finished` for "last encounter" and only `planned` for "next"

- `getPatientDetailData` composes card data from:
  - `findLastByPatientIdAndPractitionerId(...)`
  - `findNextPlannedByPatientIdAndPractitionerId(...)`
- This creates a gap for an encounter that is already started (`in-progress`): it is neither "last" nor "next planned" in the current query pair.
- Impact: the active started encounter disappears from the patient detail "Visitas" section and top CTA flow.

Code:
- `app/patients/[id]/data.ts`
- `infrastructure/fhir/repositories/encounter.fhir-repository.ts`
- `app/patients/[id]/page.tsx`

Minimal fix proposal:
- Keep writes untouched; adjust read selectors:
  - add a selector for current encounter (`status=in-progress`) by patient+practitioner, newest first, `_count=1`.
  - in patient detail load order, prefer `in-progress` as the primary actionable card/CTA target; fallback to `planned`; fallback to `finished` for last historical.

### 2) Encounter history grouping has no explicit bucket for `in-progress`

- History list groups into:
  - `planned`
  - `others`
- `in-progress` currently falls into `others`, rendered under "Sesiones anteriores".
- This is a render-bucket bug (not total omission): active encounters are shown as past sessions.

Code:
- `app/patients/[id]/encounters/components/EncounterList.tsx`

Minimal fix proposal:
- Introduce explicit groups/buckets:
  - `in-progress` (first, highlighted as current)
  - `planned` (upcoming)
  - `finished/cancelled` (history)

### 3) Status-aware temporal formatter still models only `finished` vs "everything else"

- `getEncounterRepresentativeStart` uses `actualStartAt` only when `status === finished`.
- For `in-progress`, it falls back to `periodStart` (planned timestamp), which can be stale/future and distort sort/render order.

Code:
- `lib/patient/formatters/encounter.formatters.ts`

Minimal fix proposal:
- Treat `in-progress` as actual-started for representative start:
  - if `status` is `finished` or `in-progress`, use `actualStartAt ?? periodStart`.

## Scope impact summary

- Patient detail: **affected** (missing active started encounter from selector composition).
- Encounter history: **affected** (misbucketed `in-progress` as "previous").
- Encounter detail page: **not affected for visibility** (already treats `in-progress` as editable), but some fields still display planned-period semantics in editable summary.

## Non-exhaustive status branching notes

- `EncounterList`: binary split (`planned` vs `!== planned`) is not exhaustive by intent and masks active state semantics.
- `EncounterCard`: `isPlanned` boolean drives planned vs non-planned display; no explicit `in-progress` branch.
- `getEncounterRepresentativeStart` / `getEncounterRepresentativeEnd`: branches explicitly for `finished` and "others", not exhaustive across lifecycle semantics.
