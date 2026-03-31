# Sprint — Validación transversal encounter-centric del circuito clínico

- Fecha: 2026-03
- Estado: Propuesto

## 0. Surfaces bajo validación (hipótesis inicial)

Clasificación preliminar para mantener el sprint en modo validación/hardening (no discovery abierto):

### Encounter-centric (target de garantía en este sprint)

- `encounter detail` (`in-progress` / `finished`) como surface clínica por encounter.
- `patient detail` en los puntos donde renderiza/deriva estado clínico del encounter activo.

### Longitudinales (permitidas como longitudinales, fuera de garantía encounter-específica)

- `EpisodeChartsPanel` y vistas de tendencia/histórico.
- Lecturas agregadas históricas que no prometen aislamiento estricto por `encounterId`.

### Mixtas / de riesgo / inciertas (a validar en T1)

- `encounters page` / history list cuando actúa como punto de entrada al encounter activo.
- Lógica de grouping/listado alrededor de encounters (ordenado, agrupación o selección).
- Cualquier boundary loader/composition que conecte lista longitudinal con navegación encounter-centric.

> Nota: esta lista es hipótesis inicial basada en arquitectura/sprints previos; T1 confirma qué entra efectivamente en alcance.

## 1. Objetivo del sprint

Validar de forma fuerte y acotada que el circuito encounter-centric ya endurecido en detalle `finished` e `in-progress` se sostiene entre surfaces clínicas globales relevantes, sin mezcla entre encounters y sin fallback temporal como source of truth en surfaces encounter-centric.

Este sprint no crea features nuevas ni rediseña el read model: valida fronteras y, solo si aplica, endurece gaps mínimos localizados.

## 2. Problema / diagnóstico

Los sprints previos cerraron slices acotados:

- `finished encounter detail` validado como path canónico (bounded);
- `in-progress encounter detail` validado en continuidad (save → reload → rehydrate).

La incertidumbre pendiente está en la integración entre surfaces fuera del detalle ya validado.

Riesgo real:

- asumir garantías encounter-centric en surfaces globales sin evidencia explícita;
- mezclar semántica longitudinal con semántica encounter-centric en puntos de navegación/listado;
- declarar cierre sin distinguir gaps triviales vs estructurales.

## 3. Alcance

### Entra en este sprint

- validación de la clasificación inicial de surfaces y su frontera semántica;
- auditoría cross-surface del circuito crítico encounter-centric;
- evidencia reproducible de continuidad y no-mezcla en surfaces auditadas;
- corrección mínima local **solo** si T2 detecta gap trivial.

### No entra en este sprint

- features nuevas;
- browser E2E completo (Playwright u otro);
- refactor amplio de loaders/componentes/read model;
- rediseño del lifecycle;
- cleanup histórico/legacy integral;
- tipado de `ActionError.details`;
- rediseño visual de charts/UI.

## 4. Riesgos principales

### Riesgo 1 — Scope creep por “hardening global”

Mitigación: surfaces candidatas fijadas upfront + política de gaps explícita.

### Riesgo 2 — Confundir longitudinal con encounter-centric

Mitigación: frontera semántica validada en T1 y auditada en T2.

### Riesgo 3 — False closure

Mitigación: DoD exige evidencia por surface auditada y documentación honesta de hallazgos no triviales.

## 5. Política de manejo de gaps

Si T2 detecta desvíos, se aplica esta política:

### Gap trivial / mínimo (entra en sprint)

Se puede corregir dentro del sprint **solo si**:

- está acotado a un boundary local (loader/composition/render);
- no requiere rediseño de lifecycle/read model;
- no abre efectos colaterales sistémicos.

Salida esperada: corrección mínima + tests/guardas de cierre (T3 condicional + T4).

### Gap no trivial / estructural (no entra en sprint)

No se corrige en este sprint.

Se clasifica como no trivial cualquier gap que:

- toque más de un boundary (`loader`/`composition`/`render`);
- requiera cambio de contrato;
- afecte más de una surface.

Se debe:

- documentar el gap con evidencia y alcance técnico;
- registrar deuda/follow-up explícito para sprint posterior;
- cerrar este sprint como validación acotada (sin absorber rediseño oculto).

## 6. Definición de done

El sprint se considera cerrado únicamente si:

- las surfaces auditadas quedan clasificadas y su estado final (validada / fuera de alcance / deuda) está documentado;
- en surfaces encounter-centric auditadas, la lectura clínica se sostiene por `encounterId` y **no** usa fallback temporal como source of truth;
- las surfaces longitudinales pueden permanecer longitudinales sin forzar convergencia artificial a encounter-centric;
- T2 queda respaldado por evidencia reproducible y, si hubo gap trivial, la corrección mínima queda cubierta por pruebas;
- si se detectaron gaps no triviales, quedan explícitos como deuda/follow-up (sin absorción silenciosa en alcance);
- no se declara cierre global del read model ni hardening system-wide.

## 7. Orden de ejecución

1. T1 — validar clasificación inicial y frontera semántica.
2. T2 — auditar circuito/surfaces en alcance real.
3. T3 (condicional) — aplicar corrección mínima si T2 detecta gap trivial apto.
4. T4 — cerrar con pruebas/guardas según estado final (con o sin T3).
5. T5 — cierre documental acotado y honesto.

