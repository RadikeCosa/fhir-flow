# Sprint — Auditoría bounded de continuidad clínica transversal

- Status: closed-bounded (T1/T2/T5)
- Fecha: 2026-04-05

## 1. Objetivo

Auditar de forma explícita y verificable la continuidad clínica transversal del sistema fuera de los slices ya cerrados en alcance acotado, para determinar si existe una brecha runtime real que justifique hardening adicional o si la deuda restante es principalmente de perímetro, cobertura o documentación.

Este sprint es de validación, no de implementación expansiva.

Principio rector:

- validar primero;
- endurecer solo si aparece un gap runtime verificable;
- cerrar por evidencia si no aparece bug nuevo.

El siguiente paso recomendado surge del backlog y la validación vigente: practitioner consistency ya está cerrado en su perímetro, el frente longitudinal/histórico global no mostró gap nuevo verificable en el último cierre auditado, y la continuidad clínica transversal sigue abierta como deuda real.

## 2. Problema a resolver

El sistema ya cerró con evidencia varios frentes importantes, pero de manera acotada:

- canonical read de finished encounter detail en alcance acotado;
- browser E2E del loop clínico integrado encounter-centric en alcance acotado;
- practitioner consistency en encounter write, en perímetro bounded;
- auditoría longitudinal/histórica global TG1 sin gap runtime nuevo verificable en las surfaces auditadas.

La deuda que sigue abierta de verdad es la continuidad clínica transversal: no un bug confirmado, sino la falta de una auditoría bounded que contraste invariantes relevantes entre surfaces y determine con evidencia si queda alguna brecha runtime real fuera de los slices ya validados.

## 3. Por qué este sprint tiene sentido ahora

Este sprint tiene sentido ahora porque:

- reutiliza evidencia ya conseguida en browser E2E, loaders encounter-centric y cierres recientes;
- evita reabrir practitioner consistency, que hoy figura como válido en su alcance;
- evita reabrir longitudinal/histórico global con cambios productivos “por hipótesis”, contradiciendo cierres recientes por evidencia;
- ataca la principal deuda todavía abierta con mejor relación costo/valor.

Este sprint no asume que haya que cambiar código. Su trabajo es decidir con evidencia si hace falta hacerlo.

## 4. Autoridad y límites

Este sprint se apoya en:

- docs/guia-rapida.md, como orden de lectura sugerido;
- docs/backlog.md, como fuente de deudas abiertas y cierres recientes;
- docs/validation/validacion-arquitectonica.md, como estado real vigente;
- docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md, como autoridad de lifecycle y canonical read;
- docs/write-phase-architecture.md, como referencia operativa del write flow;
- docs/architecture/current/app-architecture-checkpoint-2026-03.md, como estado actual verificable de loaders y surfaces.

### Límite central

En este sprint, “transversal” no significa todo el producto.
Significa una matriz bounded de surfaces e invariantes concretos elegidos por su relevancia para continuidad clínica post-write/post-read.

### Exclusiones explícitas

No incluye:

- rediseño global del read model;
- charts longitudinales como frente principal;
- reabrir practitioner consistency;
- reabrir lifecycle;
- reabrir canonical finished detail ya cerrado en alcance acotado;
- rediseño global de ActionResult / ActionError;
- features nuevas;
- cambios productivos amplios sin bug verificable.

## 5. Alcance incluido

Incluye:

### Auditoría bounded de continuidad entre surfaces relevantes

La auditoría parte de esta lista candidata inicial, que T1 debe validar o ajustar mínimamente, no reconstruir desde cero:

- encounter detail in-progress
	Invariante candidato:
	- rehidratación por encounterId;
	- no-mezcla cross-encounter;
	- continuidad básica save -> reload/remount -> rehydrate.
- encounter detail finished
	Invariante candidato:
	- canonical read por encounterId;
	- sin fallback temporal como source of truth;
	- fail-closed ante mismatch encounter → patient.
