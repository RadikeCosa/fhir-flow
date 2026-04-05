# Sprint — Auditoría bounded de continuidad clínica transversal

- Status: proposed
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