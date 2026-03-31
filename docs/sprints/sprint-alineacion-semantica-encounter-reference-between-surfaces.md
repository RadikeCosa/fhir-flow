# 📄 Sprint — Alineación semántica del encounter de referencia entre surfaces (VERSIÓN FINAL)

Esta ya incorpora:

- tu propuesta original
- la review
- los ajustes que discutimos

Lista para usar.

## 1. Objetivo

Resolver la divergencia semántica entre surfaces que hoy determinan el “encounter de referencia” con criterios distintos, para dejar explícito, consistente y verificable:

- qué surfaces deben compartir una misma regla de selección;
- qué surfaces pueden conservar una semántica distinta;
- cuáles son las fronteras válidas entre ambos comportamientos.

Este sprint cierra ambigüedad semántica, no necesariamente diversidad semántica.

## 2. Problema / diagnóstico

Actualmente existen dos criterios válidos pero no alineados:

- encounters page → scope por EpisodeOfCare
- patient detail → selección por patient + practitioner (inProgress ?? lastFinished)

Esto no rompe el circuito clínico validado, pero introduce:

- ambigüedad sobre “qué encounter manda”
- potencial divergencia en escenarios multi-episodio
- falta de contrato explícito cross-surface

El problema es semántico, no de integridad de datos.

## 3. Alcance

### Entra

- análisis comparativo de selección de encounter por surface
- definición de contrato semántico explícito
- delimitación de surfaces obligadas vs exentas
- clasificación del impacto técnico posterior

### No entra

- implementación completa
- refactor global
- cambios de lifecycle
- hardening general
- UI / features nuevas

## 4. Hipótesis de trabajo

La divergencia actual surge de:

- dos semánticas correctas aplicadas en contextos distintos

Por lo tanto, el resultado válido del sprint puede ser:

- una regla común
- o
- múltiples reglas explícitas con fronteras claras

## 5. Riesgos

### R1 — Resolver como bug local

Rompe coherencia global

### R2 — Forzar unificación artificial

Rompe casos legítimos

### R3 — Scope creep

Se transforma en refactor global

### R4 — Cierre falso

No queda regla reusable

## 6. Política de ejecución

### Capa A — Decisión semántica

Primero se define el contrato

### Capa B — Impacto técnico

Después se evalúa el impacto (sin implementar)

## 7. Definición de Done

Se considera cerrado solo si:

- existe una definición explícita de “encounter de referencia”
- surfaces obligadas están definidas
- surfaces exentas están definidas y justificadas
- boundary técnico identificado
- impacto técnico clasificado (no diseñado)
- no se sobredeclara implementación

## 8. Orden de ejecución

1. mapear selección actual
2. comparar semánticas
3. evaluar alternativas
4. decidir contrato
5. clasificar impacto
6. documentar

## 9. Tickets

### T1 — Inventario de selección cross-surface

Mapear cómo cada surface determina el encounter relevante.

Incluye:

- patient detail
- encounters page
- encounter detail
- navegación

#### Criterios

- regla documentada por surface
- scope explícito (episode, patient, etc.)
- diferencias reales identificadas

### T2 — Evaluación de alternativas semánticas

Evaluar:

- episode-centric
- patient-centric
- híbrido explícito

#### Criterios

- ventajas y riesgos por opción
- impacto en coherencia
- descarte justificado

### T3 — Decisión de contrato semántico

Definir la regla oficial.

#### Criterios

- contrato explícito
- surfaces obligadas definidas
- surfaces exentas definidas
- longitudinales explícitamente excluidas (ej: EpisodeChartsPanel)
- boundary técnico identificado

### T4 — Clasificación del impacto técnico posterior

Determinar tipo de implementación futura:

- local
- incremental
- estructural

#### Criterios

- impacto clasificado
- surfaces afectadas listadas
- sin diseño de implementación

### T5 — Cierre documental

Actualizar doc y backlog.

#### Criterios

- decisión registrada
- deuda anterior resuelta a nivel diseño
- próximos pasos definidos

## 10. Criterios de aceptación

- divergencia semántica resuelta explícitamente
- regla(s) reutilizable(s) definida(s)
- surfaces obligadas claras
- surfaces exentas claras
- longitudinales explícitamente fuera (charts, históricos)
- siguiente paso técnico definido

## 11. Evidencia mínima

### Incluye

- análisis de loaders / data.ts
- comparación por surface
- matriz de decisión
- contrato final

### No incluye

- implementación
- E2E
- refactor

## 12. Resultado esperado

El sistema deja de tener ambigüedad sobre:

- qué encounter es “el relevante”

La implementación posterior puede variar, pero la semántica queda cerrada.

## 🧠 Cómo seguimos ahora

Perfecto lo que planteaste:

- 👉 ahora usamos Codex ticket por ticket

Orden sugerido:

- T1 → prompt de auditoría (mapping real)
- T2 → comparación de modelos
- T3 → decisión (esto lo revisamos juntos)
- T4 → clasificación impacto
- T5 → documentación