- patient detail
	Invariante candidato:
	- source selection consistente (inProgressEncounter ?? lastFinishedEncounter);
	- datasets clínicos alineados con la fuente;
	- no-mezcla clínica.
- encounter history / surface resumen asociada
	Invariante candidato:
	- no filtrar fallback longitudinal a cards/maps encounter-centric;
	- mantener separación entre composición longitudinal y source-of-truth encounter-centric.
- browser E2E continuity flow
	Invariante candidato:
	- planned -> start -> save -> reload -> rehydrate -> finalize consistente;
	- sin pérdida de campos sentinel.
- browser E2E finalize seeded / outcome post-finalize
	Invariante candidato:
	- contrato final compatible con el estado vigente de patient detail para el seed validado;
	- no asumir forzosamente tarjeta ÚLTIMA VISITA si el contrato vigente es empty-state.

### Evidencia automatizada o reproducible mínima

La auditoría puede usar:

- browser E2E ya cerrados;
- tests integrados de loaders;
- sprint closures recientes;
- guardas nuevas mínimas solo si hicieran falta para demostrar o refutar un gap.

### Cierre documental mínimo

- sprint doc;
- backlog;
- validación arquitectónica.

## 6. Alcance excluido

No incluye:

- charts como objeto principal del sprint;
- rehardening longitudinal/histórico global sin evidencia nueva;
- cambios de practitioner/identity;
- refactor amplio de loaders;
- implementación nueva de continuidad si primero no aparece bug verificable;
- reescritura completa de documentación histórica.

## 7. Riesgos principales

### 7.1 Convertir “auditoría” en rediseño

Puede aparecer la tentación de “mejorar” arquitectura o implementación sin haber confirmado primero una brecha real.

Mitigación: toda modificación productiva requiere evidencia runtime verificable.

### 7.2 Scope creep por expansión de surfaces

Puede aparecer la tentación de agregar surfaces no necesarias una vez iniciada la auditoría.

Mitigación: T1 valida o ajusta la lista candidata inicial; no la reconstruye libremente.

### 7.3 Reabrir frentes cerrados por inercia

Puede aparecer la tentación de volver sobre practitioner, longitudinal global o canonical finished detail.

Mitigación: esos frentes quedan explícitamente fuera salvo evidencia nueva y directa.

### 7.4 Cierre excesivamente ambicioso

Puede confundirse “no encontramos bug” con “todo el sistema quedó cerrado”.

Mitigación: T5 debe dejar wording explícito de cierre acotado o cierre por evidencia sin extrapolación global.

### 7.5 Confundir drift de test con gap de continuidad real

El antecedente del test EVA encounter-scoped mostró que una desalineación de expectativa puede contaminar el diagnóstico si no se trata como prerequisito resuelto.

Mitigación: este sprint asume como prerequisito histórico resuelto el drift del test EVA encounter-scoped; no debe reingresar como evidencia de gap de continuidad.

## 8. Regla de implementación

Regla principal:

- este sprint es de validación bounded;
- si no aparece gap runtime verificable, el resultado correcto puede ser cierre sin cambios productivos;
- si aparece gap real, solo se permite hardening mínimo localizado.

Regla adicional:

- no mover límites arquitectónicos ya cerrados;
- no convertir este frente en reingeniería del sistema.

## 9. Landing zone inicial

Seguir como base el orden de lectura sugerido en docs/guia-rapida.md.

### Primaria

- docs/backlog.md
- docs/validation/validacion-arquitectonica.md
- sprint closures recientes del frente continuity/read/E2E
- tests integrados del frente encounter-centric ya cerrados
- specs browser E2E recientes
- loaders de patient detail y encounter detail

### Secundaria

- encounters/data.ts solo para verificar límites, no para reabrirlo por defecto;
- repositorios encounter-scoped si hiciera falta confirmar un invariant;
- documentación histórica mínima necesaria para cerrar un gap puntual.

### No primaria

