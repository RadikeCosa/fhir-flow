---
title: Sprint — Endurecimiento de la instantánea clínica tras finalizar visita
date: 2026-04-02
---

# Sprint — Endurecimiento de la instantánea clínica tras finalizar visita

## 1. Objetivo

Investigar y endurecer la duplicación de snapshot clínica que aparece después de finalizar una visita, sin confundirla con el cierre previo de submit/UX de `save-progress`, que ya quedó resuelto y no se reabre en este sprint.

## 2. Problema a resolver

Manual testing en runtime detectó un comportamiento inconsistente:

- valores parciales de signos vitales y EVA guardados durante `in-progress` vuelven a leerse luego como valores adicionales;
- al finalizar el mismo encounter, los charts tratan esos valores parciales como puntos extra;
- el encounter detail también muestra valores duplicados o distinguibles para lo que semánticamente debería ser una única snapshot de visita.

La interpretación de trabajo es que la snapshot parcial de `save-progress` coexiste con la snapshot final después de `finalize`. Eso viola la semántica esperada de snapshot en `in-progress` y probablemente también la semántica canónica final de `finished`.

## 3. Por qué es un issue real de arquitectura/runtime

ADR-003 ya define que el guardado parcial debe comportarse como snapshot y no como acumulación. Por lo tanto, el problema no es una preferencia de UI ni un detalle cosmético de charts.

El síntoma atraviesa surfaces distintas:

- encounter detail;
- charts/history longitudinal.

Eso obliga a tratarlo como un issue real de runtime y no como un problema aislado de render. Si el origen está en escritura o consolidación, la lectura solo estará mostrando una inconsistencia ya materializada. Si el origen está en lectura, igualmente habrá que demostrarlo con evidencia antes de asumir que un filtro resuelve el caso.

## 4. Autoridad y límites de lectura

Este sprint toma como marco los documentos ya vigentes:

- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/adr/ADR-003.md`
- `docs/write-phase-architecture.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/backlog.md`

El sprint previo de cierre del submit de `save-progress` permanece cerrado. Este sprint no reabre ese problema de UX/contrato; aborda una deuda distinta: duplicación de snapshot clínica después de finalizar.

## 5. Alcance incluido

Incluye:

- reproducir el bug en runtime y clasificar su alcance real;
- verificar si la duplicación nace en persistencia, consolidación al finalizar o lectura posterior;
- auditar el impacto en encounter detail;
- auditar el impacto en charts y history longitudinal;
- definir una dirección de hardening mínima si la evidencia confirma un punto concreto de corrección;
- dejar trazabilidad documental mínima del estado real.

## 6. Alcance excluido

No incluye:

- rediseño del modelo longitudinal de charts;
- reescritura global de lifecycle;
- introducir `startEncounterAction` como parte de este sprint;
- reabrir la corrección de submit/UX de `save-progress`;
- afirmar que el filtrado de lectura sea suficiente sin haberlo demostrado;
- cambiar ADRs o arquitectura base salvo que el diagnóstico lo vuelva estrictamente necesario.

## 7. Riesgos principales

- confundir una snapshot duplicada con una visualización longitudinal válida;
- limitar el análisis a charts y dejar sin resolver encounter detail;
- asumir que el bug vive solo en lectura cuando puede estar materializado en escritura;
- expandir el trabajo hacia una reforma mayor del lifecycle sin evidencia;
- sobredeclarar una solución antes de cerrar la causa raíz.

## 8. Orden de ejecución / tickets

### T1 — Reproducción y clasificación

Confirmar el comportamiento en runtime y distinguir:

- dato parcial persistido correctamente;
- dato final persistido correctamente;
- coexistencia indebida entre ambas snapshots;
- lectura duplicada por surface.

### T2 — Localización del punto de duplicación

Identificar si la duplicación aparece en:

- `save-progress`;
- `finalize`;
- consolidación de recursos clínicos;
- read path de encounter detail;
- read path longitudinal de charts/history.

### T3 — Definición de hardening mínimo

Solo si T1 y T2 confirman un punto concreto, definir la corrección mínima que preserve la semántica de snapshot sin convertir el sistema en un acumulador ciego.

### T4 — Blindaje de regresión

Preparar la cobertura necesaria para que el caso no vuelva a aparecer como valores extra en encounter detail ni en charts/history.

### T5 — Corrección documental mínima

Alinear backlog y documentación de sprint con el comportamiento realmente confirmado, sin mezclarlo con el cierre del submit de `save-progress`.

## 9. Criterios de aceptación

El sprint queda bien encaminado si al final queda claro:

- cuál es el punto real de entrada de la duplicación;
- si la corrección pertenece a escritura, consolidación o lectura;
- qué surfaces quedan afectadas y por qué;
- cómo evitar que una snapshot parcial se lea como datos adicionales después de finalizar.

El sprint solo puede considerarse cerrado si no queda sobredeclarado ningún supuesto sobre la causa raíz y si la semántica de snapshot deja de producir coexistencia visible entre parcial y final.

## 10. Límites explícitos

- El sprint anterior sobre submit/UX de `save-progress` permanece cerrado.
- Este sprint no afirma que el bug sea solo de charts.
- Este sprint no presupone que el filtrado de lectura sea la solución.
- Este sprint no cambia el lifecycle oficial ni el modelo de write phase.
- Este sprint no reabre la deuda cerrada de continuity/submit salvo que aparezca una evidencia nueva y separada.
