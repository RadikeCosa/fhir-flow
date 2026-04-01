# Sprint — Diagnóstico y alineación cross-surface episode-scoped (patient detail ↔ encounter history)

## 1. Objetivo

Verificar y, solo si hace falta, endurecer la coherencia cross-surface entre patient detail y encounter history bajo el modelo episode-scoped, tomando como punto de partida el estado real implementado y no solo la documentación existente.

Este sprint busca responder con evidencia si ambas surfaces están efectivamente alineadas en:

- pertenencia al mismo episodio activo
- selección del encounter relevante
- ordering esperado
- visibilidad operativa
- navegación por encounterId

Sin rediseñar UX ni alterar el modelo longitudinal de charts.

## 2. Problema a resolver

La documentación y el backlog ya reconocen deuda abierta de alineación cross-surface entre patient detail y encounter history, mientras que ambas surfaces fueron endurecidas por separado en sprints previos.

El riesgo actual no es solo conceptual. Puede existir drift entre:

- lo documentado como comportamiento esperado
- lo realmente implementado en loaders, selectors y componentes
- lo que el usuario termina viendo o navegando

Por lo tanto, este sprint no debe asumir que el contrato cross-surface ya está claro ni que la documentación vigente refleja perfectamente el runtime.

La primera responsabilidad del sprint es diagnosticar con precisión:

- qué comportamiento está efectivamente implementado hoy
- qué parte coincide con la documentación
- qué parte es drift documental
- qué parte es inconsistencia real del sistema

## 3. Autoridad y criterio de lectura

Para este sprint, la evaluación debe distinguir entre:

### 3.1 Documentos de autoridad

Usar como autoridad normativa:

- ADR-001-encounter-lifecycle-and-write-architecture.md
- write-phase-architecture.md
- guia-rapida.md

Estos documentos mandan cuando existe duda de dirección arquitectónica.

### 3.2 Documentos de estado actual

Usar como referencia de implementación y deuda abierta:

- app-architecture-checkpoint-2026-03.md
- backlog.md

Estos documentos describen estado y pendientes, pero pueden tener drift respecto al runtime y por eso deben ser verificados, no asumidos.

### 3.3 Regla operativa del sprint

Si hay divergencia entre documentación y runtime:

- primero se clasifica como drift documental o gap real
- no se modifica código productivo hasta cerrar ese diagnóstico
- no se reescribe arquitectura global por una diferencia local

## 4. Definición de comportamiento esperado a validar

### 4.1 Patient detail

patient detail debe operar como surface de resumen clínico encounter-centric dentro del episodio activo.

Selector esperado según estado ya documentado:

- usar inProgressEncounter si existe
- en caso contrario, usar lastFinishedEncounter

Los datasets clínicos mostrados en esta surface deben provenir de ese mismo encounterId, sin fallback temporal como source of truth.

### 4.2 Encounter history

encounter history debe operar como surface de colección del episodio activo.

La colección base esperada es la de encounters del episodio activo.

Ordering esperado a verificar contra runtime:

- in-progress primero, si existe
- luego finished en orden descendente
- luego otros estados, si aplican

Planned encounters:

- pertenecen a la colección base del episodio activo
- su visibilidad parcial puede seguir siendo válida por decisión de UX
- este sprint no redefine esa UX

### 4.3 Relación entre surfaces

El contrato cross-surface a verificar es:

- el encounter seleccionado en patient detail debe pertenecer a la colección base de encounter history
- su identidad debe preservarse por encounterId
- su prioridad debe ser coherente con el ordering real de history
- la navegación debe mantenerse encounterId-driven

Importante:

- colección base y colección visible no son lo mismo
- un encounter válido en la base puede no estar visible por decisiones actuales de UX
- eso solo es bug si contradice el contrato real implementado o rompe navegación/consistencia semántica

## 5. Alcance

### Incluye

- diagnóstico del estado real cross-surface
- contraste documentación vs runtime
- auditoría de selector en patient detail
- auditoría de ordering, visibilidad y CTA en encounter history
- validación de pertenencia al mismo episodio
- validación de navegación por encounterId
- tests de consistencia cross-surface
- fixes mínimos únicamente si el diagnóstico detecta inconsistencias reales

### No incluye

- rediseño UX
- cambios en charts longitudinales
- refactor global de loaders
- unificación artificial de ambas surfaces
- paginación o rediseño de listados
- browser-level navigation model
- reescritura masiva de documentación no relacionada

## 6. Riesgos a controlar

- asumir que la documentación describe exactamente el runtime
- tratar drift documental como bug productivo
- confundir colección base con colección visible
- intentar “unificar” dos surfaces con responsabilidades distintas
- expandir el sprint hacia charts, lifecycle o canonical read global

## 7. Estrategia de ejecución

Orden obligatorio:

1. Diagnóstico del sprint
2. Clasificación de hallazgos
3. Hardening mínimo si aplica
4. Blindaje con tests
5. Documentación mínima correctiva

Tipos de hallazgo permitidos:

- OK → runtime y contrato esperado alineados
- Drift documental → el runtime está bien, la documentación quedó atrás
- Gap de ordering
- Gap de visibilidad
- Gap de navegación
- Gap semántico cross-surface

## 8. Tareas

### T1 — Diagnóstico cross-surface y auditoría documentación ↔ runtime

Objetivo: establecer el estado real antes de modificar nada.

Verificar en código y tests actuales:

- selector efectivo de patient detail
- fuente real de datasets clínicos en patient detail
- colección base real usada por encounter history
- ordering real de history
- reglas actuales de visibilidad para planned encounters
- CTA y prioridad visual de in-progress
- href/navegación de cada item por encounterId
- coincidencia o drift respecto de:
	- backlog
	- checkpoint de arquitectura
	- sprint proposal actual

Escenarios mínimos a auditar:

- solo finished
- in-progress + finished
- planned + finished
- planned + in-progress + finished
- encounter relevante presente en colección base pero oculto en visible list
- mismo paciente con múltiples encounters del mismo episodio
- caso negativo de no mezcla inter-episode si hay evidencia relevante en loader/selector

Salida obligatoria de T1:

Diagnóstico explícito con esta forma:

- comportamiento implementado hoy
- documentos alineados
- documentos con drift
- gaps reales detectados
- recomendación: no tocar / hardening local / doc-only correction

### T2 — Contrato cross-surface explícito

Objetivo: traducir el diagnóstico en reglas verificables.

A partir de T1, dejar fijado un contrato mínimo y falsable entre surfaces:

- qué significa “mismo encounter” cross-surface
- qué significa “pertenece a history”
- cuándo un elemento oculto sigue siendo válido
- cuándo hay inconsistencia real
- qué ordering mínimo debe sostenerse
- qué comportamiento de navegación se considera correcto

Restricción:

- no introducir shared abstractions innecesarias
- no forzar una lógica común si hoy ambas surfaces deben seguir diferenciadas

### T3 — Hardening mínimo (solo si T1/T2 detectan gap real)

Aplicar cambios locales únicamente si hay inconsistencia verificable.

Posibles ajustes válidos:

- corregir ordering real de history
- asegurar prioridad de in-progress
- corregir selector o pertenencia de encounter en patient detail
- corregir href/navegación por encounterId
- cerrar desalineaciones semánticas concretas entre surfaces

Restricciones:

- sin refactor global
- sin cambios de UX no necesarios
- sin tocar charts
- sin rediseñar loaders enteros

### T4 — Tests de consistencia cross-surface

Agregar o ajustar tests que prueben contratos explícitos.

Casos mínimos:

Con in-progress

- patient detail selecciona in-progress
- history lo contiene en la colección base
- history lo prioriza según ordering real esperado
- la navegación usa su encounterId

Sin in-progress

- patient detail selecciona el último finished
- ese encounter pertenece a la colección base de history
- su posición en history es coherente con ordering real

Planned con visibilidad parcial

- si el encounter pertenece a la base pero no a la visible list:
	- el test debe distinguir base vs visible
	- no debe marcarlo automáticamente como bug

Guardas negativas

- no mezclar encounter seleccionado con datasets de otro encounterId
- no introducir fallback temporal en surfaces encounter-centric
- no perder navegación encounterId-driven

### T5 — Documentación mínima correctiva

Actualizar solo lo estrictamente necesario según hallazgos.

Posibles salidas:

- si el runtime está bien pero la doc no: corregir backlog/checkpoint/sprint doc
- si hubo gap real: documentar el contrato cross-surface ya endurecido
- explicitar de forma mínima:
	- colección base vs visible
	- ordering esperado
	- límite de visibilidad planned
	- dependencia de navegación por encounterId

No reescribir arquitectura general.

## 9. Criterios de aceptación

El sprint se considera cerrado cuando se demuestra con evidencia que:

- patient detail y encounter history operan sobre el mismo episodio activo
- el encounter relevante de patient detail pertenece a la colección base de history
- la selección en patient detail y el ordering de history son coherentes con el contrato definido
- in-progress tiene prioridad cross-surface cuando existe
- la navegación se mantiene estrictamente basada en encounterId
- cualquier diferencia entre documentación y runtime quedó clasificada como:
	- drift documental
	- o gap real corregido
- no se introdujo mezcla con datasets longitudinales
- la UX existente se conserva salvo ajuste mínimo estrictamente necesario

Importante:

Si el encounter relevante no aparece en la colección visible por decisión UX vigente, eso solo invalida el sprint si rompe el contrato explícito definido en T2.

## 10. Resultado esperado

Al final del sprint debe quedar una de estas dos situaciones, ambas válidas:

### Opción A — Diagnóstico fuerte sin cambios productivos

- se demuestra que el runtime ya está alineado
- se corrige solo documentación drifted
- se blindan contratos con tests

### Opción B — Hardening mínimo con cierre localizado

- se detecta gap real
- se corrige con cambio local
- se documenta el contrato resultante
- se agregan tests de regresión

En ambos casos, el valor del sprint es dejar de hablar de “alineación cross-surface” como intuición y pasar a tenerla como contrato verificable.