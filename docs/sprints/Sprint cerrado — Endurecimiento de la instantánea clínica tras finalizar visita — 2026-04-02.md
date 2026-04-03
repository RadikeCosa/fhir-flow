---
title: Sprint cerrado — Endurecimiento de la instantánea clínica tras finalizar visita
date: 2026-04-02
---

# Sprint cerrado — Endurecimiento de la instantánea clínica tras finalizar visita

## 1. Objetivo

Cerrar la duplicación de snapshot clínica que aparecía después de finalizar una visita, sin confundirla con el cierre previo de submit/UX de `save-progress`, que ya estaba resuelto y no se reabre aquí.

## 2. Problema a resolver

Manual testing en runtime detectó un comportamiento inconsistente que ya quedó corregido en la implementación final:

- valores parciales de signos vitales y EVA guardados durante `in-progress` volvieron a leerse luego como valores adicionales;
- al finalizar el mismo encounter, los charts trataban esos valores parciales como puntos extra;
- el encounter detail también mostraba valores duplicados o distinguibles para lo que semánticamente debería ser una única snapshot de visita.

La interpretación de trabajo era que la snapshot parcial de `save-progress` coexistía con la snapshot final después de `finalize`. Eso violaba la semántica esperada de snapshot en `in-progress` y la semántica canónica final de `finished`.

## 3. Por qué es un issue real de arquitectura/runtime

ADR-003 ya define que el guardado parcial debe comportarse como snapshot y no como acumulación. Por lo tanto, el problema no era una preferencia de UI ni un detalle cosmético de charts.

El síntoma atravesaba surfaces distintas:

- encounter detail;
- charts/history longitudinal.

Esto obligó a tratarlo como un issue real de runtime y no como un problema aislado de render. La corrección implementada fue write-side y consolidó el snapshot previo durante `finalize` antes de publicar la clínica final.

## 4. Autoridad y límites de lectura

Este sprint toma como marco los documentos ya vigentes:

- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/adr/ADR-003.md`
- `docs/write-phase-architecture.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/backlog.md`

El sprint previo de cierre del submit de `save-progress` permanece cerrado. Este sprint no reabre ese problema de UX/contrato; aborda una deuda distinta que ya quedó resuelta: duplicación de snapshot clínica después de finalizar.

## 5. Alcance incluido

Incluye:

- cleanup write-side en finalize para managed clinical snapshot resources del mismo encounter;
- inclusión de DELETE + POST + Encounter update en una sola transacción FHIR;
- protección de regresión en finalize write-path, integration flow, finished encounter detail loader y longitudinal loader;
- trazabilidad documental mínima del cierre real.

## 6. Alcance excluido

No incluye:

- reabrir la corrección de submit/UX de `save-progress`;
- rediseño del modelo longitudinal de charts;
- reescritura global de lifecycle;
- introducir `startEncounterAction` como parte de este sprint;
- afirmar que el filtrado de lectura sea la solución principal;
- cambiar ADRs o arquitectura base.

## 7. Riesgos principales

- confundir una snapshot duplicada con una visualización longitudinal válida;
- limitar el análisis a charts y dejar sin resolver encounter detail;
- sobredeclarar cobertura browser/E2E innecesaria;
- expandir el trabajo hacia una reforma mayor del lifecycle sin evidencia.

## 8. Orden de ejecución / tickets

### T1 — Reproducción y clasificación

Confirmar el comportamiento en runtime y distinguir:

- dato parcial persistido correctamente;
- dato final persistido correctamente;
- coexistencia indebida entre ambas snapshots;
- lectura duplicada por surface.

### T2 — Localización del punto de duplicación

Identificar si la duplicación aparecía en:

- `save-progress`;
- `finalize`;
- consolidación de recursos clínicos;
- read path de encounter detail;
- read path longitudinal de charts/history.

### T3 — Definición de hardening mínimo

La corrección mínima quedó definida en el write path de `finalize`: cleanup de snapshot clínica managed previa al POST final, sin tocar read/UI/chart code.

### T4 — Blindaje de regresión

La cobertura quedó añadida en tres superficies: finalize write-path, encounter detail loader y longitudinal loader, además de la integración principal.

### T5 — Corrección documental mínima

Alineé backlog y documentación de sprint con el comportamiento realmente confirmado, sin mezclarlo con el cierre del submit de `save-progress`.

## 9. Criterios de aceptación

El sprint queda cerrado porque quedó claro:

- cuál era el punto real de entrada de la duplicación;
- que la corrección pertenece a escritura/consolidación en `finalize`;
- qué surfaces quedaron protegidas y por qué;
- cómo evitar que una snapshot parcial se lea como datos adicionales después de finalizar.

La semántica de snapshot dejó de producir coexistencia visible entre parcial y final en el alcance validado.

## 10. Límites explícitos

- El sprint anterior sobre submit/UX de `save-progress` permanece cerrado.
- Este sprint no afirma que se haya resuelto deuda global longitudinal/histórica fuera del encounter afectado.
- Este sprint no presupone que el filtrado de lectura sea la solución principal.
- Este sprint no cambia el lifecycle oficial ni el modelo de write phase.
- Este sprint no reabre la deuda cerrada de continuity/submit salvo que aparezca una evidencia nueva y separada.

## 11. Evidencia / cobertura

- `infrastructure/fhir/repositories/__tests__/encounter.fhir-repository.test.ts` valida cleanup aware de ownership y DELETE + POST dentro de la misma transacción de finalize.
- `infrastructure/fhir/mappers/__tests__/finalize-encounter-bundle.mapper.test.ts` valida el bundle transaccional con Encounter update, DELETE de snapshot managed y POST final.
- `app/patients/[id]/encounters/[encounterId]/__tests__/critical-flow.integration.test.ts` valida el flujo `planned -> start -> saveProgress(partial) -> finalize(final) -> reload` sin coexistencia parcial + final.
- `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts` protege el finished encounter detail loader.
- `app/patients/[id]/encounters/__tests__/data.test.ts` protege el loader longitudinal para que el encounter finalizado no deje un punto semántico extra.

## 12. Impacto en runtime/UX

- El usuario ya no ve coexistencia de datos parciales y finales para el mismo encounter al finalizar.
- Encounter detail y charts/history longitudinal recuperan una única snapshot semántica por visita finalizada en el alcance validado.
- `save-progress` mantiene su semántica snapshot y no se altera en este cierre.

## 13. Impacto en arquitectura

- Se consolida la responsabilidad write-side en finalize para limpiar managed clinical snapshot resources antes del POST final.
- No se agregó deduplicación read-side como solución principal.
- No se cambió el contrato arquitectónico de `save-progress`.

## 14. Backlog / deuda después del cierre

- La deuda específica de duplicación post-finalize queda cerrada.
- No se reabre la deuda de submit/UX de `save-progress`.
- La deuda longitudinal/histórica general sigue vigente solo en lo que ya estaba documentado como global y no resuelto por este sprint.

## 15. Próximo paso

Mantener el cierre protegido por regresión en finalize, encounter detail y longitudinal loader, sin ampliar el alcance a E2E browser salvo una necesidad nueva y separada.