## 8. Tickets del sprint

### T1 — Validación de clasificación de surfaces y frontera semántica

Confirmar (no descubrir desde cero):

- clasificación preliminar encounter-centric / longitudinal / mixta;
- frontera operativa entre semántica encounter-centric y longitudinal;
- set final de surfaces que entra realmente en este sprint.

**Criterios:**

- mapa final de surfaces candidatas con justificación;
- separación explícita de garantías por tipo de surface;
- si una surface mixta no impacta directamente el circuito crítico (navegación a `encounter detail` o lectura clínica activa), queda fuera de alcance en este sprint;
- exclusiones documentadas para mantener alcance acotado.

### T2 — Auditoría cross-surface del circuito crítico

Revisar continuidad y aislamiento en el circuito:

- `encounters page` / history list (si participa como entrypoint);
- `patient detail` ↔ `encounter detail`;
- acciones/start-save-finalize y relectura de encounter.

**Criterios:**

- identificación de puntos de ruptura reales;
- evidencia de comportamiento por surface auditada;
- clasificación de hallazgos en trivial vs no trivial.

### T3 — Corrección mínima local (condicional)

Se ejecuta **solo si** T2 detecta gap trivial compatible con hardening acotado.

**Criterios:**

- cambio local en boundary afectado;
- sin rediseño de lifecycle/read model;
- si aparecen múltiples gaps triviales, se corrige solo el de mayor impacto en el circuito crítico; el resto queda documentado como follow-up;
- alcance y trade-offs documentados.

### T4 — Cierre de pruebas y guardas (dependiente de resultado T2/T3)

Consolidar guardas del estado final:

- si no hubo gap: pruebas de validación del comportamiento auditado;
- si hubo gap trivial corregido: pruebas sobre corrección + regresión negativa.

**Criterios:**

- cobertura de continuidad/no-mezcla en surfaces auditadas;
- pruebas negativas contra fallback temporal en surfaces encounter-centric;
- las pruebas validan proveniencia de datos en el read path (`encounterId`), no solo igualdad del payload final renderizado;
- cuando aplique, se incluyen aserciones sobre parámetros de query/selección para evitar falsos positivos por fallback temporal;
- sin duplicación innecesaria ni claims de cobertura global.

### T5 — Cierre documental del sprint

Actualizar únicamente artefactos de sprint para reflejar resultado real y límites.

**Criterios:**

- cierre evidence-based y bounded;
- límites/exclusiones explícitos;
- todo gap no trivial queda registrado con descripción técnica, alcance afectado y sprint candidato de resolución;
- deuda no trivial registrada como follow-up cuando corresponda.

### Gap estructural identificado (fuera de alcance del sprint)

Se detectó una divergencia semántica cross-surface en el criterio de “encounter de referencia”:

- `encounters page` está acotada al scope de `EpisodeOfCare` activo;
- `patient detail` usa fallback clínico con scope `patient + practitioner`.

Surfaces afectadas:

- `encounters page` / history list;
- `patient detail`.

Clasificación del gap: **no trivial / estructural**, porque cruza boundaries de loader/composición y requiere alinear contrato semántico entre surfaces.

Este gap **no rompe** el circuito actualmente validado en el sprint (encounter-centric en flujos auditados), pero queda **diferido de forma intencional** para mantener alcance bounded.

Sprint de seguimiento sugerido: **Semantic alignment of encounter reference across surfaces**.

## 9. Criterios de aceptación

- clasificación final de surfaces validada contra hipótesis inicial;
- surfaces encounter-centric auditadas sin mezcla entre encounters;
- ausencia de fallback temporal como truth source en surfaces encounter-centric auditadas;
- surfaces longitudinales tratadas explícitamente como longitudinales (sin falsas garantías encounter-específicas);
- evidencia automatizada/reproducible alineada al alcance;
- hallazgos no triviales documentados sin expansión encubierta del sprint.

## 10. Evidencia mínima esperada

### Validación manual acotada

- recorrido de navegación/listado a detalle encounter;
- verificación de no-mezcla con al menos dos encounters del mismo paciente;
- comprobación de comportamiento longitudinal en `EpisodeChartsPanel` sin usarlo como prueba de garantía encounter-centric.

### Pruebas mínimas

- integración route/data entre surfaces auditadas;
- continuidad save → reload → read en encounter auditado;
- guarda negativa de fallback temporal en surface encounter-centric;
- prueba de no-contaminación cross-encounter.

## 11. Límites explícitos del cierre

Este sprint NO implica:

- browser E2E completo;
- hardening global de todo el read model clínico;
- refactor amplio de loaders o composición;
- rediseño de lifecycle;
- cleanup histórico/legacy integral;
- tipado de `ActionError.details`;
- rediseño visual de charts o UI.

## 12. Resultado esperado

Al cerrar el sprint, existe una validación transversal **acotada y verificable** sobre surfaces clínicas globales candidatas, con clasificación semántica explícita, evidencia reproducible y tratamiento honesto de gaps (mínimos corregidos localmente; estructurales diferidos como deuda).
