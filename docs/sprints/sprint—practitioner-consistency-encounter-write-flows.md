# Sprint — Practitioner consistency en encounter write flows

- Status: closed (scope-bounded)
- Fecha: 2026-04-04

## 1. Objetivo

Cerrar la inconsistencia restante en la resolución y propagación del contexto de practitioner dentro del frente encounter write, asegurando que todos los flows incluidos respeten la misma regla arquitectónica vigente:

- practitioner se resuelve server-side;
- el contexto de practitioner entra al write input;
- repository y mapper consumen ese contexto desde input;
- los mappers no leen config ni resuelven identidad fuera del boundary correcto.

Este sprint no introduce multi-practitioner ni rediseña identity. Su objetivo es alinear runtime real con autoridad vigente en los flows de escritura de encounter.

## 2. Problema a resolver

La dirección arquitectónica ya está cerrada por ADR y write-phase:

- CURRENT_PRACTITIONER_ID puede existir como configuración de instancia;
- la resolución del practitioner pertenece al flujo server-side;
- el contexto resultante debe pasar explícitamente al write input;
- los mappers deben permanecer puros y no leer config directamente.

Aun así, la validación arquitectónica vigente sigue marcando este frente como parcialmente válido, señal de que la regla está definida pero la uniformidad de implementación entre flows todavía no está cerrada de forma verificable.

El gap esperado es principalmente operativo:

- verificar dónde se resuelve practitioner hoy en cada flow;
- detectar diferencias entre write inputs;
- detectar si algún mapper o capa inferior sigue dependiendo de config de forma directa o indirecta;
- converger todos los flows encounter al mismo contrato.

Cláusula de resguardo: si T1 descubre un gap conceptual real y no solo operativo, ese gap debe documentarse explícitamente y resolverse en T2 como decisión de diseño mínima antes de pasar a T3.

## 3. Por qué este sprint tiene sentido ahora

Es el siguiente paso natural después del cierre de ActionError.details fase 2 en encounter write:

- el backlog deja practitioner consistency como deuda separada una vez cerrado ese frente;
- la validación arquitectónica todavía lo reporta como parcialmente válido;
- ADR-001 lo identifica como corrección arquitectónica explícita, en especial respecto de create y de la pureza del mapper;
- write-phase sostiene exactamente esa misma frontera como regla operativa.

Además, este sprint evita reabrir frentes que hoy no tienen evidencia nueva para justificar trabajo:

- no reabre read-global / longitudinal;
- no reabre browser E2E global;
- no reabre el contrato de ActionError.details;
- no rediseña lifecycle ni write flow.

## 4. Autoridad y límites

Este sprint se apoya en:

- ADR-001, como autoridad para practitioner responsibility, mapper purity y write input boundary;
- write-phase-architecture.md, como referencia operativa del write flow actual;
- validacion-arquitectonica.md, como estado real que todavía marca practitioner resolution como parcialmente válido;
- backlog.md, como referencia de prioridad posterior al cierre de ActionError.details.

Límites de este sprint:

- no redefine lifecycle;
- no introduce soporte multi-practitioner;
- no reemplaza ActionResult;
- no convierte practitioner consistency en rediseño global de identity;
- no toca read model ni browser E2E.

## 5. Alcance incluido

Incluye:

### Baseline real del practitioner flow en encounter write

- inventariar dónde se resuelve practitioner hoy;
- inventariar qué write inputs cargan performerId y practitionerName;
- inventariar qué repositorios y mappers consumen practitioner desde input.

### Contrato uniforme de practitioner write context

- definir el shape mínimo que todos los flows encounter deben respetar;
- fijar la regla de propagación entre Server Action -> write input -> repository -> mapper.

### Corrección de inconsistencias en el frente encounter

- converger create / start / save-progress / finalize / register al mismo patrón.

### Blindaje con tests

- cubrir el contrato uniforme y prevenir regresiones de acoplamiento a config o resolución fuera de boundary.

### Cierre documental mínimo

- backlog;
- validación arquitectónica;
- sprint doc.

## 6. Alcance excluido

No incluye:

- soporte multi-practitioner;
- rediseño de autenticación o sesión;
- rediseño del modelo de identity;
- cambios de lifecycle;
- refactor del read model;
- browser E2E global;
- cambios de UX;
- reapertura del sprint de ActionError.details;
- cambios amplios fuera del frente encounter write.

## 7. Riesgos principales

### 7.1 Scope creep hacia identity

