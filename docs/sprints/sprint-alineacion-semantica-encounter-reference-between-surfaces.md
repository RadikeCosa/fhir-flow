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

## 4.1 Decisión semántica cerrada (T3)

Decisión oficial del sprint:

- La “última visita” en **patient detail** se define como:
  - el encounter más reciente dentro del **EpisodeOfCare activo**;
  - con prioridad de `in-progress` por sobre `finished`.

Esta decisión queda cerrada para este sprint y reemplaza cualquier ambigüedad previa sobre referencia patient-global.

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
- cada surface tiene regla de selección definida y verificable
- el scope por episodio se aplica de forma consistente donde corresponde
- surfaces obligadas están definidas
- surfaces exentas están definidas y justificadas
- surfaces longitudinales están explícitamente exentas
- boundary técnico identificado
- impacto técnico clasificado (no diseñado)
- no queda concepto ambiguo de “encounter de referencia”
- no se sobredeclara implementación

## 7.1 Contrato semántico por surface (cerrado)

### 1) Patient detail

- Propósito: surface de **resumen clínico**.
- Regla de selección:
  - seleccionar el encounter más reciente dentro del **EpisodeOfCare activo**;
  - priorizar `in-progress` sobre `finished`.
- Proveniencia de datos:
  - los datos clínicos se leen por `encounterId`.
- Límite explícito:
  - no opera a nivel patient-global;
  - opera con scope de episodio.

### 2) Encounter history / list

- Propósito: surface de **colección por episodio**.
- Regla de selección:
  - incluir todos los encounters del **EpisodeOfCare activo**.
- Ordenamiento y paginación:
  - son preocupaciones de presentación, no de semántica de referencia.
- Proveniencia de datos:
  - cada ítem es encounter-centric.
- Límite explícito:
  - surface episode-scoped;
  - no selecciona un único encounter de referencia.

### 3) Encounter detail

- Propósito: vista **autoritativa** de un encounter.
- Regla de selección:
  - el encounter se determina estrictamente por `encounterId` de ruta.
- Proveniencia de datos:
  - los datos clínicos se leen por `encounterId`.
- Límite explícito:
  - es la fuente de verdad para un encounter individual.

### 4) Contrato de navegación

- patient detail → encounter detail:
  - navega usando el encounter seleccionado en patient detail.
- history/list → encounter detail:
  - navega usando el encounter del ítem seleccionado.
- Convergencia obligatoria:
  - ambos caminos convergen a la misma semántica por `encounterId` una vez dentro de detail.
- Divergencia permitida:
  - antes de navegar se permite divergencia por diseño, acotada por el contrato de cada surface.

### 5) Superficies longitudinales / analíticas

- EpisodeChartsPanel y surfaces equivalentes son **longitudinales**.
- No definen “encounter de referencia”.
- Pueden usar agregación temporal y fallback longitudinal.
- Restricción explícita:
  - el fallback longitudinal está prohibido en surfaces encounter-centric;
  - sólo está permitido en surfaces declaradas explícitamente como longitudinales.

## 7.2 Reglas de frontera (obligatorias)

- Las surfaces encounter-centric no pueden usar fallback temporal como fuente de verdad.
- La selección de encounter debe ser explícita (por id o por regla selectora declarada).
- No se permite mezclar selección por episodio y selección patient-global dentro de la misma surface.

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

Regla oficial definida y cerrada.

#### Criterios

- contrato explícito por surface y navegación
- patient detail: referencia cerrada al encounter más reciente del episodio activo, con prioridad `in-progress` > `finished`
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
- regla de selección por surface explícita y sin ambigüedad
- aplicación consistente del scope de episodio donde corresponde
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

## 13. Cierre del sprint

### Estado

Sprint cerrado.

### Resultado alcanzado

- Se eliminó la ambigüedad sobre el “encounter de referencia” entre surfaces.
- Se definió un contrato semántico explícito y reusable.
- Se establecieron reglas claras por surface:
  - patient detail: último encounter del EpisodeOfCare activo (prioridad in-progress > finished)
  - encounter history/list: colección completa por episodio
  - encounter detail: autoritativo por encounterId
- Se delimitaron explícitamente las superficies longitudinales como exentas.

### Impacto técnico

- El impacto fue clasificado como **INCREMENTAL**.
- No se requiere rediseño estructural del sistema.
- El ajuste principal se concentra en:
  - selector de patient detail
  - lógica de navegación/CTA derivada

### Lo que NO se hizo (intencionalmente)

- No se implementaron cambios en código.
- No se modificaron repositorios ni contratos de datos.
- No se ajustaron loaders ni navegación en runtime.
- No se tocaron superficies longitudinales.

### Gap residual

- No quedan gaps semánticos abiertos dentro del alcance del sprint.
- El gap previo de divergencia cross-surface fue resuelto a nivel de contrato.

### Próximo paso

Se propone un nuevo sprint técnico:

**Sprint — Alineación episode-scoped de patient detail y navegación clínica**

Objetivo:

- Implementar el contrato definido en este sprint,
- alineando selectores y navegación sin introducir cambios estructurales.
