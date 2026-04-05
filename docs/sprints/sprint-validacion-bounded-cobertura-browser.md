# Sprint — Validación bounded de cobertura browser faltante en continuidad clínica

- Status: proposed
- Fecha: 2026-04-05

## 1. Objetivo

Cerrar los huecos de cobertura browser todavía abiertos dentro del frente de continuidad clínica ya validado en alcance acotado, sin reabrir frentes cerrados ni convertir el sprint en hardening productivo salvo que aparezca un bug runtime verificable.

Este sprint es de validación bounded.
No busca rediseñar continuidad clínica, sino completar evidencia donde hoy ya existe landing zone real en specs, seeds y tests integrados. La recomendación actual prioriza exactamente ese frente porque los dos huecos pendientes tienen superficie técnica efectiva en código y mejor relación costo/valor que reabrir deudas nominales o frentes ya cerrados.

## 2. Problema a resolver

El sistema ya cerró, en alcance acotado, varios frentes relevantes:

- continuidad clínica transversal, cerrada por evidencia sin bug runtime nuevo verificable;
- browser E2E bounded del loop clínico encounter-centric;
- practitioner consistency en encounter write;
- ActionError.details fase 3 fuera de encounter write, cerrado por evidencia diagnóstica/documental al no existir perímetro operativo real fuera de ese frente.

Aun así, quedaron dos huecos de cobertura browser explícitos dentro del frente continuidad:

- cobertura browser de patient detail con coexistencia explícita in-progress + finished en el mismo episodio;
- contraste post-finalize con más de un outcome contractual válido.

Estos puntos no constituyen hoy bug runtime confirmado. Son huecos de evidencia sobre un frente que ya tiene base contractual y técnica validada.

## 3. Por qué este sprint tiene sentido ahora

Este sprint tiene sentido ahora porque:

- toma una deuda real y acotada, no nominal;
- tiene landing zone técnica efectiva ya existente:
	- e2e/flows/encounter-continuity.spec.ts
	- e2e/flows/encounter-finalize.seeded.spec.ts
	- seed loaders e2e/support/load-*.ts
	- tests integrados de patient detail y contrato cross-surface;
- evita reabrir practitioner consistency, ActionError fase 3, longitudinal/histórico global o continuity bounded como frentes de hardening;
- permite cerrar incertidumbre de cobertura sin tocar runtime salvo que un spec revele una brecha real.

## 4. Autoridad y límites

### Autoridad

Este sprint se apoya en:

- docs/backlog.md
- docs/validation/validacion-arquitectonica.md
- docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md
- docs/write-phase-architecture.md
- docs/architecture/current/app-architecture-checkpoint-2026-03.md
- sprints recientes del frente continuity/browser E2E y del cierre bounded de continuidad transversal.

### Prerrequisito histórico / exclusión explícita

El drift histórico del test EVA encounter-scoped (calls search with encounter parameter when finding by encounter id) se considera resuelto y fuera de alcance para este sprint.
No debe reingresar como señal diagnóstica de T1/T2.

### Límites no negociables

- no reabrir practitioner consistency;
- no reabrir ActionError fase 3 fuera de encounter write;
- no reabrir canonical finished detail acotado;
- no reabrir longitudinal/histórico global sin evidencia nueva;
- no rediseñar lifecycle;
- no convertir el sprint en hardening global del read model;
- no tocar runtime productivo salvo bug verificable.

## 5. Alcance incluido

Incluye exclusivamente dos frentes, a ejecutar en secuencia:

- T1 primero
- T2 después, usando como baseline estable lo resuelto en T1

No se ejecutan en paralelo para evitar drift accidental de seeds/specs.

### A. Coexistencia browser in-progress + finished en patient detail

Validar en browser/UI que patient detail respeta el selector clínico:

inProgressEncounter ?? lastFinishedEncounter

cuando ambos encounters coexisten de forma explícita dentro del mismo episodio.

Definición operativa de “coexistencia explícita”

Para este sprint, “coexistencia explícita” significa:

- mismo patientId;
- mismo episodeOfCareId activo;
- un encounter en in-progress;
- un encounter en finished;
- ambos visibles/relevantes para el selector clínico del patient detail.

Invariante a demostrar

- patient detail prioriza el encounter in-progress;
- no mezcla datasets del finished sibling;
- el comportamiento browser sigue alineado con el contrato ya validado en integración/cross-surface.

### B. Contraste post-finalize con más de un outcome contractual válido

Agregar evidencia automatizada para que el outcome post-finalize de patient detail no dependa solo del caso actual de empty-state, sino que quede contrastado con un segundo caso contractual válido.

Outcomes contractuales candidatos ya conocidos

- Empty-state válido post-finalize
- Ejemplo contractual vigente:
	- Sin episodio activo
	- No hay visitas registradas en el episodio activo
- Patient detail con última visita visible o equivalente contractual
- Escenario en el que, tras finalize, sigue existiendo contexto activo suficiente para renderizar una visita relevante en patient detail.

El objetivo de T2 no es descubrir outcomes posibles desde cero, sino implementar la cobertura del segundo outcome contractual útil respecto del baseline actual.

### C. Cierre documental mínimo

- sprint doc
- backlog
- validación arquitectónica

## 6. Alcance excluido

No incluye:

- cambios de UX fuera de lo estrictamente necesario para sostener los specs;
- hardening del read global;
- charts;
- practitioner/lifecycle;
- ActionError;
- refactor amplio de seeds;
- rediseño de patient detail;
- cambios productivos del flujo clínico salvo bug real y acotado.

