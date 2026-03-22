# Visión general del sistema

## 1. Rol del documento

Este documento describe el sistema de forma **end-to-end**, desde la lectura y escritura contra FHIR hasta la representación clínica en UI.

Su función es conectar las capas activas del repositorio sin reemplazar documentos más específicos.

No redefine:

- el detalle del modelo clínico (ver [`current/clinical-model.md`](./current/clinical-model.md))
- el estado detallado del subsistema de charts (ver [`current/internal-clinical-charts-subsystem.md`](./current/internal-clinical-charts-subsystem.md))
- la arquitectura operativa del write flow (ver [`../write-phase-architecture.md`](../write-phase-architecture.md))
- las decisiones de lifecycle y write authority (ver [`../adr/ADR-001-encounter-lifecycle-and-write-architecture.md`](../adr/ADR-001-encounter-lifecycle-and-write-architecture.md))
- el checkpoint puntual del app layer (ver [`current/app-architecture-checkpoint-2026-03.md`](./current/app-architecture-checkpoint-2026-03.md))

La vista aquí es deliberadamente de alto nivel: explica cómo el sistema funciona completo, qué responsabilidades tiene cada capa y cómo se conectan entre sí.

---

## 2. Capas del sistema

### 2.1. Infrastructure

**Responsabilidad**

Encapsular el acceso a FHIR y traducir recursos externos a contratos internos de dominio, tanto en lectura como en escritura.

**Ejemplos de archivos reales**

- `lib/fhir/fhir-client.ts`
- `infrastructure/fhir/repositories/vital-sign-record.fhir-repository.ts`
- `infrastructure/fhir/repositories/encounter.fhir-repository.ts`
- `infrastructure/fhir/repositories/assessments/eva-assessment.fhir-repository.ts`
- `infrastructure/fhir/mappers/vital-sign.mapper.ts`
- `infrastructure/fhir/mappers/assessments/eva-assessment.mapper.ts`
- `infrastructure/fhir/mappers/encounter.write.mapper.ts`
- `infrastructure/fhir/mappers/finalize-encounter-bundle.mapper.ts`

**Qué hace**

- ejecuta búsquedas, lecturas y escrituras contra el servidor FHIR
- valida recursos FHIR en infraestructura antes de mapearlos
- convierte `Observation`, `Encounter` y otros recursos a modelos del dominio
- construye payloads/bundles FHIR para el write flow

**Qué NO debe hacer**

- no debe exponer recursos FHIR crudos a UI o dominio
- no debe decidir presentación visual ni semántica de charts
- no debe mover reglas clínicas al cliente
- no debe devolver `ActionResult`; ese contrato pertenece a Server Actions

### 2.2. Domain

**Responsabilidad**

Definir los contratos clínicos y operativos que el sistema usa internamente, independientes de FHIR y de la UI.

**Ejemplos de archivos reales**

- `domain/vital-sign-record/vital-sign-record.ts`
- `domain/assessments/eva-assessment.ts`
- `domain/encounters/encounter.ts`
- `domain/encounters/encounter.write-input.ts`
- `domain/shared/domain-rules.validator.ts`
- `domain/shared/action-result.types.ts`

**Qué hace**

- modela entidades y agregados clínicos usados por lectura y escritura
- declara contratos de repositorio que infraestructura implementa
- concentra reglas de validación de dominio para write flow
- mantiene tipos estables para límites de capa

**Qué NO debe hacer**

- no debe depender de shapes FHIR
- no debe importar componentes React ni contratos de charting
- no debe ejecutar HTTP ni resolver contexto de sesión
- no debe conocer detalles de render o colores de UI

### 2.3. Application / Formatters

**Responsabilidad**

Preparar datos de dominio para consumo de pantallas y componentes, sin convertir esa capa en infraestructura ni en lógica visual acoplada al renderer.

**Ejemplos de archivos reales**

- `lib/patient/formatters/encounter-charts.formatters.ts`
- `lib/patient/formatters/clinical-ranges.ts`
- `lib/patient/formatters/vital-sign.formatters.ts`
- `lib/patient/formatters/assessments/eva-assessment.formatters.ts`
- `app/patients/[id]/encounters/data.ts`
- `app/patients/[id]/encounters/new/data.ts`

**Qué hace**

