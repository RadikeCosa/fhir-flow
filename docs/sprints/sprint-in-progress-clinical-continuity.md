# Sprint — Diagnóstico y hardening selectivo de continuidad clínica en in-progress

## 1. Objetivo

Diagnosticar el estado real actual de la continuidad clínica en encounters in-progress y endurecer únicamente los gaps que sigan abiertos fuera del alcance ya validado en sprints previos.

El sprint debe determinar con evidencia:

- qué parte del flujo in-progress ya está operativa en runtime
- qué parte ya quedó cerrada en alcance acotado
- qué parte sigue siendo deuda real
- si existen divergencias entre surfaces, documentación y runtime
- si hace falta hardening productivo o solo contrato/tests/docs

## 2. Problema a resolver

in-progress no parte de cero. Ya existe soporte operativo en runtime y ya hubo trabajo previo sobre:

- transición planned -> in-progress
- save progress
- rehidratación encounter-centric
- continuidad acotada en encounter detail

Por lo tanto, el problema no es “implementar in-progress”, sino responder con precisión:

- qué continuidad clínica de in-progress ya está efectivamente cerrada
- qué parte está cerrada solo en un trayecto acotado
- qué parte sigue abierta a nivel system-wide
- qué es gap real versus drift documental o límite de scope

Este sprint parte del supuesto correcto:

- algo importante ya funciona; ahora hay que medir con precisión qué falta y dónde.

## 3. Punto de partida explícito

### 3.1 Ya validado / no reabrir sin evidencia

Tratar como avances reales ya logrados:

- startEncounterAction operativo para planned -> in-progress
- saveEncounterProgressAction operativo en alcance ya implementado
- encounter detail con rehidratación por encounterId
- continuidad acotada save -> reload/remount -> rehydrate
- source switching en patient detail (inProgressEncounter ?? lastFinishedEncounter) validado en surfaces relevantes

### 3.2 Sigue abierto

Tratar como deuda diagnóstica abierta:

- si la continuidad clínica de in-progress está cerrada globalmente o solo en trayectos acotados
- si save / read / rehydrate / finalize están totalmente alineados en todas las surfaces relevantes
- si existen límites no explicitados en UI o loaders
- si el backlog/checkpoint siguen describiendo correctamente el runtime actual

## 4. Alcance

### Incluye

- diagnóstico del estado actual de in-progress
- contraste entre:
	- encounter detail
	- patient detail
	- save progress
	- finalize
	- source switching post-finalize
- clasificación de hallazgos:
	- cerrado
	- cerrado en alcance acotado
	- drift documental
	- gap real restante
- hardening mínimo solo si el diagnóstico detecta inconsistencia real
- tests/documentación si aplica

### No incluye

- rediseño global de formularios
- cambios en finished read model ya validado
- nuevas features clínicas
- rediseño de charts longitudinales
- reabrir deuda ya cerrada sin evidencia

## 5. Riesgos

- reabrir trabajo ya validado
- asumir cierre global por haber validado solo un trayecto
- confundir summary surfaces con continuidad clínica completa
- hacer refactor sin diagnóstico

## 6. Estrategia

Orden obligatorio:

1. T1 — diagnóstico de estado actual
2. T2 — contrato explícito del alcance restante
3. T3 — hardening mínimo solo si hay gap real
4. T4 — tests de regresión
5. T5 — doc correction mínima

## 7. Tareas

### T1 — Diagnóstico de continuidad clínica en in-progress (estado actual)

Auditar en código y tests:

- qué garantiza hoy in-progress encounter detail
- cómo opera saveEncounterProgressAction
- cómo rehidrata el formulario editable
- qué pasa en reload/remount
- qué comportamiento existe post-finalize
- cómo cambia patient detail cuando desaparece in-progress y pasa a lastFinishedEncounter
- qué documentación quedó alineada o drifted respecto del runtime

#### Salida obligatoria

Diagnóstico con clasificación:

- cerrado
- cerrado en alcance acotado
- drift documental
- gap real restante

### T2 — Contrato explícito del alcance restante

Solo después de T1:

- definir qué significa continuidad clínica de in-progress fuera del alcance ya validado
- fijar qué debe coincidir entre save / read / rehydrate / finalize
- distinguir:
	- continuidad encounter-centric válida
	- límites aceptables de otras surfaces
	- diferencias válidas por responsabilidad de surface
- dejar claro qué NO exige este sprint

### T3 — Hardening mínimo (si aplica)

Solo si T1/T2 encuentran gap real:

- ajuste local en action / loader / wiring / read path
- sin refactor global
- sin alterar paths ya válidos

### T4 — Tests de regresión

Agregar tests solo sobre invariantes realmente abiertos detectados por T1/T2.

No duplicar cobertura ya existente salvo que haga falta blindar una relación nueva.

### T5 — Documentación mínima

Actualizar backlog / sprint doc / checkpoint solo en lo necesario para reflejar:

- qué parte ya estaba cerrada
- qué parte sigue abierta
- qué contrato adicional se cerró en este sprint

## 8. Criterios de aceptación

El sprint se considera bien cerrado si al final queda demostrado con evidencia cuál de estas dos situaciones es la real:

### Opción A

No hay gap productivo nuevo:

- in-progress ya funciona correctamente en el alcance relevante
- las diferencias restantes son límites válidos o documentales
- se corrigen docs/tests sin tocar código productivo

### Opción B

Existe gap real acotado:

- se detecta exactamente dónde
- se corrige con hardening mínimo
- se blinda con tests
- se documenta sin sobredeclarar cierre global

## 9. Resultado esperado

Eliminar ambigüedad sobre el estado real de in-progress:

- qué ya está cerrado
- qué sigue abierto
- qué es diferencia válida entre surfaces
- qué es deuda real de continuidad clínica