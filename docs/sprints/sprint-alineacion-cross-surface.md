# Sprint — Alineación cross-surface episode-scoped (patient detail ↔ encounter history)

## 1. Objetivo

Alinear semántica y navegación entre patient detail y encounter history bajo el modelo episode-scoped, asegurando coherencia entre:

- encounter relevante del episodio (surface de resumen)
- colección de encounters del episodio (surface de listado)
- navegación hacia encounter detail

Sin unificar comportamiento ni introducir cambios de UX.

## 2. Problema a resolver

Tras los sprints previos:

- ambas surfaces (patient detail y encounter history) ya operan correctamente en modo episode-scoped
- los datasets están separados y sin mezcla

Sin embargo:

- no existe un contrato explícito cross-surface
- la coherencia entre:
	- encounter destacado en patient detail
	- ordering, visibilidad y CTA en encounter history
- no está formalmente validada

El riesgo principal es semántico, pero este sprint debe verificar si esa deuda se manifiesta además como:

- gap de ordering
- gap de visibilidad
- gap de navegación

entre ambas surfaces.

## 3. Definición de comportamiento esperado

### 3.1 Patient detail

Surface de resumen clínico

Selecciona un único encounter relevante:

- in-progress si existe
- en caso contrario, último finished del episodio activo

### 3.2 Encounter history

Surface de colección

Lista encounters del episodio activo

Ordering esperado:

- in-progress primero (si existe)
- luego finished ordenados por fecha descendente
- luego otros estados si aplican

Planned encounters:

- Los encounters planned pertenecen a la colección del episodio activo
- Su visibilidad parcial puede mantenerse según la implementación actual (ej: subset + “+N sesiones más”)
- Este sprint NO redefine ese comportamiento de UI

Comportamiento especial:

- in-progress debe ser visible arriba y con CTA para finalizar

### 3.3 Relación entre surfaces

Ambas operan sobre el mismo episodio activo

Coherencia semántica:

El encounter relevante en patient detail:

- debe pertenecer a la colección base de encounter history
- debe ser consistente con el ordering esperado

Importante:

- “Colección base” ≠ “colección visible”
- Si una decisión UX (ej: colapso de planned) oculta elementos:
	- no se considera bug en este sprint
	- se documenta como límite de visibilidad

Navegación:

- Siempre basada en encounterId
- Independiente de charts o selección implícita

## 4. Alcance

### Incluye

- Auditoría de coherencia entre:
	- selector de patient detail
	- ordering, visibilidad y CTA de encounter history
- Validación de:
	- prioridad de in-progress
	- fallback a último finished
- Validación de navegación basada en encounterId
- Tests de consistencia cross-surface
- Hardening mínimo si se detectan gaps reales

### No incluye

- Rediseño UX
- Cambios en charts (siguen longitudinales)
- Paginación o cambios de listado
- Refactor global de loaders
- Modelado de navegación ida/vuelta (browser-level)
- Explicitar semántica en UI

## 5. Riesgos

- Intentar unificar comportamiento entre surfaces (incorrecto)
- Introducir lógica compartida innecesaria
- Confundir colección base con colección visible
- Expandir el sprint por decisiones UX existentes

## 6. Estrategia

- Auditar comportamiento actual (read-only)
- Evaluar contra contrato definido
- Clasificar hallazgos:
	- OK
	- gap de ordering
	- gap de visibilidad
	- gap de navegación
- Aplicar fixes mínimos solo si hay inconsistencias reales
- Blindar con tests

## 7. Tareas

### T1 — Auditoría cross-surface (read-only)

Verificar:

- selector de patient detail
- ordering real en encounter history
- comportamiento en escenarios:
	- solo finished
	- con in-progress
	- con planned visibles/no visibles
- diferencia entre:
	- colección base
	- colección visible
- navegación desde cada item (href basado en encounterId)

#### Salida:

- diagnóstico explícito:
	- OK / gaps (con tipo: ordering, visibilidad, navegación)

### T2 — Hardening mínimo (si aplica)

Solo si T1 detecta inconsistencias reales:

- ajustar ordering en history
- asegurar prioridad de in-progress
- alinear comportamiento con selector de patient detail

#### Restricciones:

- cambios locales
- sin refactor
- sin alterar UX existente

### T3 — Tests de consistencia cross-surface

Agregar tests que prueben:

- con in-progress:
	- es el seleccionado en patient detail
	- aparece primero en history
- sin in-progress:
	- último finished es seleccionado en patient detail
	- aparece primero en history
- el encounter seleccionado en patient detail:
	- pertenece a la colección base de history

Caso importante:

- si pertenece a la colección base pero no a la colección visible:
	- el test debe reflejarlo como comportamiento válido
	- no como fallo

Navegación:

- sigue siendo estrictamente por encounterId

### T4 — Documentación mínima

- explicitar contrato cross-surface
- documentar límites (colección base vs visible)
- no reescribir arquitectura global

## 8. Criterios de aceptación

- patient detail y encounter history operan sobre el mismo episodio
- el encounter relevante de patient detail:
	- pertenece a la colección base de history
	- es coherente con el ordering esperado
- in-progress:
	- tiene prioridad en ambas surfaces según su rol
- navegación consistente basada en encounterId
- no hay mezcla con datasets longitudinales
- comportamiento UX existente se mantiene

Importante:

- si el encounter relevante no aparece en la colección visible por decisión UX:
	- se documenta como límite del sistema
	- no como fallo del sprint

## 9. Resultado esperado

- coherencia semántica explícita entre surfaces
- navegación predecible
- separación clara entre:
	- colección base
	- colección visible
- base sólida para evolución futura sin regresiones