- compone read models por ruta (`data.ts`)
- convierte `VitalSignRecord` y `EvaAssessment` a series mínimas para charts
- centraliza rangos clínicos compartidos y helpers de clasificación
- traduce dominio a badges, etiquetas y estructuras consumibles por UI

**Qué NO debe hacer**

- no debe hablar directo con FHIR desde componentes de UI
- no debe redefinir el dominio clínico base
- no debe duplicar en la UI umbrales y etiquetas ya definidos aquí
- no debe mezclar persistencia con presentación

### 2.4. Adapter

**Responsabilidad**

Traducir semántica clínica reusable a semántica visual de charting.

**Ejemplos de archivos reales**

- `lib/patient/formatters/clinical-ranges.adapter.ts`

**Qué hace**

- convierte rangos clínicos a zonas visuales (`ChartZone`)
- enriquece puntos temporales con `rawValue`, `chartValue`, `severity` y `zone`
- aplica clipping al dominio del chart sin perder el valor clínico real
- desacopla la lógica de bandas clínicas del renderer concreto

**Qué NO debe hacer**

- no debe leer FHIR ni acceder a repositorios
- no debe decidir estructura de página o layout
- no debe redefinir los rangos clínicos fuente
- no debe contener lógica de negocio de write flow

### 2.5. UI

**Responsabilidad**

Renderizar la información clínica y operacional usando datos ya compuestos por las capas anteriores.

**Ejemplos de archivos reales**

