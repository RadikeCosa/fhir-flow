# Evolución de encounters y evolución clínica

## Rol del documento

Este documento registra la evolución y las decisiones ya tomadas sobre encounters, endurecimiento del input clínico y semántica visual longitudinal. No es un documento de estado actual exhaustivo ni una hoja de ruta futura: consolida cambios verificables y sus trade-offs.

## Relación con otros documentos

- Ver [`../architecture/current/clinical-model.md`](../architecture/current/clinical-model.md) para el modelo clínico vigente que resulta de esta evolución.
- Ver [`../architecture/current/app-architecture-checkpoint-2026-03.md`](../architecture/current/app-architecture-checkpoint-2026-03.md) para el estado actual de la reorganización de `app/`.

## Alcance y fuentes

Documento base principal:

- `docs/evolution/clinical-visualization-and-encounter-evolution.md`

Insumos adicionales:

- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/write-phase-architecture.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`

## A. Modelo temporal de encounters

### Problema inicial

La arquitectura ya distinguía lifecycle objetivo (`planned -> in-progress -> finished`, con `cancelled` como terminal), pero la realidad implementada seguía operando con compatibilidad `planned -> finished`. Esa transición incompleta convivía con otra necesidad: separar agenda planificada y ejecución real sin romper superficies de lectura que todavía dependían de aliases temporales históricos.

### Decisión de diseño

La decisión consolidada fue separar semánticamente:

- planificación (`plannedDate`, `plannedTime`),
- ejecución real (`actualStartAt`, `actualEndAt`),
- compatibilidad de lectura (`periodStart`, `periodEnd`).

En paralelo, la documentación de autoridad dejó explícito que `planned -> finished` sigue siendo una compatibilidad transicional, no el lifecycle objetivo. El checkpoint de arquitectura en `app/` no cambia esa decisión; la asume y organiza los loaders alrededor de los contratos actuales.

### Impacto arquitectónico

- El dominio y los mappers de lectura/escritura pueden representar mejor la diferencia entre agenda y ejecución real.
- La capa `app/` evita esconder esa transición bajo loaders ambiguos: el checkpoint documenta contratos más honestos y menor overfetch, pero no presenta el lifecycle como cerrado.
- La validación arquitectónica pasa a tratar la transición como deuda conocida y no como diseño definitivo.

### Archivos clave

- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/evolution/clinical-visualization-and-encounter-evolution.md`

### Trade-offs

- Mantener compatibilidad `planned -> finished` reduce ruptura inmediata, pero deja abierta una brecha entre lifecycle deseado e implementación operativa.
- Conservar aliases de compatibilidad simplifica la migración de superficies de lectura, pero prolonga la convivencia de dos semánticas temporales.

### Fuera de scope

- implementación de `startEncounterAction`;
- endurecimiento final para exigir `in-progress` antes de finalizar;
- cierre definitivo del canonical read de encounter finalizado.

## B. Clinical input hardening

### Problema inicial

El write flow requería endurecimiento en varios límites: coherencia temporal real, obligatoriedad de nota clínica en finalización, presión arterial incompleta o incoherente, EVA fuera de rango, consistencia de procedimientos y control de editabilidad del encounter. El riesgo principal no era solo aceptar datos inválidos, sino mezclar responsabilidades entre schema, reglas de dominio, server action e infraestructura.

### Decisión de diseño

La decisión fue sostener la arquitectura multicapa documentada por write phase:

- Zod para forma y coherencia local,
- domain rules validator para coherencia clínica y de negocio,
- server action para contexto del request y ownership,
- mapper inverso puro, sin resolver identidad ni reglas clínicas.

La validación arquitectónica vigente además corrige el tono documental: estos avances validan la dirección general, pero no convierten en “cerrado” lo que sigue transicional o con deuda reconocida.

### Impacto arquitectónico

- El sistema gana límites más nítidos entre validación sintáctica, clínica y de infraestructura.
- El practitioner se consolida como responsabilidad server-side según el ADR, en vez de filtrarse hacia el mapper como resolución implícita.
- La documentación de validación deja de comunicar “aprobado total” y pasa a registrar explícitamente base válida, transición activa y deuda conocida.

### Archivos clave

- `docs/write-phase-architecture.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/evolution/clinical-visualization-and-encounter-evolution.md`

### Trade-offs

- La validación multicapa mejora coherencia, pero exige disciplina continua para no duplicar reglas entre capas.
- La compatibilidad transicional del lifecycle obliga a endurecer finalización sin poder asumir todavía el flujo completo `planned -> in-progress -> finished`.

### Fuera de scope

- tipado definitivo de `ActionError.details`;
- resolución de todas las deudas de canonical read;
- definición operativa cerrada para draft persistence futura.

## C. Visual semantics & charts

### Problema inicial

La visualización longitudinal necesitaba representar severidad clínica compartida sin dispersar umbrales en cada componente ni convertir los charts en una nueva fuente de lógica clínica. Además, el sistema debía resolver diferencias entre modelos clínicos binarios y ordinales, la presión arterial como dato compuesto y la diferencia entre valores reales y ventanas visuales del gráfico.

### Decisión de diseño

La decisión fue organizar el subsistema en capas explícitas:

- fuentes clínicas compartidas (`CLINICAL_RANGES`, `EVA_RANGES`),
- formatters y adapter para traducir semántica clínica a shapes de chart,
- renderers específicos (`SingleSeriesChart`, `BloodPressureChart`, `ChartTooltip`).

El documento base de evolución ya registraba esta separación; el estado actual del subsistema de charts la documenta como implementación verificable, sin extrapolar decisiones clínicas más allá de lo que el código expresa.

### Impacto arquitectónico

- La UI deja de duplicar reglas clínicas y consume series enriquecidas.
- El subsistema de charts queda desacoplado tanto de FHIR como del dominio rico completo.
- La documentación de estado actual y la de evolución pasan a complementarse: una describe cómo está implementado el subsistema, la otra explica por qué llegó a esa organización.

### Archivos clave

- `docs/evolution/clinical-visualization-and-encounter-evolution.md`
- `docs/architecture/current/internal-clinical-charts-subsystem.md`
- `docs/write-phase-architecture.md`
- `docs/validation/validacion-arquitectonica.md`

### Trade-offs

- Los charts ganan consistencia visual, pero incorporan adapters y contratos intermedios adicionales.
- La presión arterial mantiene un renderer propio y una clasificación simplificada basada en sistólica, lo que preserva claridad implementativa a costa de no modelar todavía una semántica completa con ambos componentes.

### Fuera de scope

- rediseño del subsistema de charts como plataforma genérica para cualquier recurso clínico;
- personalización de umbrales por paciente;
- presentar backlog futuro como si ya estuviera implementado.

## Relación con los documentos actuales

- `docs/architecture/current/internal-clinical-charts-subsystem.md` describe el estado verificable del subsistema de charts.
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md` deja constancia de la reorganización reciente de la capa `app/` sin redefinir lifecycle ni reglas de dominio.
- `docs/validation/validacion-arquitectonica.md` valida honestamente el estado real y las deudas activas.
- `docs/evolution/clinical-visualization-and-encounter-evolution.md` sigue siendo un antecedente útil, pero este documento pasa a concentrar la evolución en un formato más breve y estructurado.