- charts;
- practitioner resolution;
- identity/session;
- rediseño longitudinal;
- features nuevas.

## 10. Ejecución propuesta

### 0. Prerequisito histórico — drift EVA ya resuelto

Este sprint asume como resuelto el drift del test EVA encounter-scoped relacionado con la firma de search(...) con options.
Ese caso no debe reabrirse como hipótesis de continuidad clínica transversal durante esta auditoría.

Entregable obligatorio del prerequisito
- referencia explícita en T1/T2 de que el caso EVA test-drift queda fuera del diagnóstico de gaps de continuidad.

### T1 — Validación bounded de surfaces e invariantes candidatos

Validar la lista candidata inicial de surfaces e invariantes del punto 5, ajustándola solo si existe una razón clara y documentable.

La salida de T1 debe dejar una tabla de este estilo:

- surface
- tipo de continuidad esperada
- invariant principal
- evidencia ya existente
- gap todavía no cubierto
- prioridad

Entregable obligatorio
- matriz bounded de surfaces e invariantes;
- lista explícita de lo que queda fuera del sprint;
- confirmación de si la lista inicial se mantiene o se ajusta.

### T2 — Baseline de evidencia existente

Cruzar la matriz con la evidencia ya disponible.
Este sprint no debe obligar a reconstruir el mapa desde cero: se parte explícitamente de estas fuentes mínimas:

- e2e/flows/encounter-continuity.spec.ts;
- e2e/flows/encounter-finalize.seeded.spec.ts;
- app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts;
- app/patients/[id]/__tests__/data.test.ts;
- sprint closures recientes de continuidad/canonical read/browser E2E.

Objetivo: evitar trabajo duplicado y medir qué ya está probado vs qué sigue incierto.

Entregable obligatorio
- mapa invariante -> evidencia existente;
- lista breve de gaps reales no cubiertos todavía.

### T3 — Auditoría dirigida de gaps

Para cada gap real detectado, decidir si se resuelve con:

- inspección documental/evidencia ya existente;
- test o guarda mínima adicional;
- confirmación de bug runtime;
- o reconocimiento explícito de deuda conocida sin hardening inmediato.

Resultados posibles por gap
- refutado: la evidencia existente ya demuestra que no hay gap real.
- confirmado: hay bug runtime verificable y corresponde pasar a T4.
- real pero aceptado como deuda conocida: el gap existe, pero no rompe el contrato principal auditado o no justifica hardening inmediato en este sprint.
- requiere evidencia mínima adicional: falta una guarda o prueba pequeña para decidir.

Regla de decisión
- si el gap se refuta con evidencia existente: no abrir código;
- si el gap requiere prueba adicional: agregar evidencia mínima;
- si el gap revela bug runtime: registrar y pasar a T4;
- si el gap es real pero tolerable y ya cae en deuda más amplia reconocida: documentarlo como deuda conocida, sin expandir el sprint.

Entregable obligatorio
- lista de gaps auditados;
- resultado explícito por gap según la tipología anterior.

### T4 — Hardening mínimo condicionado

Solo si T3 confirma un bug runtime verificable.

Alcance permitido:

- fix localizado;
- test de regresión mínimo;
- sin refactor amplio.

Si T3 no confirma bug, T4 se declara no requerido.

### T5 — Cierre documental mínimo

Actualizar:

- sprint doc;
- backlog;
- validación arquitectónica.

El cierre debe distinguir explícitamente entre:

Resultado A — cierre por evidencia

No se detectó gap runtime nuevo verificable en la matriz bounded auditada.
Se cierra el sprint sin cambios productivos o con evidencia mínima adicional solamente.

Resultado B — cierre con hardening mínimo

Se detectó un gap runtime real y se cerró con cambio localizado + regresión mínima.

Resultado C — cierre con deuda conocida explicitada

Se detectó al menos un gap real, pero quedó clasificado como deuda conocida tolerada o de perímetro más amplio, sin justificar hardening inmediato en este sprint.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

