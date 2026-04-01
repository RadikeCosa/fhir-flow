# Sprint — Diagnóstico y hardening selectivo del canonical read de finished

## 1. Objetivo

Diagnosticar el estado real del canonical read de encounters finished en el sistema actual y endurecer únicamente los gaps que sigan abiertos fuera del alcance ya validado de finished encounter detail.

El sprint debe determinar con evidencia:

- qué parte del canonical read de finished ya quedó cerrada
- qué parte sigue siendo deuda real
- si existen divergencias entre surfaces o entre documentación y runtime
- si hace falta hardening productivo o solo contrato/tests/docs

## 2. Problema a resolver

Ya existe trabajo previo que cerró en alcance acotado el path de finished encounter detail como lectura encounter-centric por encounterId, sin fallback temporal como source of truth. Ese cierre no equivale a cierre global del read model de finished.

La deuda que sigue abierta no debe formularse de manera genérica como “finished no está resuelto”, sino como una pregunta diagnóstica más precisa:

- ¿qué surfaces siguen dependiendo de composición no canónica?
- ¿qué datasets de finished siguen teniendo comportamiento parcial, duplicado o ambiguo?
- ¿hay bug real, drift documental o solo límites de scope ya conocidos?

Este sprint no parte de cero. Parte del supuesto opuesto:

- algo ya fue cerrado; ahora hay que medir exactamente qué falta y dónde.

## 3. Punto de partida explícito

### 3.1 Ya validado / no reabrir sin evidencia

Tratar como cierre previo validado:

- finished encounter detail como path canónico en alcance acotado
- lectura strict por encounterId
- ausencia de fallback temporal como source of truth en ese surface
- guardas de no-mezcla por misma fecha / aislamiento de paciente

### 3.2 Sigue abierto

Tratar como deuda diagnóstica abierta:

- canonical read global de finished fuera del detail acotado
- consistencia entre surfaces que reutilizan datos de encounters finalizados
- posible drift entre docs y runtime
- cobertura insuficiente de invariantes globales del read model

## 4. Alcance

### Incluye

- diagnóstico del estado actual del canonical read de finished
- contraste entre:
	- finished encounter detail
	- encounter history
	- patient detail cuando usa lastFinishedEncounter
	- charts solo en la medida en que consuman datos de encounters finalizados
- clasificación de hallazgos:
	- OK / ya cerrado
	- drift documental
	- gap real de canonical read
	- diferencia válida por responsabilidad de surface
- hardening mínimo solo si el diagnóstico detecta inconsistencia real
- tests/documentación si aplica

### No incluye

- rediseño global de loaders
- reescritura del modelo longitudinal
- nuevas features clínicas
- cambios en write flow
- reabrir el cierre ya logrado de finished encounter detail sin evidencia

## 5. Riesgos

- reabrir deuda ya cerrada
- confundir “canonical read global” con “todo debe verse igual en todas las surfaces”
- tratar charts longitudinales como si debieran obedecer el mismo contrato encounter-centric
- hacer refactor sin diagnóstico

## 6. Estrategia

Orden obligatorio:

1. T1 — diagnóstico de estado actual
2. T2 — contrato explícito del alcance restante
3. T3 — hardening mínimo solo si hay bug/gap real
4. T4 — tests de regresión
5. T5 — doc correction mínima

## 7. Tareas

### T1 — Diagnóstico del canonical read de finished (estado actual)

Auditar en código y tests:

- qué garantiza hoy finished encounter detail
- cómo se reconstruyen datasets clínicos de encounters finished en otras surfaces
- si patient detail al usar lastFinishedEncounter sigue un contrato canónico o una composición parcial
- qué parte de history usa lectura estricta por encounterId
- si charts o longitudinal composition introducen ambigüedad relevante para finished
- qué documentación quedó alineada o drifted respecto del runtime

#### Salida obligatoria

Diagnóstico con clasificación:

- cerrado
- cerrado en alcance acotado
- drift documental
- gap real restante

### T2 — Contrato explícito del alcance restante

Solo después de T1:

- definir qué significa “canonical read de finished” fuera del detail ya cerrado
- fijar qué debe coincidir entre surfaces
- distinguir:
	- identidad encounter-centric
	- resumen parcial válido
	- composición longitudinal válida
- dejar claro qué NO exige este sprint

### T3 — Hardening mínimo (si aplica)

Solo si T1/T2 encuentran gap real:

- ajuste local en loader / mapper / composición
- sin refactor global
- sin alterar surfaces que ya son válidas

### T4 — Tests de regresión

Agregar tests solo sobre invariantes realmente abiertos detectados por T1/T2.

No duplicar cobertura ya existente del finished encounter detail salvo que haga falta blindar una relación nueva.

### T5 — Documentación mínima

Actualizar backlog / sprint doc / checkpoint solo en lo necesario para reflejar:

- qué parte quedó ya cerrada
- qué parte se mantuvo abierta
- qué contrato adicional se cerró en este sprint

## 8. Criterios de aceptación

El sprint se considera bien cerrado si al final queda demostrado con evidencia cuál de estas dos situaciones es la real:

### Opción A

No hay gap productivo nuevo:

- finished encounter detail sigue siendo el único surface canónico fuerte
- el resto de las diferencias son válidas o documentales
- se corrigen docs/tests sin tocar código productivo

### Opción B

Existe gap real acotado:

- se detecta exactamente dónde
- se corrige con hardening mínimo
- se blinda con tests
- se documenta sin sobredeclarar cierre global

## 9. Resultado esperado

Eliminar ambigüedad sobre el estado real del canonical read de finished:

- qué ya está cerrado
- qué sigue abierto
- qué es diferencia válida entre surfaces
- qué es deuda real del read model