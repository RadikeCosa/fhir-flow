# STEPS.md (archivo histórico)

Este documento era un "recorrido paso a paso" del estado inicial del proyecto, con descripciones extensas de archivos y responsabilidades de cada módulo en la arquitectura hexagonal FHIR Flow.

## ¿Qué era?
- Un inventario de ubicaciones de código y propósito funcional en `config/`, `lib/`, `domain/`, `infrastructure/`, y `app/`.
- Era referencia operativa informal para aprender la estructura del prototipo.

## ¿Por qué quedó obsoleto?
- Su contenido es un snapshot estático de código, no una fuente de verdad mantenida.
- La arquitectura ya está formalizada en `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` y `docs/write-phase-architecture.md`.
- La guía de implementación y reglas vigentes se encuentran ahora en `docs/write-phase-architecture.md` y en los `domain/*` + `infrastructure/*` con validaciones, mappers y repositorios.

## ¿Qué documentos lo reemplazan?
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` (arquitectura autorizada de encuentro y fases de escritura)
- `docs/write-phase-architecture.md` (flujo de validación y normativas concretas)
- `docs/validacion-arquitectonica.md` (normas de validación transversales)

## Recomendación de acción
- Mantenerlo en `docs/archive/` como registro histórico.
- No usarlo como referencia activa en decisiones de arquitectura o flujo de escritura.