- existe una matriz bounded de surfaces e invariantes;
- existe un baseline claro de evidencia previa reutilizable;
- cada gap auditado tiene resultado explícito;
- no se reabren practitioner consistency ni longitudinal/histórico global sin evidencia nueva;
- cualquier cambio productivo queda justificado por bug verificable;
- backlog y validación arquitectónica reflejan el resultado sin sobredeclarar cierre global.

## 12. Definición de done

- prerequisito EVA explicitado;
- T1–T5 cerrados;
- matriz bounded consolidada;
- gaps auditados con resultado explícito;
- hardening mínimo solo si fue necesario;
- docs actualizadas;
- sin scope creep a charts, practitioner, lifecycle o longitudinal global.

## 13. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- menor incertidumbre real sobre continuidad clínica transversal;
- mejor separación entre deuda sistémica real y deuda solo nominal/documental;
- mejor base para decidir si el siguiente paso es:
- hardening puntual,
- extensión de cobertura,
- o cierre por evidencia sin más implementación.

## 14. Próximo paso después de este sprint

Una vez ejecutado este sprint:

- si aparece bug runtime verificable, abrir o continuar con un hardening mínimo sobre ese gap puntual;
- si no aparece bug nuevo, mantener cerrados los frentes bounded-closed y reevaluar si conviene pasar a ActionError.details fuera de encounter write o a otra deuda realmente abierta.

---

## 15. Ejecución parcial registrada (2026-04-05): prerequisito EVA + T1 completo + arranque T2 (baseline)

Estado de esta ejecución:

- prerequisito EVA: **confirmado como resuelto y explícitamente fuera del diagnóstico de gaps**;
- T1: **completado** (matriz bounded consolidada);
- T2: **iniciado** hasta baseline de evidencia existente;
- T3/T4/T5: **no iniciados** en esta ejecución.

### 15.1 Confirmación explícita del prerequisito EVA (fuera del diagnóstico)

Se confirma como prerrequisito histórico resuelto el drift del test EVA encounter-scoped (desalineación de expectativa), sin bug runtime clínico en el circuito auditado.

Por lo tanto:

- **no se reabre** como gap de continuidad clínica transversal en este sprint;
- **no se usa** como evidencia para justificar expansión de alcance;
- se mantiene solo como antecedente de higiene diagnóstica.

### 15.2 Files reviewed (fuentes efectivamente revisadas)

Documentación base/autoridad y estado:

- `docs/guia-rapida.md`
- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`

Sprints recientes continuity/read/E2E:

- `docs/sprints/sprint—validacion-browse-E2E-circuito-clínico-completo-in-progress-save-reload-finalize-alcance-acotado.md`
- `docs/sprints/cierre-estabilizacion-e2e-finalize-seeded-2026-04.md`
- `docs/sprints/sprint—hardening-global-contrato-longitudinal-histórico-fuera-cierre-acotado.md`
- `docs/sprints/sprint-validacion-transversal-encounter-centric.md`
- `docs/sprints/Sprint — Validación E2E browser-level de continuidad clínica.md`

Specs E2E obligatorias:

- `e2e/flows/encounter-continuity.spec.ts`
- `e2e/flows/encounter-finalize.seeded.spec.ts`

Tests integrados relevantes:

- `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts` (history/resumen asociada)

### 15.3 Matriz bounded T1 (validada sin ampliar scope)

| Surface | Invariante principal | Evidencia existente | Gap todavía no cubierto | Prioridad | In/out sprint |
|---|---|---|---|---|---|
| encounter detail in-progress | Rehidratación por `encounterId` + no mezcla + continuidad save/reload/rehydrate | Test integrado de datasets encounter-scoped en `in-progress`; browser E2E continuity valida sentinel note/EVA/vitales tras reload | Falta guarda explícita browser contra remounts múltiples/no determinísticos fuera del reload simple | Alta | **IN** |
| encounter detail finished | Canonical read por `encounterId`, sin fallback temporal como truth source, fail-closed ownership encounter->patient | Tests integrados de no mezcla same-date, guardas contra lookup sibling, y null encounter en mismatch patient | Gap no confirmado; cobertura browser de finished detail se centra más en read-only post-finalize que en matriz de casos negativos same-date | Media | **IN** |
| patient detail | Selector clínico único `inProgressEncounter ?? lastFinishedEncounter` + datasets del mismo encounter | Tests integrados priorizan in-progress frente a finished y evitan consultas al finished sibling cuando ambos existen | No hay evidencia browser dedicada para caso con ambos encounters coexistiendo en el mismo episodio (más allá del seed acotado) | Alta | **IN** |
| encounter history / surface resumen asociada | Separar longitudinal (series) de encounter-centric (cards/maps) sin filtrar fallback a maps/cards | Tests integrados de history: fallback por fecha queda en series longitudinales y maps por encounter permanecen vacíos si falta `encounterId` | Contrato cross-surface history -> patient detail no revalidado en esta ejecución (sí documentado en cierres previos) | Media | **IN (bounded)** |
| browser E2E continuity flow | Flujo integrado `planned -> start -> save -> reload -> rehydrate -> finalize` con sentinels | Spec `encounter-continuity` ya cubre circuito completo y asserts de sentinels + post-finalize | Cobertura sigue acotada a seed mínimo (no matriz de seeds alternativos) | Alta | **IN** |
| browser E2E finalize seeded / outcome post-finalize | Finalize estable + outcome post-finalize compatible con contrato vigente del seed (empty-state) | Spec `encounter-finalize.seeded` + cierre técnico seeded; backlog/validación sostienen contrato empty-state | Pendiente opcional: ampliar baseline con un seed donde sí exista episodio activo post-finalize para contrastar outcome | Media | **IN** |

Resultado T1:

- la lista candidata inicial **se mantiene** sin agregar surfaces nuevas;
- no se justifica rediseño del sprint;
- queda explícitamente fuera: charts, practitioner consistency, longitudinal/histórico global sin evidencia nueva.

### 15.4 Baseline T2 (invariante -> evidencia existente)

- `in-progress encounter detail rehydrate por encounterId`
  - `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
  - `e2e/flows/encounter-continuity.spec.ts`