Al tocar practitioner context puede aparecer la tentación de rediseñar quién es el usuario actual o cómo se autentica.

Mitigación: este sprint no redefine identity; solo endurece consistencia del contexto ya existente.

### 7.2 Corregir demasiado bajo en la pila

Puede aparecer la tentación de arreglar practitioner “desde mapper o infra”.

Mitigación: mantener la regla de autoridad: resolución en Server Action, propagación por input, consumo por repository/mapper desde input.

### 7.3 Asimetría entre flows

Puede cerrarse un flow y dejar otro con convención distinta.

Mitigación: T1 debe inventariar todos los flows encounter antes de T2; T4 debe adoptar solo sobre lista cerrada de acciones.

### 7.4 Mezclar practitioner consistency con otros frentes

Al tocar las actions pueden aparecer deudas de otra clase.

Mitigación: toda deuda no directamente ligada a practitioner context se registra aparte y queda fuera de sprint.

## 8. Regla de implementación

Se mantiene como regla no negociable:

- practitioner identity se resuelve en Server Action;
- write input transporta explícitamente el contexto requerido;
- repository no reinfiere practitioner por fuera del input;
- inverse mapper no lee config ni resuelve identity;
- mapper sigue siendo función pura de transformación.

Regla adicional de perímetro:

- este sprint solo cubre el frente encounter write;
- si aparece una inconsistencia transversal fuera de ese frente, se documenta y se deja fuera de alcance.

## 9. Landing zone inicial

### Primaria

- write inputs de encounter;
- Server Actions del frente encounter;
- mappers de write de encounter;
- puntos de resolución/config de practitioner usados por esos flows, incluyendo el helper o servicio server-side actualmente usado para resolver practitioner y el archivo de config que expone CURRENT_PRACTITIONER_ID, si participan en esos flows.

### Secundaria

- repositorios de write del frente encounter;
- tests de actions / repos / mapper si ya existen.

### No primaria

- UI;
- read model;
- browser E2E;
- cualquier tema de identity más allá de practitioner context operativo.

## 10. Ejecución propuesta

### T1 — Baseline del practitioner flow actual

Auditar:

- createEncounterAction
- startEncounterAction
- saveEncounterProgressAction
- finalizeEncounterAction
- registerEncounterAction

Relevar:

- dónde se resuelve practitioner hoy;
- qué write input incluye performerId;
- qué write input incluye practitionerName;
- si repository/mapper dependen solo del input;
- si existe lectura directa o indirecta de config por debajo de Server Action.

Entregable obligatorio de T1: matriz baseline por flow.

### T2 — Decisión documentada del contrato uniforme

Definir el contrato mínimo uniforme de practitioner context para encounter write.

Cerrar explícitamente:

- qué campos son obligatorios;
- en qué capa se resuelven;
- en qué capa se consumen;
- qué queda prohibido;
- qué ocurre si practitioner no puede resolverse en Server Action.

Regla para ese último punto: T2 debe dejar explícito si ese fallo se traduce a ActionError, en qué layer se reporta y con qué criterio uniforme, para evitar resolución ad hoc por acción durante T4.

Entregable obligatorio de T2: decisión documentada lista para integrar al sprint doc.

#### Decisión T2 — practitioner consistency en encounter write

A partir del baseline de T1, se confirma que el contrato uniforme de practitioner context ya está alineado en los flows de encounter write que construyen o actualizan payload clínico o attribution-driven desde input:

- createEncounterAction
- saveEncounterProgressAction
- finalizeEncounterAction
- registerEncounterAction

En estos cuatro flows:

- practitioner se resuelve en Server Action;
- el write input transporta explícitamente:
- performerId
- practitionerName
- repository y mappers consumen practitioner desde input;
- no se verificó lectura directa de config en mapper o por debajo del mapper path auditado.

#### Exención explícita de startEncounterAction

startEncounterAction queda explícitamente exento del contrato uniforme de practitioner propagation aplicado a los cuatro flows anteriores.

#### Rationale

Según T1, startEncounterAction:

- no resuelve practitioner en Server Action;
- no transporta performerId ni practitionerName en StartEncounterInput;
- opera como transición de estado sobre un encounter ya existente;
- su mapper trabaja sobre el encounter existente actualizando status y period, sin evidencia de escritura de campos de attribution clínica/practitioner como parte de esta operación.

Por lo tanto, en este sprint se formaliza que:

- la ausencia de practitioner context en startEncounterAction no se trata como gap accidental;
- se trata como decisión arquitectónica documentada basada en la semántica actual de la operación;
- no corresponde forzar practitioner propagation en start solo por simetría con flows que sí construyen payload clínico o attribution-driven.

