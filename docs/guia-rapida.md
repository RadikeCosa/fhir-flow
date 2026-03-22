# Guía rápida de documentación

Esta guía es el punto de entrada principal para navegar la documentación vigente del proyecto.

## Autoridad (source of truth)

- [`docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`](./adr/ADR-001-encounter-lifecycle-and-write-architecture.md): autoridad para lifecycle de `Encounter`, canonical read y reglas estructurales del write flow. Leer cuando la duda sea normativa o de diseño aceptado.
- [`docs/write-phase-architecture.md`](./write-phase-architecture.md): autoridad operativa del write flow actual. Leer cuando la duda sea cómo debe comportarse la escritura hoy dentro del marco definido por el ADR.
- [`.github/instructions/copilot.instructions.md`](../.github/instructions/copilot.instructions.md): autoridad externa del repositorio para reglas globales, límites de capas y convenciones transversales. Leer cuando el tema exceda un flujo puntual.

## Estado actual (cómo está implementado hoy)

- [`docs/architecture/current/app-architecture-checkpoint-2026-03.md`](./architecture/current/app-architecture-checkpoint-2026-03.md): checkpoint de la estructura real de `app/` y de los loaders actuales. Leer cuando necesites entender la organización vigente de rutas y contratos de carga.
- [`docs/architecture/current/internal-clinical-charts-subsystem.md`](./architecture/current/internal-clinical-charts-subsystem.md): estado verificable del subsistema de charts clínicos. Leer cuando necesites saber cómo se implementa hoy la visualización longitudinal.
- [`docs/architecture/current/clinical-model.md`](./architecture/current/clinical-model.md): modelo clínico actual consumido por lectura, formatters y charts. Leer cuando necesites entender el shape clínico reutilizado hoy por el sistema.

## Evolución (cómo llegamos a este diseño)

- [`docs/evolution/encounters-and-clinical-evolution.md`](./evolution/encounters-and-clinical-evolution.md): resume la evolución de encounters, endurecimiento clínico y semántica longitudinal. Leer cuando necesites contexto de decisiones y trade-offs ya consolidados.
- [`docs/evolution/clinical-visualization-and-encounter-evolution.md`](./evolution/clinical-visualization-and-encounter-evolution.md): antecedente detallado de la evolución funcional y visual. Leer cuando necesites más contexto histórico sobre cómo se llegó al diseño vigente.

## Validación (estado real vs arquitectura)

- [`docs/validation/validacion-arquitectonica.md`](./validation/validacion-arquitectonica.md): contrasta autoridad y estado real, distinguiendo lo válido hoy, lo transicional y la deuda conocida. Leer cuando necesites validar si algo ya está alineado o sigue pendiente.

## Documentos históricos

- [`docs/evolution/reviews/*`](./evolution/reviews/): revisiones puntuales e informes de evaluación ya históricos. Leer solo para reconstruir contexto de análisis anteriores, no para definir reglas vigentes.
- [`docs/archive/*`](./archive/): material archivado y planes previos preservados como referencia histórica. Leer solo cuando necesites rastrear decisiones o planes ya superados.

## Orden de lectura sugerido

1. **Autoridad** para saber qué documento manda.
2. **Estado actual** para ver cómo está implementado hoy.
3. **Evolución** para entender por qué se llegó a ese diseño.
4. **Validación** para contrastar arquitectura definida contra sistema real.
5. **Históricos** solo si hace falta contexto adicional.

## Regla práctica

- Si dos documentos discrepan, prevalece **Autoridad**.
- **Estado actual** describe implementación verificable, pero no reemplaza autoridad.
- **Evolución** explica decisiones pasadas y transiciones, pero no redefine reglas vigentes.
- **Validación** compara realidad contra autoridad, pero no introduce nuevas reglas.
