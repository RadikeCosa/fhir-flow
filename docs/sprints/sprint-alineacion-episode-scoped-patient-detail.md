Sprint — Alineación episode-scoped de patient detail

Fecha: 2026-03-31
Estado: Propuesto

1. Objetivo

Implementar en patient detail el contrato semántico ya definido para el encounter de referencia, asegurando que el resumen clínico se base en:

in-progress ?? último finished del EpisodeOfCare activo

con selección determinística, scope estrictamente episode-scoped y datasets clínicos alineados al mismo encounterId.

Este sprint implementa el contrato; no lo redefine.

2. Problema / diagnóstico

El contrato semántico cerrado establece:

prioridad de in-progress sobre finished
scope restringido al EpisodeOfCare activo

El runtime actual presenta una desalineación:

detecta el episodio activo
pero el fallback de “última visita” sigue dependiendo de lógica patient + practitioner
generando un selector híbrido (episode + global) dentro de la misma surface

El problema es de selector + composición, no de diseño.

3. Alcance
Entra en este sprint
ajustar el selector de encounter de referencia en patient detail;
implementar regla: in-progress ?? lastFinished (episode-scoped);
restringir completamente el selector al EpisodeOfCare activo;
definir desempate determinístico para finished;
alinear datasets clínicos al encounterId seleccionado;
definir e implementar empty state cuando no haya encounters válidos;
agregar tests de regresión.
No entra
encounter history / encounters page;
charts / longitudinal;
encounter detail;
refactor estructural de repositorios;
rediseño UX/UI;
cambios de lifecycle.
4. Regla de selector (implementación)

El encounter de referencia en patient detail se determina así:

Si existe un encounter in-progress en el EpisodeOfCare activo → usar ese
Si no existe → usar el último encounter finished del EpisodeOfCare activo
Si no existe ninguno → renderizar empty state
5. Desempate (solo para finished)

El “último finished” se define con orden determinístico:

ordenar por fecha/hora de finalización
campo explícito a usar: period.end (o equivalente canónico del dominio)
si existe empate exacto → usar criterio estable secundario (ej: id)

Este criterio debe quedar implementado y cubierto por tests.

6. Riesgos principales
R1 — Necesidad de ajuste en repositorio

El repositorio podría no exponer una query clara para:

encounters por EpisodeOfCare
filtrados por status

Si no puede resolverse en app layer de forma limpia, podría requerir ajuste de infraestructura.

R2 — Desalineación selector vs datasets

Elegir correctamente el encounter pero seguir cargando datos clínicos desde otra fuente.

R3 — Scope creep

Extender cambios a:

history
charts
repositorio sin necesidad real
R4 — Mezcla con decisiones de UX

Aprovechar el cambio para rediseñar patient detail.

7. Política de implementación
Regla 1 — Resolver en loader/composición

Preferencia por resolver en app/patients/[id]/data.ts.

Regla 2 — Verificar antes de tocar repositorio

El repositorio solo se modifica si T1 demuestra que el selector no es expresable correctamente.

Regla 3 — Single source of truth

El encounterId seleccionado es la única fuente de datos clínicos encounter-based.

Regla 4 — Sin fallback global

Prohibido usar:

patient-global
practitioner-global
otros episodios
8. Definición de Done
selector implementado como in-progress ?? lastFinished (episode-scoped)
ningún uso de selector patient-global en patient detail
desempate determinístico implementado
datasets clínicos alineados al mismo encounterId
empty state renderizado correctamente cuando no hay encounters válidos
tests cubriendo selección, desempate, no-contaminación y empty state
sin cambios fuera de patient detail
9. Orden de ejecución
auditar selector actual
validar capacidades del repositorio
implementar selector episode-scoped
implementar desempate
alinear datasets
implementar empty state
agregar tests
cerrar documentación
10. Tickets
T1 — Auditoría de selector y repositorio

Identificar:

dónde se construye el selector actual
si existe soporte repo para:
episode-scoped queries
filtrado por status

Criterios

selector actual localizado
dependencia global identificada
decisión clara: resolver en app o requiere repo
T2 — Implementación de selector episode-scoped

Aplicar:

in-progress ?? lastFinished
ambos dentro del episodio activo

Criterios

ningún fallback global
prioridad de in-progress respetada
T3 — Implementación de desempate

Aplicar orden determinístico para finished.

Criterios

uso explícito de period.end
comportamiento estable
cubierto por tests
T4 — Alineación de datasets + empty state
datasets clínicos alineados al encounter seleccionado
implementación de empty state

Empty state

Mensaje:

No hay visitas registradas en el episodio activo

Ubicación:

dentro del componente que renderiza el resumen clínico encounter-based (ej: LastEncounterSection o equivalente)
no en nivel de página completo
T5 — Tests y cierre documental

Tests mínimos:

prioriza in-progress
fallback a finished
desempate correcto
no toma encounter de otro episodio
datasets alineados
empty state

Cierre documental

Actualizar:

backlog.md (nuevo sprint técnico + estado)
validacion-arquitectonica.md (alineación episode-scoped en patient detail)
11. Criterios de aceptación
patient detail refleja correctamente el encounter activo o el último cerrado del episodio
nunca muestra datos de otro episodio
la selección es determinística
los datos clínicos corresponden al encounter seleccionado
el empty state aparece solo cuando corresponde
12. Límites explícitos

Este sprint no incluye:

cambios en history/list
cambios en charts
rediseño UI
refactor global
cambios en contrato semántico
13. Resultado esperado
eliminación de selector híbrido
coherencia total entre selección y datos clínicos
alineación completa con el contrato semántico previo
implementación incremental sin impacto estructural
## 14. Cierre del sprint

### Estado

Sprint cerrado.

### Resultado alcanzado

- `patient detail` dejó de usar un selector híbrido.
- El encounter de referencia quedó alineado al contrato:
  - `in-progress` del EpisodeOfCare activo, si existe;
  - en caso contrario, último `finished` del EpisodeOfCare activo.
- El fallback patient-global / practitioner-global dejó de participar en esta surface.
- Los datasets clínicos encounter-based (`procedures`, `EVA`, `vital signs`) quedaron alineados al mismo `encounterId` seleccionado.
- La selección del último `finished` quedó endurecida con criterio explícito:
  - comparación por timestamp de cierre;
  - desempate determinístico.
- Se incorporó estado vacío controlado en el resumen encounter-based:
  - **No hay visitas registradas en el episodio activo**

### Evidencia

- Tests de selector:
  - prioridad de `in-progress`
  - fallback a latest `finished` del episodio activo
  - exclusión de encounters de otros episodios
  - selección por end timestamp
  - tie-break determinístico
- Tests de render:
  - empty state en `LastEncounterSection`
  - preservación del render general de página

### Impacto técnico real

- Cambio implementado de forma **incremental**.
- No se requirieron cambios en repositorios.
- No se modificaron contracts de datos.
- No se tocaron otras surfaces.

### Lo que NO se hizo (intencionalmente)

- No se modificó `encounter history` / `encounters page`
- No se modificó `EpisodeChartsPanel`
- No se modificó `encounter detail`
- No se hizo rediseño UI general de `patient detail`
- No se alteró el contrato semántico ya definido en el sprint previo

### Resultado de arquitectura

- `patient detail` quedó consistente con el contrato episode-scoped ya decidido.
- Se eliminó la mezcla entre selección por episodio y selección patient-global dentro de esta surface.
- La implementación se mantuvo bounded y sin expansión estructural.

### Próximo paso

Si se requiere continuidad, el siguiente paso natural es un sprint separado para:

**Alineación episode-scoped de encounter history / navegación cross-surface**

solo si el roadmap lo prioriza.
