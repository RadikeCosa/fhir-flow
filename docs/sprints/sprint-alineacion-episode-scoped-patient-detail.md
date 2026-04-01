# Sprint — Alineación episode-scoped de patient detail

- Fecha: 2026-03-31
- Estado: Propuesto

## 1. Objetivo

Implementar en patient detail el contrato semántico ya definido para el encounter de referencia, de modo que el resumen clínico de la pantalla se base exclusivamente en la última visita finished del EpisodeOfCare activo, con selección determinística y datasets clínicos alineados al mismo encounterId.

Este sprint no redefine semántica: la implementa.

## 2. Problema / diagnóstico

El sprint anterior cerró el contrato semántico cross-surface y definió que patient detail debe tomar como encounter de referencia el más reciente dentro del episodio activo, acotando la surface a semántica episode-scoped.

El runtime actual todavía conserva una desalineación en patient detail:

- detecta el episodio activo,
- pero el fallback clínico de “última visita” sigue dependiendo de una lógica patient + practitioner,
- lo que contradice el contrato cerrado y mantiene un selector híbrido dentro de la misma surface.

El problema a resolver ya no es de diseño: es de alineación de selector y composición clínica dentro de patient detail.

## 3. Alcance

### Entra en este sprint

- ajustar el selector de encounter de referencia en patient detail;
- restringir el selector al EpisodeOfCare activo;
- considerar solo encounters en estado finished;
- definir desempate determinístico por fecha y hora;
- alinear datasets clínicos (observations, EVA, procedimientos, etc.) al encounterId seleccionado;
- agregar estado vacío controlado cuando no haya visitas finalizadas registradas;
- incorporar tests de regresión de patient detail.

### No entra en este sprint

- encounter history / encounters page;
- EpisodeChartsPanel o surfaces longitudinales;
- encounter detail;
- refactor global de repositorios;
- cambios estructurales de arquitectura;
- rediseño UX/UI de patient detail;
- rediseño de CTA operativa salvo ajuste mínimo imprescindible por consistencia.

## 4. Decisión ya cerrada que este sprint implementa

patient detail debe mostrar como encounter de referencia:

- la última visita finished del EpisodeOfCare activo;
- si hay múltiples candidatas, gana la más reciente;
- si comparten la misma fecha, desempata la hora más reciente;
- si no existe ninguna visita finished en el episodio activo, se muestra estado vacío controlado.

Mensaje de estado vacío:

No hay visitas finalizadas registradas

## 5. Riesgos principales

### Riesgo 1 — Ajustar solo el selector y no la composición

Que el encounter elegido sea correcto pero los datasets clínicos sigan viniendo de otro origen.

### Riesgo 2 — Empate mal resuelto

Que el criterio de “última visita” no sea estable si hay múltiples finished cercanos o con misma fecha.

### Riesgo 3 — Reabrir scope innecesario

Que el sprint derive en cambios sobre history, charts o refactor de queries sin necesidad demostrada.

### Riesgo 4 — Mezclar semántica con UX

Que se intenten aprovechar estos cambios para rediseñar visualmente patient detail.

## 6. Política de implementación

### Regla 1 — Resolver primero en loader/composición

La preferencia es resolver la alineación en app/patients/[id]/data.ts o boundary equivalente de composición.

### Regla 2 — No tocar repositorio salvo necesidad demostrada

Solo se modifica contrato o query de repositorio si el selector episode-scoped no puede expresarse razonablemente con capacidades ya existentes.

### Regla 3 — Misma fuente para selección y datasets

El encounter seleccionado debe ser la única fuente de verdad para los datos clínicos encounter-based de patient detail.

### Regla 4 — Sin fallback fuera del episodio activo

Si no hay finished en el episodio activo, no se reutiliza ninguna visita de otro episodio ni lógica patient-global.

## 7. Definición de Done

El sprint se considera cerrado solo si:

- patient detail selecciona el encounter de referencia exclusivamente dentro del EpisodeOfCare activo;
- el selector considera únicamente visitas finished;
- el desempate por fecha/hora queda definido y cubierto;
- todos los datasets clínicos encounter-based de patient detail se leen desde el mismo encounterId seleccionado;
- si no existe finished en el episodio activo, se renderiza el estado vacío controlado;
- existen tests automatizados que cubren selección, desempate, no-contaminación entre episodios y alineación de datasets;
- no se expandió el sprint a history, charts o rediseño UI.

## 8. Orden de ejecución

1. validar path actual de selector en patient detail;
2. reemplazar selector híbrido por selector episode-scoped finished;
3. definir y aplicar desempate estable;
4. alinear datasets clínicos al encounter seleccionado;
5. implementar estado vacío controlado;
6. agregar y ejecutar tests de regresión;
7. cerrar documentación de sprint.

## 9. Tickets del sprint

### T1 — Auditoría puntual del selector actual de patient detail

Identificar exactamente dónde se compone hoy el encounter de referencia y cómo se conectan los datasets clínicos a ese selector.

#### Criterios

- selector actual localizado;
- dependencia patient-global identificada;
- punto exacto de composición clínica documentado.

### T2 — Implementación del selector episode-scoped finished

Cambiar la lógica de selección para que patient detail use solo encounters finished del episodio activo.

#### Criterios

- selección restringida al EpisodeOfCare activo;
- in-progress, planned y patient-global quedan fuera del selector de referencia;
- no hay fallback a otros episodios.

### T3 — Desempate determinístico por fecha y hora

Definir y aplicar el criterio de “última visita” cuando existan múltiples finished.

#### Criterios

- orden estable por fecha más reciente;
- empate resuelto por hora más reciente;
- comportamiento determinístico cubierto por tests.

### T4 — Alineación de datasets clínicos + estado vacío

Asegurar que los datos clínicos encounter-based de patient detail provengan del mismo encounterId seleccionado y renderizar el estado vacío si no existe finished.

#### Criterios

- datasets alineados al selector;
- no contaminación desde otro episodio o encounter;
- mensaje vacío visible:
	No hay visitas finalizadas registradas

### T5 — Tests y cierre documental

Agregar evidencia automatizada y dejar cierre acotado del sprint.

#### Criterios

- tests de selección y desempate;
- tests de exclusión de otro episodio;
- tests de alineación de datasets;
- test de empty state;
- cierre documental sin sobredeclarar cambios fuera de patient detail.

## 10. Criterios de aceptación

- patient detail muestra como referencia solo la última visita finished del episodio activo;
- si hay múltiples candidatas, la selección es estable y reproducible;
- los datos clínicos mostrados pertenecen al mismo encounter seleccionado;
- no se reutiliza una visita más reciente de otro episodio;
- si no hay visitas finished, se muestra el empty state definido;
- el cambio queda cubierto por tests automatizados.

## 11. Evidencia mínima esperada

### Incluye

- diff focalizado en patient detail loader/composición;
- tests unitarios o de integración liviana del selector;
- pruebas de alineación encounter → datasets;
- prueba de empty state.

### No incluye

- cambios en history/list;
- cambios en charts;
- E2E browser-level;
- refactor estructural.

## 12. Límites explícitos del cierre

Este sprint no implica:

- alineación completa de todas las surfaces;
- rediseño de la UX de patient detail;
- cambios en el contrato semántico ya cerrado;
- reabrir encounter history o EpisodeChartsPanel;
- refactor global de consultas o loaders.

## 13. Resultado esperado

Al cerrar este sprint:

- patient detail deja de usar una referencia híbrida;
- el resumen clínico queda correctamente episode-scoped;
- la selección del encounter de referencia pasa a ser determinística, verificable y consistente con el contrato ya decidido;
- el sistema reduce una divergencia técnica concreta sin necesidad de rediseño estructural.