- `app/patients/[id]/encounters/page.tsx`
- `app/patients/[id]/encounters/components/EpisodeChartsPanel.tsx`
- `app/patients/[id]/encounters/components/charts/SingleSeriesChart.tsx`
- `app/patients/[id]/encounters/components/charts/BloodPressureChart.tsx`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx`

**Qué hace**

- orquesta pantallas por ruta
- selecciona renderer según la métrica
- presenta listas, cards, charts y formularios
- envía escritura vía Server Actions

**Qué NO debe hacer**

- no debe mapear recursos FHIR
- no debe recalcular rangos clínicos por su cuenta
- no debe contener reglas clínicas que ya existan en dominio/formatters
- no debe convertirse en loader de datos server-side fuera de `data.ts` y Server Actions

---

## 3. Flujo de datos (end-to-end)

### 3.1. Read flow

Flujo principal:

```text
FHIR -> repository -> domain -> formatter -> adapter -> UI
```

**Secuencia resumida**

1. El cliente/repositorio FHIR consulta recursos externos.
2. Los mappers de infraestructura validan y convierten esos recursos a modelos de dominio.
3. Los loaders de aplicación (`data.ts`) componen un read model para la ruta.
4. Los formatters convierten ese read model a estructuras mínimas de visualización.
5. El adapter traduce rangos y valores clínicos a zonas y puntos aptos para charts.
6. La UI renderiza charts, cards o formularios usando contratos ya preparados.

**Lectura longitudinal clínica**

En la ruta de encounters, `app/patients/[id]/encounters/data.ts` arma dos vistas simultáneas sobre la misma lectura:

- una vista longitudinal por episodio activo (`vitalSigns`, `evaRecords`)
- una vista indexada por `encounterId` para el detalle por encuentro

Esa composición permite que `EpisodeChartsPanel` renderice evolución temporal sin consultar FHIR directamente y sin reconstruir agrupaciones en el cliente.

### 3.2. Write flow (resumido)

Flujo principal:

```text
UI -> Server Action -> Zod -> Domain Rules Validator -> Write Repository -> Inverse Mapper -> FHIR Client -> FHIR
```

**Secuencia resumida**

1. La UI envía datos del formulario a una Server Action.
2. La Server Action valida shape y coherencia local con Zod.
3. La misma acción resuelve contexto server-side, por ejemplo practitioner actual.
4. El validator de dominio aplica reglas clínicas y de negocio.
5. El repositorio de escritura ejecuta la persistencia usando mappers inversos.
6. Infraestructura construye el recurso o bundle FHIR y lo envía al servidor.
7. La Server Action devuelve `ActionResult` o redirige/revalida en éxito.

**Dos operaciones visibles hoy**

- `createEncounterAction`: crea un `Encounter` en `planned`
- `finalizeEncounterAction`: cierra el `Encounter` y persiste datos clínicos soportados en el write actual

El modelo de runtime implementado hoy sigue siendo transicional: `planned -> finished`. La dirección oficial documentada sigue siendo `planned -> in-progress -> finished`.

---

## 4. Modelo clínico en contexto

El modelo clínico completo ya está documentado en [`current/clinical-model.md`](./current/clinical-model.md). En esta vista solo se ubica ese modelo dentro del sistema.

### `VitalSignRecord`

Es el agregado clínico longitudinal principal para signos vitales. Infraestructura agrupa observaciones FHIR y produce un registro FHIR-agnóstico por fecha/performer. Luego:

- los loaders lo combinan por episodio o por encounter
- los formatters extraen series por métrica
- el adapter lo enriquece para charting
- la UI lo renderiza como tendencia o valor único

### `EVA`

`EvaAssessment` permanece separado de `VitalSignRecord`. El sistema lo trata como assessment propio, con repositorio, mapper y formatter específicos. En la visualización longitudinal entra en el mismo pipeline que los signos vitales, pero desde un contrato de dominio distinto.

### `BloodPressure`

La presión arterial se integra como dato compuesto dentro de `VitalSignRecord`, con `systolic` y `diastolic`. Esto evita tratarla como un único número en dominio. Sin embargo, en visualización requiere un renderer específico (`BloodPressureChart`) porque no encaja en la forma de serie simple usada por otras métricas.

En todos los casos, el modelo clínico sirve como frontera entre FHIR y UI: la interfaz no reconstruye recursos FHIR ni define por sí misma la semántica clínica base.

---

## 5. Visualización clínica

La visualización clínica se apoya en tres piezas conectadas:

### 5.1. `CLINICAL_RANGES`

Es la fuente compartida de umbrales clínicos para signos vitales y el punto de apoyo para clasificación reusable fuera del renderer.

### 5.2. Adapter

`clinical-ranges.adapter.ts` toma esos rangos y los convierte en:

- zonas visuales del chart
- severidad por punto
- valores listos para dibujar dentro del dominio visual

### 5.3. Charts

Los charts consumen datos ya adaptados:

- `SingleSeriesChart` para métricas de una sola serie
- `BloodPressureChart` para presión arterial
- `EpisodeChartsPanel` como coordinador de la métrica seleccionada y del pipeline de enriquecimiento

**Resultado arquitectónico**

La semántica clínica no vive dentro del componente de chart. Los charts renderizan una estructura preprocesada donde ya existen:

- el valor clínico original (`rawValue`)
- el valor visible en el dominio del chart (`chartValue`)
- la severidad (`normal`, `warning`, `critical`)
- la zona/label clínica correspondiente

Para el estado actual del subsistema de visualización clínica, ver [`current/internal-clinical-charts-subsystem.md`](./current/internal-clinical-charts-subsystem.md). El nombre `clinical-charts-current-state.md` se referencia aquí como material esperado de estado, pero no existe hoy en el repositorio; la referencia vigente equivalente es el documento interno actual del subsistema.

---

## 6. Decisiones clave

- **Single source of truth para rangos clínicos.** Los umbrales clínicos compartidos se definen una vez y luego se reutilizan en badges, adapter y charts.
- **Separación dominio vs UI.** El dominio modela conceptos clínicos y operativos; la UI consume contratos ya preparados y no interpreta FHIR ni reglas clínicas base.
- **Adapter pattern para charting.** La traducción de semántica clínica a semántica visual está aislada en una capa puente, en lugar de dispersarse entre componentes.
- **Modelo temporal de encounters.** El runtime actual permite `planned -> finished` por compatibilidad, pero la dirección arquitectónica oficial sigue siendo `planned -> in-progress -> finished`.

---

## 7. Límites del sistema

Este documento no cubre ni amplía:

- `careplan` / `plan-of-care` como flujo funcional end-to-end
- features futuras todavía no implementadas, como draft clínico operativo o lifecycle completo en write
- analytics clínicos avanzados, scoring derivado o interpretación secundaria fuera de lo ya modelado
- rediseños pendientes de loaders o de canonical read más allá de lo documentado como deuda actual

Cuando se necesite detalle de alguno de esos puntos, la fuente debe ser el documento específico correspondiente, no este overview.
