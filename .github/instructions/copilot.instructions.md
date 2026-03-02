---
description: Project architecture, healthcare domain constraints, and coding rules for the FHIR Flow learning lab. Load for any code generation, review, or questions related to the project.
applyTo: "**"
---

# FHIR Flow — Project Context & Coding Guidelines

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

This project is a learning lab focused on building a healthcare application using the FHIR R4 standard with clean / hexagonal architecture principles.

The goal is to learn how real healthcare systems are structured — not to build quick demos.

---

# Project Context

## Stack

- Next.js (App Router)
- TypeScript (strict mode)
- Server Components first
- Tailwind
- FHIR R4 server (HAPI FHIR)
- Zod for runtime validation
- Node runtime

## Architecture Goals

- Strong separation of concerns
- Domain-driven design principles
- Anti-corruption layer between FHIR and UI
- Runtime validation of external data
- Production-grade error handling
- Testable and maintainable code
- Explicit system boundaries

---

# Core Architecture Rules (MANDATORY)

## 1. Layered / Hexagonal Architecture

Respect strict boundaries between layers.


config → http client → FHIR utilities → repositories → domain → UI


Rules:

- Never bypass layers.
- UI must not call fetch directly.
- UI must not consume raw FHIR JSON.
- Domain must not depend on FHIR structures.
- Infrastructure logic must not exist in UI.

---

## 2. FHIR Is External — Never Domain

FHIR resources are external models.

Always map:


FHIR resource → domain model → UI


Domain models must be:

- simple
- stable
- predictable
- UI-friendly
- independent from FHIR structure

Never expose FHIR resource shapes outside infrastructure.

---

## 3. Single HTTP Boundary

All HTTP communication with the FHIR server must go through:


lib/fhir/fhir-client.ts


Never use fetch outside this module.

The client must:

- use configuration from config layer
- normalize responses
- handle HTTP errors
- detect and handle OperationOutcome
- throw explicit typed errors

---

## 4. Runtime Validation Required

All FHIR responses must be validated using Zod before mapping.

Flow:


HTTP → validate → map → domain


Never map unvalidated data.

---

## 5. Repository Pattern

Domain defines repository interfaces.

Infrastructure implements them.

Example:


domain/patient.repository.ts → interface
infrastructure/patient.fhir-repository.ts → implementation


UI depends only on repository contracts.

---

## 6. Server Components First

- Prefer server-side data fetching.
- Avoid client state unless necessary.
- Avoid global mutable state.

---

# Code Style Rules

## TypeScript

- Strict typing required.
- No `any`.
- Prefer explicit types.
- Use generics when appropriate.
- Avoid unsafe casting.
- Environment variables must be typed.

## Functions

- Single responsibility.
- Small and composable.
- Pure when possible.

## Error Handling

- Never silently fail.
- Throw explicit errors.
- Normalize FHIR errors.
- Do not rely on console logging.

## Naming

Use healthcare-accurate terminology:

- resourceType
- identifier
- reference
- bundle
- encounter
- observation

---

# FHIR-Specific Rules

## Bundle Handling

FHIR search responses return a Bundle.

Never assume:

- `entry` exists
- order of entries
- resource completeness

Always handle safely.

## Identifiers

FHIR identifiers must include:


system + value


Never treat identifiers as plain strings.

## References

FHIR references are not foreign keys.

They must be resolved or mapped explicitly.

---

# Configuration Rules

- All configuration must come from config layer.
- No hardcoded URLs.
- All environment variables must be validated.

Required variable:


FHIR_BASE_URL


---

# Testing Expectations

Generated code should be testable.

Prefer:

- pure functions
- dependency injection
- minimal side effects
- low framework coupling

---

# Performance Expectations

- Avoid unnecessary data fetching.
- Avoid over-fetching FHIR resources.
- Support pagination.
- Use summary or elements parameters when possible.

---

# What AI Should Optimize For

When generating code:

- prioritize architecture correctness over brevity
- avoid demo-style shortcuts
- respect layer boundaries strictly
- produce maintainable code
- explain important design decisions
- prefer explicit logic over implicit behavior

---

# What AI Must Avoid

- direct UI → fetch calls
- leaking FHIR types into UI
- mixing validation and mapping
- untyped responses
- business logic inside infrastructure
- overly complex abstractions

---

# If Requirements Are Unclear

Ask for clarification and explain tradeoffs instead of assuming behavior.

---

# Project Goal

Learn how real healthcare systems structure software around FHIR interoperability and clinical data architecture.