- `finished encounter detail canonical read y no-mezcla`
  - `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
  - cierre `sprint-canonical-read-finished-*` ya consolidado en backlog/validación

- `patient detail source selection (in-progress prioriza sobre finished)`
  - `app/patients/[id]/__tests__/data.test.ts`
  - backlog + validación arquitectónica (estado vigente acotado)

- `history/resumen: fallback longitudinal no contamina maps encounter-centric`
  - `app/patients/[id]/encounters/__tests__/data.test.ts`
  - cierre acotado del frente longitudinal/histórico (TG1 read-only)

- `browser continuity full loop`
  - `e2e/flows/encounter-continuity.spec.ts`
  - sprint E2E browser integrado (closed 2026-04-04)

- `browser finalize seeded outcome`
  - `e2e/flows/encounter-finalize.seeded.spec.ts`
  - `docs/sprints/cierre-estabilizacion-e2e-finalize-seeded-2026-04.md`

### 15.5 Gaps preliminares (parecen realmente no cubiertos hoy)

Lista corta (preliminar, sujeta a T2 completo):

1. Cobertura browser de `patient detail` en escenario con coexistencia explícita `in-progress + finished` en el mismo episodio para validar source selection en runtime UI.
2. Contraste de outcome post-finalize con más de un seed válido (hoy baseline fuerte en empty-state del seed actual).
3. Revalidación puntual de contrato cross-surface history <-> patient detail en una única prueba sintética actualizada, para asegurar que el cierre previo sigue vigente sin drift documental.

Ninguno de estos tres puntos confirma aún bug runtime productivo; hoy aparecen como brechas de evidencia/cobertura.

### 15.6 Recomendación de siguiente paso

Recomendación: **seguir a T2 completo**.

Justificación:

- T1 ya delimitó bien el bounded scope y no exige T3 inmediato;
- los gaps observados son, por ahora, de evidencia incompleta más que de bug confirmado;
- pasar directo a T3 sobre 1–2 gaps en este punto arriesga introducir hardening prematuro.

Decisión sugerida tras T2 completo:

- si T2 refuerza que son solo huecos de cobertura, cerrar por evidencia parte del alcance;
- si T2 confirma un único gap runtime real, recién ahí abrir T3 sobre ese gap puntual.

### 15.7 Confirmación de no ampliación de scope

Confirmado explícitamente en esta ejecución:

- no se amplió el scope original del sprint;
- no se incorporaron surfaces nuevas fuera de la lista candidata inicial;
- no se reabrieron practitioner consistency ni longitudinal/histórico global;
- no se abrieron charts ni rediseños de arquitectura/read model;
- no se avanzó a T3/T4/T5 en ausencia de bug runtime confirmado.

---

## 16. Continuación T2 completada (2026-04-05): resolución de gaps preliminares

Estado actualizado de ejecución:

- prerequisito EVA: resuelto y fuera del diagnóstico (sin cambios);
- T1: completado (sin cambios);
- T2: **completado** para resolución de los 3 gaps preliminares registrados;
- T3/T4/T5: no iniciados en esta ejecución.

### 16.1 Files reviewed (continuación T2)

Fuentes revisadas en esta continuación:

- `docs/sprints/sprint-continuidad-clinica-full-system.md`
- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- sprints recientes continuity/read/E2E del árbol `docs/sprints/`
- `e2e/flows/encounter-continuity.spec.ts`
- `e2e/flows/encounter-finalize.seeded.spec.ts`
- `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/cross-surface.contract.test.ts`

### 16.2 Resolución T2 por gap

#### Gap 1 — Cobertura browser de `patient detail` con coexistencia explícita `in-progress + finished`

**Evidencia encontrada**

- En integración (`patient detail` loader), ya existe cobertura explícita de prioridad `inProgressEncounter ?? lastFinishedEncounter` cuando ambos coexisten, con asserts de datasets por el `encounterId` correcto y no-consulta al sibling `finished`.
- En cross-surface contract test también se valida selección de `in-progress` y pertenencia a history base membership.
- En browser E2E, el loop integrado actual valida source switch post-finalize, pero no monta un caso UI con coexistencia simultánea `in-progress + finished` dentro del mismo episodio.

**Parte del invariant ya cubierta**

- Regla de selección clínica y no-mezcla en capa loader/integration: **cubierta**.
- Consistencia cross-surface base membership (patient detail seleccionado pertenece a history base): **cubierta**.

**Parte que sigue abierta**

- Verificación browser/UI específica de coexistencia simultánea `in-progress + finished` (mismo episodio) en patient detail: **no cubierta**.

**Clasificación T2**

- **hueco de cobertura** (no hay indicio de bug runtime con evidencia actual).

---

#### Gap 2 — Contraste de outcome post-finalize con más de un seed válido

**Evidencia encontrada**

- `encounter-continuity.spec.ts` valida post-finalize en patient detail para seed de continuidad y observa contrato empty-state.
- `encounter-finalize.seeded.spec.ts` valida lo mismo para el seed de finalize baseline (también empty-state).
- Cierre técnico seeded + backlog + validación arquitectónica confirman que ese resultado empty-state es correcto para esos seeds.

**Parte del invariant ya cubierta**

- `in-progress -> finalize -> finished` con banner read-only y consistencia de outcome post-finalize para los seeds vigentes auditados: **cubierta**.

**Parte que sigue abierta**

- No existe evidencia automatizada de un segundo outcome contractual distinto post-finalize (por ejemplo, seed con episodio activo persistente y comportamiento alternativo esperado): **abierta**.

**Clasificación T2**

- **hueco de cobertura** (de generalización de seeds), no bug runtime confirmado.

---

#### Gap 3 — Revalidación puntual del contrato cross-surface `history <-> patient detail`

**Evidencia encontrada**

- `app/patients/[id]/__tests__/cross-surface.contract.test.ts` valida explícitamente contrato cross-surface:
  - patient detail selecciona `in-progress`;
  - datasets clínicos salen del encounter seleccionado;
  - history conserva membresía base del encounter;
  - ordering visible planned-first permitido sin romper identidad/membresía.
- `app/patients/[id]/encounters/__tests__/data.test.ts` mantiene guardas de separación longitudinal vs maps encounter-centric.
- `docs/validation/validacion-arquitectonica.md` y `docs/backlog.md` ya reflejan cierre acotado de este frente por evidencia.

**Parte del invariant ya cubierta**

- Contrato cross-surface identity/membership y separación semántica history vs patient detail: **cubierta**.

**Parte que sigue abierta**

- No se detecta parte abierta necesaria para T2 en este gap.

**Clasificación T2**

- **gap refutado por evidencia existente**.

### 16.3 Resultado consolidado T2

Estado final de los 3 gaps preliminares:

1. Gap 1 (`patient detail` coexistencia UI browser) -> **vive** como hueco de cobertura.
2. Gap 2 (post-finalize en más de un seed) -> **vive** como hueco de cobertura.
3. Gap 3 (cross-surface history <-> patient detail) -> **cerrado por evidencia existente** (gap refutado).

Conclusión diagnóstica T2:

- no hay evidencia actual de bug runtime nuevo que obligue pasar a T3;
- los gaps vivos remanentes son de cobertura acotada, no de ruptura contractual confirmada.

### 16.4 Recomendación única de siguiente paso

Recomendación elegida:

- **cerrar parte del sprint por evidencia y pasar a T5 más adelante**.

Detalle de alcance para ese cierre parcial:

- cerrar por evidencia el gap 3 (cross-surface refutado);
- mantener gaps 1 y 2 explicitados como cobertura pendiente acotada (sin hardening inmediato);
- no abrir T3 mientras no aparezca indicio fuerte de bug runtime.

### 16.5 Confirmación explícita de no ampliación de scope

Se confirma en esta continuación T2:

- no se amplió scope del sprint;
- no se agregaron surfaces nuevas;
- no se reabrió practitioner consistency;
- no se reabrió longitudinal/histórico global;
- no se tocaron charts;
- no se avanzó a T3/T4/T5.

---

## 17. T5 — Cierre documental del sprint (2026-04-05)

### 17.1 Resultado de cierre

Este sprint cierra con **resultado A (cierre por evidencia)**:

- **sin bug runtime nuevo verificable** en la auditoría bounded ejecutada;
- gap cross-surface `history <-> patient detail` cerrado por evidencia existente (refutado como gap runtime);
- permanecen 2 **huecos de cobertura acotados**:
  1. browser de `patient detail` con coexistencia explícita `in-progress + finished`;
  2. contraste post-finalize con más de un seed válido.

### 17.2 Decisión operativa sobre gaps remanentes

Los dos puntos remanentes son de cobertura acotada y:

- **no requiere hardening inmediato**;
- no justifican abrir T3/T4 en este sprint;
- quedan como cobertura pendiente acotada para seguimiento posterior si prioriza producto/QA.

### 17.3 Límite explícito del cierre

Este cierre:

- **no implica cierre global/system-wide** de continuidad clínica;
- **no implica cierre global/system-wide** del read longitudinal/histórico;
- no reabre practitioner consistency ni otros frentes ya cerrados.

### 17.4 Confirmaciones de control de alcance

Confirmado en T5:

- T3 y T4 no fueron abiertos;
- no hubo cambios productivos;
- no se amplió el scope del sprint;
- el cierre declarado se mantiene bounded y evidence-based.
