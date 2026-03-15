---
description: Architecture and coding rules for the FHIR Flow healthcare learning lab.
applyTo: "**"
---

# FHIR Flow — Architecture & Coding Guidelines

FHIR Flow is a learning laboratory focused on building a healthcare application using the **FHIR R4 standard** with **clean / hexagonal architecture**.

The project models a **home hospitalization workflow** where healthcare professionals (primarily kinesiologists) perform patient visits at home.

The goal is to learn how **real healthcare systems structure software around clinical data and FHIR interoperability**.

The project prioritizes:

- architecture correctness
- data integrity
- explicit system boundaries
- maintainable code

Avoid demo-style shortcuts.

---

# Technology Stack

- Next.js (App Router)
- TypeScript (strict)
- Server Components first
- Tailwind CSS
- Recharts (charts)
- Zod (runtime validation)
- HAPI FHIR R4 server
- Node runtime

---

# Clinical Workflow Model

The system models a hierarchical clinical structure.

Patient  
→ EpisodeOfCare  
→ Encounter (home visit)  
→ Clinical records created during the visit:

- Vital signs
- Assessments (EVA pain scale)
- Procedures

Encounters are the **central clinical event** where observations and procedures occur.

---

# Architecture Overview

The project uses **Hexagonal Architecture (Ports and Adapters)**.

Layer flow:

config  
→ http client  
→ FHIR utilities  
→ repositories  
→ domain  
→ UI

FHIR is treated as an **external system**.

FHIR resource structures must **never cross the domain boundary**.

---

# Core Architecture Rules (MANDATORY)

## 1. Strict Layer Boundaries

Layers must not be bypassed.

Rules:

- UI must not call `fetch`
- UI must not consume raw FHIR JSON
- Domain must not depend on FHIR structures
- Infrastructure logic must not exist in UI
- External data must be validated before mapping

---

## 2. FHIR Is External

FHIR resources are **external models**, not domain models.

Required transformation flow:

FHIR Resource  
→ Zod validation  
→ Mapper  
→ Domain model  
→ UI

Forbidden:

FHIR → mapper → domain

Mapping must always occur **after validation**.

Domain models must remain:

- stable
- predictable
- UI-oriented
- independent from FHIR

---

## 3. Single HTTP Boundary

All communication with the FHIR server must go through:


lib/fhir/fhir-client.ts


No other module may use `fetch`.

The client must:

- apply configuration
- normalize responses
- detect `OperationOutcome`
- throw typed errors
- handle HTTP failures

---

## 4. Runtime Validation

All FHIR responses must be validated using **Zod** before mapping.

Required flow:

HTTP response  
→ Zod schema validation  
→ Mapper  
→ Domain model

Mapping unvalidated data is forbidden.

Invalid resources may be safely ignored if validation fails.

---

# Repository Pattern

The **domain defines repository interfaces**.

Infrastructure implements them using FHIR.

Example structure:


domain/patient.repository.ts
infrastructure/patient.fhir-repository.ts


Repositories orchestrate:

1. HTTP request
2. Zod validation
3. mapping to domain
4. return domain models

Repositories **never return FHIR resources**.

UI depends only on repository contracts.

---

# Domain Model Summary

Core domain entities:

### Patient

Represents a person receiving care.

Key attributes:

- id
- identifier
- name
- birthDate
- gender
- contact information

---

### EpisodeOfCare

Represents a treatment episode grouping multiple visits.

Examples:

- motor rehabilitation
- respiratory therapy
- palliative care

---

### Encounter

Represents a **home visit performed by a professional**.

Encounters are the **central clinical unit**.

Attributes include:

- visit type (initial, follow-up, discharge)
- practitioner participant
- visit start / end
- duration
- visit reason

---

### VitalSignRecord

Represents grouped vital signs recorded during a visit.

FHIR stores vital signs as **separate Observation resources**.

Infrastructure mappers aggregate them into a single domain record grouped by:

- date
- performer

Examples:

- heart rate
- respiratory rate
- oxygen saturation
- temperature
- blood pressure

---

### Assessment

Clinical evaluations performed during encounters.

Currently supported instrument:

EVA pain scale (LOINC 72514-3).

---

### Procedure

Represents therapeutic procedures performed during a visit.

Examples:

- therapeutic exercise
- respiratory drainage
- mobilization

Procedures are linked to:

- patient
- encounter
- practitioner

---

# FHIR-Specific Rules

## Bundle Handling

FHIR search responses return a **Bundle**.

Never assume:

- `entry` exists
- entries are ordered
- resources are complete

Always validate safely.

---

## References

FHIR references are not foreign keys.

Examples:


Observation.subject → Patient
Observation.encounter → Encounter
Observation.performer → Practitioner


These references must be **resolved or mapped explicitly**.

---

## Identifiers

FHIR identifiers contain two components:


system
value


Never treat identifiers as plain strings.

---

## LOINC Codes Used

Important clinical codes:

| Code | Meaning |
|-----|------|
8867-4 | Heart rate
9279-1 | Respiratory rate
59408-5 | Oxygen saturation
8310-5 | Body temperature
55284-4 | Blood pressure
72514-3 | EVA pain scale

---

# UI Architecture

UI is implemented with **Next.js App Router** using **Server Components by default**.

Guidelines:

- prefer server-side data fetching
- minimal client state
- no business logic in UI
- UI only consumes domain models

Only one client component currently exists:


VitalSignsChart


This component uses **Recharts** and requires the browser DOM.

---

# Data Fetching Pattern

Pages fetch data using repositories.

When multiple independent queries are required, use parallel fetching.

Example pattern:


const [patient, episodes, vitalSigns, assessments] = await Promise.all([
patientRepo.findById(id),
episodeRepo.findAllByPatientId(id),
vitalRepo.findAllByPatientId(id),
assessmentRepo.findEvaByPatientId(id),
])


---

# Configuration Rules

Configuration must exist only in the **config layer**.

Environment variables must be validated and typed.

Required variables:


FHIR_BASE_URL
CURRENT_PRACTITIONER_ID


No other module may read environment variables directly.

---

# Code Style Rules

## TypeScript

- strict mode required
- no `any`
- explicit types preferred
- avoid unsafe casts
- use generics when appropriate

---

## Functions

Functions should be:

- small
- composable
- single responsibility
- pure when possible

Mappers must always be pure functions.

---

## Error Handling

Rules:

- never fail silently
- throw explicit errors
- normalize FHIR errors
- do not rely on console logging

---

# Performance Expectations

Generated code should:

- avoid unnecessary HTTP requests
- avoid over-fetching FHIR resources
- support pagination
- use `summary` or `elements` parameters when appropriate

---

# AI Behavior Guidelines

When generating code:

- prioritize architecture correctness
- respect layer boundaries strictly
- avoid demo-style shortcuts
- generate maintainable code
- prefer explicit logic over implicit behavior

---

# Forbidden Patterns

The following are not allowed:

- UI calling `fetch`
- exposing FHIR structures outside infrastructure
- mapping unvalidated data
- mixing validation and mapping
- business logic inside UI
- infrastructure logic inside domain

---

# If Requirements Are Unclear

Do not assume behavior.

Instead:

- ask for clarification
- explain architectural tradeoffs