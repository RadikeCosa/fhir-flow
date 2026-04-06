---
title: Sprint cerrado (alcance acotado) — Hardening del read global (encounter-centric vs longitudinal/histórico)
date: 2026-04-04
status: closed-bounded
---

# Sprint cerrado (alcance acotado) — Hardening del read global (encounter-centric vs longitudinal/histórico)

> Nota de naming: el nombre del archivo conserva “propuesto” por continuidad histórica, pero el estado vigente del sprint es `closed-bounded` (T1–T5 cerrados en alcance acotado).

## 1. Objetivo

Definir y endurecer el contrato operativo de lectura global para separar con precisión:

- surfaces **encounter-centric** (source-of-truth por `encounterId`),
- surfaces **longitudinal/históricas** (agregación temporal por episodio),

incluyendo el tratamiento controlado de datos legacy sin `encounterId`, sin reabrir frentes ya cerrados.

## 2. Problema a resolver

El estado actual ya cerró tramos acotados de continuidad y no-mezcla en surfaces específicas, pero la deuda global de lectura longitudinal/histórica sigue abierta.

Hoy conviven dos comportamientos legítimos que deben quedar explícitamente delimitados:

1. lectura encounter-centric estricta para detail surfaces;
2. lectura longitudinal con fallback temporal por fecha para rescatar históricos sin linkage completo.

Mientras esa frontera no esté blindada de forma contractual y verificable, persiste riesgo de filtración de criterios longitudinales hacia surfaces encounter-centric.

## 3. Por qué es un issue real de arquitectura/runtime

No es solo un problema documental.

El read model actual usa fallback por fecha en el contexto longitudinal (válido por diseño), y a la vez exige strict `encounterId` en vistas encounter-centric. Si esa separación deriva o se implementa de forma inconsistente, el sistema puede reintroducir mezcla cross-surface.

El riesgo es doble:

- **runtime:** contaminación entre encounters por matching temporal en surfaces que deberían ser encounter-driven;
- **arquitectura:** drift de contrato (lo longitudinal empieza a funcionar como source-of-truth de detalle).

Por eso este sprint apunta a límites operativos verificables, no a refactor masivo ni a features nuevas.

## 4. Autoridad y límites

Este sprint se apoya en:

- `docs/backlog.md` (deuda longitudinal/histórica abierta y prioridad sugerida),
- `docs/validation/validacion-arquitectonica.md` (estado parcial del split encounter-centric vs longitudinal),
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md` (límites abiertos del read model global),
- `docs/temporal-encounter-audit-2026-03-30.md` (riesgo medio por fallback temporal y legacy sin linkage),
- `docs/write-phase-architecture.md`, `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`, `docs/ADR-003.md` (marco de arquitectura vigente).

Límite de autoridad de este sprint:

- no redefine lifecycle;
- no reescribe decisiones ADR;
- no convierte cierres acotados previos en cierre global.

## 5. Alcance incluido

Incluye:

1. **Contrato dual explícito de lectura global**
   - definir formalmente qué surfaces son encounter-centric y cuáles longitudinales;
   - declarar source-of-truth por tipo de surface.

2. **Regla explícita de fallback temporal por fecha**
   - permitido solo en longitudinal/histórico;
   - prohibido como criterio primario en surfaces encounter-centric.

3. **Tratamiento operativo de legacy sin `encounterId`**
   - mantener compatibilidad controlada en longitudinal;
   - evitar filtración de esos casos a fuentes encounter-centric;
   - dejar trazabilidad explícita del origen (linked vs derived).

4. **Blindaje de regresión acotado**
   - evidencia mínima de no-regresión en límites de lectura (sin expandir a cobertura browser global en este sprint).

5. **Alineación contractual/documental mínima del frente**
   - wording consistente con estado real: cierre acotado del límite contractual, no cierre total system-wide.

## 6. Alcance excluido

No incluye:

- reabrir el cierre de snapshot/finalize post-visita;
- reabrir los dos flujos browser E2E acotados ya estabilizados;
- iniciar cobertura browser E2E global como primer movimiento;
- cambios de lifecycle o transición de estados;
- refactor amplio del write flow;
- tipado de `ActionError.details`;
- consistencia total de practitioner context como objetivo principal;
- migración/backfill histórico de `encounterId` como compromiso del sprint.

## 7. Riesgos principales

1. **Riesgo de scope creep**
   - intentar resolver de una vez deuda longitudinal global, E2E global y deudas write no relacionadas.

2. **Riesgo de sobredeclaración**
   - presentar este sprint como cierre total del read model global, cuando el alcance es contractual/acotado.

3. **Riesgo de sub-alcance**
   - quedarse en redacción sin blindaje verificable mínimo de regresión.

4. **Riesgo de regresión funcional**
   - cambios de criterio de filtrado que afecten comportamiento esperado de charts longitudinales.

## 8. Ejecución realizada (tickets)

### T1 — Baseline contractual del read global (**completado**)

- Inventariar surfaces y declarar tipo de lectura por surface (`encounter-centric` vs `longitudinal`).
- Fijar source-of-truth de cada una.

### T2 — Regla operativa de fallback temporal (**completado**)

- Formalizar regla “fecha solo longitudinal”.
- Definir guardas para evitar que fallback temporal sea reutilizado en detail surfaces.

### T3 — Política de legacy sin `encounterId` (**completado**)

- Definir cómo se incorporan registros legacy en longitudinal.
- Definir cómo se excluyen de la fuente encounter-centric.
- Definir trazabilidad mínima del origen de vínculo (`linked-by-encounter` vs `derived-by-date`, o equivalente contractual/documental).

### T4 — Blindaje de regresión acotado (**completado en mínimo necesario**)

- Incorporar/ajustar evidencia de regresión mínima en loaders/read contracts del frente.
- Mantener foco en alcance acotado (sin browser global).

### T5 — Cierre de sprint y alineación documental mínima (**completado**)

- Registrar resultados, límites y deuda remanente sin mezclar otros tracks.
- Alinear backlog, validación arquitectónica y sprint con el mismo límite operativo, sin sobredeclarar cierre global.

## 8.1 Estado de cierre (alcance acotado)

- **T1**: ejecutado en modo baseline contractual (matriz de surfaces y límites encounter-centric vs longitudinal).
- **T2**: implementado en alcance acotado en `app/patients/[id]/encounters/data.ts` con regla operativa explícita:
  - fallback por fecha confinado al flujo longitudinal;
  - guardas para evitar filtración a maps/cards encounter-centric.
- **T3**: implementado en alcance acotado sobre el mismo loader/tests:
  - clasificación explícita de origen de linkage longitudinal (`linked-by-encounter` / `derived-by-date`);
  - tolerancia de legacy sin `encounterId` solo en longitudinal;
  - precedencia explícita de `linked-by-encounter` cuando ambos criterios matchean.
- **T4**: completado en regresión mínima del loader longitudinal (guardas para no-filtración a maps/cards encounter-centric).
- **T4 (refuerzo documental G3, 2026-04-06)**: evidencia cross-surface reforzada en alcance acotado con test integrado (`app/patients/[id]/__tests__/cross-surface.contract.test.ts`) para coexistencia explícita `linked-by-encounter` / `derived-by-date` sin contaminación de `patient detail`.
- **T5**: completado en alineación documental mínima (sprint + backlog + validación arquitectónica).

Límite explícito de esta actualización:
- no declara cierre global del read model longitudinal/histórico;
- no cambia el estado “parcialmente válido” del split a nivel system-wide.
- no sustituye G4 ni abre hardening legacy global fuera del perímetro auditado.

## 9. Criterios de aceptación (cumplidos en alcance acotado)

Quedó explícito y verificable que:

1. las surfaces encounter-centric mantienen source-of-truth por `encounterId`;
2. el fallback temporal por fecha quedó confinado al modo longitudinal/histórico;
3. los casos legacy sin `encounterId` tienen tratamiento operativo controlado y no contaminan el source-of-truth encounter-centric;
4. existe blindaje de regresión mínimo alineado al alcance;
5. backlog, validación arquitectónica y este documento quedaron alineados con el mismo límite, sin sobredeclarar cierre global;
6. no se reabrieron frentes ya cerrados ni se mezcló trabajo fuera del objetivo.
7. el refuerzo G3 (2026-04-06) quedó documentado como evidencia acotada, con sin bug runtime nuevo verificable y sin cambios productivos.

## 10. Límites explícitos

- Este sprint **no** cierra continuidad clínica system-wide completa.
- Este sprint **no** reemplaza ni invalida cierres acotados previos.
- Este sprint **no** cambia arquitectura write ni contrato de lifecycle.
- Este sprint **no** toma como objetivo principal `ActionError.details` ni practitioner consistency.
- Este sprint **no** declara migración histórica de datos legacy como entregable obligatorio.

## 11. Impacto observado en arquitectura/runtime (alcance acotado)

- mejor separación contractual entre lectura encounter-centric y longitudinal;
- menor riesgo de mezcla cross-surface por filtración de fallback temporal;
- mayor estabilidad del límite global ya consolidado en cierres acotados;
- reducción de drift entre comportamiento runtime y documentación de arquitectura.

## 12. Próximo paso después del sprint

Con el límite contractual endurecido y cerrado en alcance acotado, mantener la deuda longitudinal/histórica global como abierta y decidir próximos pasos sin mezclar tracks (por ejemplo, `ActionError.details` o practitioner consistency en sprint separado).