#### Regla uniforme resultante

El contrato uniforme de practitioner context aplica a los flows de encounter write que:

- crean encounter con attribution explícita desde input, o
- construyen / actualizan payload clínico interoperable desde input.

No aplica automáticamente a transiciones operacionales mínimas sobre un encounter ya atribuido cuando la operación:

- no introduce nueva attribution;
- no reescribe fields de practitioner;
- no requiere practitioner context para construir el payload de write.

#### Qué pasa si practitioner no puede resolverse en Server Action

Para los flows donde practitioner context sí es obligatorio (create, save-progress, finalize, register), la imposibilidad de resolver practitioner en Server Action debe tratarse como error del lado servidor previo a repository execution, con manejo uniforme a definir/confirmar en implementación y tests del sprint, sin desplazar esa resolución a mapper o repository.

startEncounterAction queda fuera de esta regla por su exención explícita.

#### Drift documental a corregir

Como parte del sprint se corrige el comentario stale del create mapper que todavía sugiere que performer proviene “from config”, ya que contradice el runtime real auditado, que hoy es input-driven.

#### Consecuencia práctica para el sprint

Esto achica el scope real:

- T3 probablemente no necesita rediseño de tipos globales si el contrato ya existe en los cuatro flows alineados.
- T4 no debería tocar startEncounterAction salvo que aparezca evidencia nueva que contradiga T1.

El trabajo real pasa a ser:

- blindar el estado correcto de create/save-progress/finalize/register,
- documentar la exención de start,
- corregir el comentario stale de create,
- cerrar tests y docs.

### T3 — Implementación shared / input-level

Resultado real (cerrado): no se requirió artefacto shared nuevo.

- Se validó que los write inputs existentes ya cumplen el contrato uniforme para los flows en alcance:
  - `createEncounterAction`
  - `saveEncounterProgressAction`
  - `finalizeEncounterAction`
  - `registerEncounterAction`
- No se introdujeron nuevas abstracciones por simetría.

### T4 — Adopción en flows encounter

Resultado real (cerrado): no hubo cambio de comportamiento ni adopción amplia adicional.

- Se aplicó únicamente la corrección mínima pendiente: comentario stale en create mapper para reflejar contrato input-driven.
- `startEncounterAction` no se tocó y se mantiene como exención explícita de este sprint.

### T5 — Blindaje y cierre documental mínimo

Resultado real (cerrado):

- tests mínimos de regresión sobre contrato input-driven en las superficies existentes del frente;
- alineación documental mínima en backlog + validación arquitectónica + este sprint doc;
- cierre acotado al frente encounter write, sin implicar rediseño global de identity ni soporte multi-practitioner.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

- existe una matriz baseline real por flow;
- practitioner se resuelve de manera uniforme en Server Action para los flows incluidos;
- los write inputs incluidos cargan el contexto practitioner requerido de forma consistente;
- repository y mapper consumen practitioner desde input;
- no quedan lecturas directas de config dentro de mapper en el frente encounter cubierto;
- existe evidencia automatizada concreta, compuesta por lo que T1/T2 determinen como boundary real del cambio y que, como mínimo, cubra:
- tests del contrato de write input o del artefacto central definido en T2;
- tests de actions para verificar propagación correcta del practitioner context;
- tests que eviten regresión hacia lectura de config en mapper cuando corresponda al frente tocado;
- backlog y validación arquitectónica reflejan el cierre sin sobredeclarar más alcance del realmente cubierto.

## 12. Definición de done

- T1–T5 cerrados;
- contrato uniforme de practitioner write context documentado;
- adopción completa en encounter write;
- tests verdes del frente tocado;
- backlog y validación arquitectónica actualizados;
- sin reabrir frentes ajenos;
- sin convertir el sprint en rediseño de identity o multi-practitioner.

## 13. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- menor drift entre ADR / write-phase / runtime real;
- mayor pureza de mapper;
- menor acoplamiento accidental a config;
- mayor consistencia entre create / start / save-progress / finalize / register;
- mejor base para futuros cambios de practitioner sin contaminar capas incorrectas.

## 14. Próximo paso después de este sprint

Una vez cerrado practitioner consistency, recién ahí conviene reevaluar cuál frente sigue con mejor relación costo/valor:

- continuidad system-wide;
- browser E2E global;
- u otro endurecimiento transversal todavía abierto en backlog
