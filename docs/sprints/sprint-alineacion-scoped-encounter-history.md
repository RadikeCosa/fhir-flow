# Sprint — Alineación episode-scoped de encounter history

- Fecha: 2026-03-31
- Estado: Propuesto

## 1. Objetivo

Alinear encounter history al mismo criterio episode-scoped ya aplicado en patient detail, de modo que la lista de encounters y su navegación trabajen exclusivamente con encounters del EpisodeOfCare activo, sin introducir mezcla con lógica longitudinal fuera de los límites explícitos de la surface. La deuda abierta ya lo marca como pendiente fuera de patient detail.

## 2. Problema / diagnóstico

El sprint anterior cerró patient detail como episode-scoped y dejó explícita la deuda pendiente en encounter history, además de la falta de alineación cross-surface completa. Los charts siguen siendo longitudinales/mixtos, lo cual es válido, pero encounter history no debería heredar esa semántica para su lista encounter-based.

El riesgo acá no es un bug de datasets por encounterId en cada item, sino que la surface history siga combinando:

- colección por episodio
- navegación encounter-centric
- contexto longitudinal

sin fronteras suficientemente explícitas.

## 3. Alcance

### Entra

- revisar encounters/data.ts y composición de EncounterList
- asegurar que la lista de encounters renderizada sea exclusivamente del EpisodeOfCare activo
- validar que cada item navegue por su propio encounterId
- reforzar la separación entre:
	- lista/history encounter-based
	- charts longitudinales
- agregar tests de no-mezcla cross-episode en history/list
- cierre documental del sprint

### No entra

- rediseño de charts
- mover EpisodeChartsPanel a otra pantalla
- refactor global del read model
- cambios en patient detail
- cambios en encounter detail
- rediseño visual de history/list salvo ajuste mínimo imprescindible
- browser E2E completo

## 4. Decisión ya cerrada que este sprint implementa

Para encounter history:

- la surface representa todos los encounters del EpisodeOfCare activo
- cada item de la lista es encounter-centric
- charts y agregados longitudinales quedan exentos y mantienen su semántica propia
- la lista no define un “encounter de referencia” único; define una colección episode-scoped

Esto sigue la separación ya documentada entre surfaces longitudinales y encounter-centric, y además encaja con el próximo sprint propuesto agregado en backlog.

## 5. Riesgos principales

### R1 — Mezclar lista con charts

Que la surface completa siga tratándose como longitudinal solo porque convive con EpisodeChartsPanel.

### R2 — Scope creep

Que el sprint derive en rediseño de charts o refactor estructural de encounters/data.ts.

### R3 — Falso cierre

Declarar “history alineado” sin probar que la lista excluye encounters de otros episodios.

### R4 — Mezcla de concerns en la misma surface

Que item-level encounter-centric y page-level longitudinal queden otra vez implícitos y no delimitados.

## 6. Política de implementación

### Regla 1 — La lista manda por episodio

EncounterList y su dataset deben resolverse exclusivamente desde encounters del EpisodeOfCare activo.

### Regla 2 — Charts no redefinen la lista

La presencia de EpisodeChartsPanel no puede alterar el criterio de inclusión/exclusión de encounters en history/list.

### Regla 3 — Cada item navega por id

La navegación a detail debe seguir anclada al encounterId del item seleccionado.

### Regla 4 — Sin expansión a longitudinal global

No se tocan reglas de fallback de charts salvo validación de frontera.

## 7. Definición de Done

El sprint se considera cerrado solo si:

- encounter history renderiza únicamente encounters del episodio activo;
- cada item conserva navegación por encounterId;
- no aparecen encounters de otros episodios en la lista;
- la convivencia con charts queda explícitamente delimitada;
- hay tests automatizados de no-mezcla cross-episode;
- no se expandió el sprint a rediseño de charts o refactor global.

## 8. Orden de ejecución

1. auditar dataset real de history/list;
2. verificar frontera lista vs charts;
3. implementar ajuste episode-scoped si hiciera falta;
4. reforzar tests de no-mezcla y navegación;
5. cerrar documentación y backlog.

## 9. Tickets

### T1 — Auditoría puntual de encounters/data.ts y EncounterList

Identificar:

- qué encounters entran hoy en la lista
- qué parte del loader responde a colección por episodio
- qué parte responde a longitudinal/charts

#### Criterios

- dataset de lista localizado;
- frontera lista/charts documentada;
- riesgo de mezcla cross-episode identificado o descartado.

### T2 — Alineación episode-scoped del dataset de history/list

Ajustar la lista para que solo use encounters del episodio activo.

#### Criterios

- lista acotada al episodio activo;
- ningún fallback global/patient-level en la colección de items;
- sin tocar charts más allá de preservar límites.

### T3 — Hardening de navegación por item

Validar que cada card/fila siga navegando al encounterId propio del item.

#### Criterios

- navegación mantiene identidad por encounterId;
- no se deriva encounter desde contexto longitudinal;
- comportamiento cubierto por tests.

### T4 — Guardas de no-mezcla cross-episode

Agregar pruebas negativas para impedir contaminación desde otros episodios.

#### Criterios

- test de exclusión de encounters de otro episodio;
- test de convivencia correcta lista + charts;
- sin claims de hardening global del read model.

### T5 — Cierre documental

Actualizar sprint y backlog con resultado real y límites.

#### Criterios

- cierre bounded y evidence-based;
- no sobredeclarar alineación cross-surface total;
- dejar explícito qué queda todavía abierto si corresponde.

## 10. Criterios de aceptación

- encounter history muestra solo encounters del episodio activo;
- cada item representa su propio encounter;
- la navegación a detail usa el encounterId del item;
- charts permanecen longitudinales y explícitamente exentos;
- no hay mezcla cross-episode en la lista;
- el cierre documental refleja alcance real.

## 11. Evidencia mínima esperada

### Incluye

- inspección de encounters/data.ts
- tests de dataset de lista
- tests de navegación por item
- guardas de no-mezcla cross-episode

### No incluye

- rediseño de charts
- migración de charts a otra pantalla
- browser E2E
- refactor global de loaders

## 12. Límites explícitos del cierre

Este sprint no implica:

- alineación total de todas las surfaces
- redefinición de charts
- cierre de deuda longitudinal/histórica global
- rediseño de EncounterList
- cambios en patient detail o encounter detail

## 13. Resultado esperado

Al cerrar este sprint:

- encounter history queda coherente como colección episode-scoped;
- la navegación mantiene identidad encounter-centric por item;
- la frontera con charts longitudinales queda más clara;
- se reduce la deuda de alineación cross-surface sin abrir refactor estructural.

Hay dos decisiones que conviene cerrar antes de mandarlo a ejecutar:

- si la lista debe incluir todos los encounters del episodio o solo una ventana paginada inicial con “ver más”;
- si en la misma pantalla querés mantener charts arriba o preferís dejar esa decisión fuera de este sprint.