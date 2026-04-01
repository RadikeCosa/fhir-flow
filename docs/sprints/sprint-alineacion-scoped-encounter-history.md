# Sprint — Alineación episode-scoped de encounter history

- Fecha: 2026-03-31
- Estado: Propuesto

## 1. Objetivo

Validar y endurecer que la lista de encounters es episode-scoped en su membresía, y separar explícitamente ese dataset de los datasets longitudinales (charts) dentro de la misma route.

Este sprint NO redefine charts ni UX de lista; se enfoca en consistencia semántica del dataset y navegación.

## 2. Problema / diagnóstico

El sprint anterior eliminó el selector híbrido en patient detail y dejó abierta la deuda de alineación en otras surfaces.

En encounter history pueden coexistir dos problemas:

### P1 — Dataset incorrecto

La colección de encounters puede no estar estrictamente acotada al episodio activo.

### P2 — Frontera conceptual difusa

La surface combina:

- lista encounter-based
- charts longitudinales

sin delimitación explícita.

Este sprint debe identificar cuál de estos problemas existe (o si coexisten) y resolverlos sin expandir alcance.
La membresía de encounters ya es episode-scoped (no es el problema principal)
La deuda real está en:
mezcla de datasets clínicos longitudinales en la misma route
frontera conceptual entre lista vs charts
representación parcial de planned encounters en UI
## 3. Alcance

### Entra

- auditoría de encounters/data.ts y EncounterList
- validación del dataset base de la lista
- alineación episode-scoped del dataset (si aplica)
- validación de navegación por encounterId
- explicitación de frontera lista vs charts
- tests de no-mezcla cross-episode
- cierre documental

### No entra

- paginación o cambios de ventana visible de la lista
- rediseño visual de history/list
- mover o rediseñar EpisodeChartsPanel
- cambios en patient detail
- cambios en encounter detail
- refactor global del read model
- browser E2E completo

## 4. Decisión semántica (cerrada)

Para encounter history:

- la colección base debe ser episode-scoped (EpisodeOfCare activo)
- cada item es encounter-centric (navega por encounterId)
- charts permanecen longitudinales y exentos
- la lista NO define un “encounter de referencia único”

## 5. Política de implementación

### Regla 1 — Dataset restringido al episodio

La colección base de EncounterList debe provenir exclusivamente del episodio activo.

### Regla 2 — Lo visible pertenece al episodio

Todo encounter visible o navegable en la lista debe pertenecer al episodio activo.

### Regla 3 — Charts no redefinen la lista

La presencia de EpisodeChartsPanel no altera el dataset de la lista.

### Regla 4 — Navegación por identidad

Cada item navega por su encounterId, sin derivaciones desde contexto longitudinal.

### Regla 5 — Sin expansión funcional

No se agregan features (paginación, agrupación, etc.).

## 6. Riesgos principales

### R1 — Dataset incorrecto oculto

El problema puede no ser solo conceptual sino estructural.

### R2 — Scope creep hacia charts

Intentar resolver charts dentro de este sprint.

### R3 — Falso cierre

Declarar alineación sin tests de exclusión cross-episode.

### R4 — UX engañosa

Dataset correcto pero lista visible parcial sin documentar.

## 7. Definición de Done

Todos los encounters visibles/navegables en history:
pertenecen al EpisodeOfCare activo
La lista NO depende de datasets longitudinales
Charts NO influyen en:
membresía
orden
navegación
La separación lista vs charts es explícita en código

Y NO incluir:

mostrar todos los planned
paginación
cambios de UI
redefinir charts

La UI puede continuar mostrando un subconjunto de encounters (ej: planned colapsados), siempre que la membresía del dataset base sea correcta.

## 8. Orden de ejecución

1. auditar dataset real de history/list;
2. distinguir problema:
	dataset vs frontera vs ambos;
3. alinear dataset si corresponde;
4. validar navegación por item;
5. agregar guardas de no-mezcla;
6. documentar límites reales de la UI;
7. cerrar sprint.

## 9. Tickets

### T1 — Auditoría de dataset y frontera

Identificar explícitamente:

- si el dataset base es episode-scoped o no;
- si la UI oculta/submuestra encounters del episodio;
- si hay mezcla por dataset, por frontera, o ambos.

#### Criterios

- diagnóstico explícito (P1, P2 o ambos)
- dataset identificado
- frontera lista vs charts documentada

### T2 — Alineación episode-scoped del dataset

Ajustar la colección base para que sea exclusivamente del episodio activo.

#### Criterios

- dataset sin fallback global
- exclusión completa de otros episodios
- sin tocar charts

### T3 — Hardening de navegación

Validar navegación por encounterId.

#### Criterios

- cada item navega por su id
- sin derivación implícita
- cubierto por tests

### T4 — Guardas de no-mezcla

Agregar tests negativos.

#### Criterios

- exclusión cross-episode validada
- convivencia lista + charts validada
- sin claims globales

### T5 — Cierre documental

Actualizar docs y backlog.

#### Criterios

- cierre acotado y honesto
- límites explícitos
- deuda restante clara

## 10. Criterios de aceptación

- lista sin mezcla cross-episode
- navegación correcta por encounter
- charts no interfieren con dataset de lista
- límites UX explícitos si existen
- evidencia automatizada suficiente

## 11. Evidencia mínima

### Incluye

- tests de dataset
- tests de navegación
- tests de exclusión cross-episode

### No incluye

- E2E browser
- rediseño UI
- cambios estructurales globales

## 12. Límites explícitos

Este sprint no implica:

- mostrar todos los encounters del episodio
- introducir paginación
- redefinir charts
- cerrar deuda longitudinal global
- rediseñar EncounterList
- alinear todas las surfaces del sistema

## 13. Resultado esperado

- encounter history queda consistente como colección episode-scoped
- navegación 100% encounter-centric por item
- eliminación de mezcla cross-episode en la lista
- frontera clara con charts longitudinales
- avance controlado en alineación cross-surface

## ✔️ Nota final (clave)

Este sprint no cambia qué se ve, cambia qué significa lo que se ve.