## 7. Riesgos principales

### 7.1 Scope creep hacia hardening productivo

Puede aparecer la tentación de corregir runtime cuando el problema es solo falta de cobertura.

Mitigación: primero ampliar evidencia; solo si aparece bug runtime verificable se permite cambio productivo mínimo.

### 7.2 Convertir el sprint en “matriz de seeds”

El segundo hueco podría escalar hacia demasiados escenarios.

Mitigación: limitar explícitamente el alcance a un segundo outcome contractual útil.

### 7.3 Reabrir continuidad bounded como si siguiera rota

Este sprint no parte de un bug confirmado sino de cobertura faltante.

Mitigación: mantener wording de validación bounded, no de hardening general.

### 7.4 Mezclar integration y browser sin criterio

El frente ya tiene evidencia fuerte en integración y cross-surface; el objetivo aquí es completar browser coverage puntual.

Mitigación: usar integración existente como baseline y tocar browser/seed solo donde realmente falta.

### 7.5 Contaminar T1/T2 con ruido ajeno al sprint

Un drift previo de tests o un cambio innecesario en seed podría desordenar la lectura del resultado.

Mitigación: dejar EVA explícitamente fuera de alcance y ejecutar T1/T2 en secuencia, no en paralelo.

## 8. Regla de implementación

Se mantiene como regla principal:

- este sprint es de validación;
- no se toca runtime salvo bug verificable;
- cualquier ajuste de seed/spec debe ser mínimo, localizado y directamente justificable por el hueco de cobertura.

Regla adicional:

- si el seed actual ya alcanza con microajuste de assertions, no se rediseña;
- si hace falta un segundo seed, debe ser el mínimo contractual útil.

## 9. Landing zone inicial

### Primaria

- e2e/flows/encounter-continuity.spec.ts
- e2e/flows/encounter-finalize.seeded.spec.ts
- e2e/support/load-continuity-minimal-seed.ts
- e2e/support/load-finalize-minimal-seed.ts

### Secundaria

- app/patients/[id]/__tests__/data.test.ts
- app/patients/[id]/__tests__/cross-surface.contract.test.ts
- contratos actuales de patient detail
- cierres documentales recientes del frente continuity/browser

### No primaria

- app/patients/[id]/encounters/data.ts

Queda fuera como objeto de cambio en este sprint, pero puede consultarse como referencia diagnóstica si T1 revela un comportamiento inesperado del selector clínico.

- encounters/data.ts longitudinal
- practitioner/lifecycle
- helpers de ActionError
- UX general

## 10. Ejecución propuesta

### T1 — Cobertura browser de coexistencia in-progress + finished

Objetivo:

- determinar si el seed actual permite modelar coexistencia explícita bajo la definición operativa del punto 5;
- si no alcanza, ajustar mínimamente el seed;
- agregar assertions browser y/o guardas mínimas para validar:
	- prioridad de in-progress;
	- no-mezcla del finished sibling;
	- alineación con contrato ya probado en integración.

Entregable obligatorio

- diagnóstico de si el seed actual alcanzaba o no;
- cobertura agregada sobre coexistencia;
- resultado de ejecución de tests/specs tocados.

### T2 — Segundo outcome contractual post-finalize

Objetivo:

- tomar como baseline el outcome actual de empty-state;
- implementar cobertura automatizada del segundo outcome contractual útil;
- dejar explícito qué outcome cubre cada seed.

Entregable obligatorio

- definición del segundo outcome elegido;
- spec/seed mínimo agregado o endurecido;
- resultado de ejecución de tests/specs tocados.

### T3 — Resolución de bugs reales si aparecen

Solo si T1 o T2 revelan un bug runtime verificable.

Alcance permitido:

- fix localizado;
- regresión mínima;
- sin refactor amplio.

Si no aparece bug real, T3 se declara no requerido.

### T4 — Cierre documental mínimo

Actualizar:

- sprint doc;
- backlog;
- validación arquitectónica.

Debe distinguir entre:

Resultado A — cierre por evidencia

Se completó cobertura faltante sin bug runtime nuevo verificable.

Resultado B — cierre con hardening mínimo

Apareció bug runtime real y se corrigió con cambio localizado.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

- queda cubierta en browser la coexistencia explícita in-progress + finished en patient detail, bajo la definición operativa establecida;
- queda cubierto un segundo outcome contractual post-finalize con un seed válido adicional;
- cualquier cambio productivo está justificado por bug verificable;
- no se reabren practitioner, ActionError, continuity bounded ya cerrada, ni longitudinal global;
- backlog y validación arquitectónica reflejan el resultado sin sobredeclarar cierre global.

## 12. Definición de done

- T1 y T2 cerrados;
- T3 solo si fue necesario;
- T4 documental cerrado;
- evidencia browser ampliada en los dos huecos identificados;
- sin scope creep a otros frentes;
- sin rediseño global del runtime.

## 13. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- cobertura browser más completa dentro del frente continuity bounded;
- menor dependencia de un único seed/outcome contractual;
- mejor confianza para sostener que lo pendiente en continuidad no es un bug runtime oculto sino, en todo caso, deuda más global o de otro frente.

## 14. Próximo paso después de este sprint

Una vez ejecutado este sprint:

- si aparece bug runtime verificable, abrir o continuar con hardening mínimo sobre ese gap;
- si no aparece bug nuevo, mantener cerrado el frente bounded de continuidad y reevaluar otra deuda con landing zone real.