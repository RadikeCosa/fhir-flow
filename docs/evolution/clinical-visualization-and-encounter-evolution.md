# Evolución de encounters, hardening clínico y visualización longitudinal

## 1. Resumen ejecutivo

### Problemas previos

- El modelo temporal de `Encounter` había quedado atado a un uso simplificado de `period.start` / `period.end`, mientras la dirección arquitectónica del repo ya distinguía entre agenda (`plannedDate`, `plannedTime`) y ejecución real (`actualStartAt`, `actualEndAt`).
- El flujo de cierre clínico necesitaba endurecimiento en varios límites de validación: coherencia de horas reales, presión arterial incompleta o incoherente, EVA fuera de rango, procedimientos con categoría/código incompatibles y control explícito de editabilidad del encounter.
- La visualización longitudinal de signos vitales y EVA tenía que expresar semántica clínica compartida sin duplicar umbrales en cada componente UI, además de resolver casos de un único dato, clipping visual y consistencia entre badge, color y chart.

### Qué quedó resuelto

- El read model de `Encounter` ahora separa explícitamente planificación y ejecución, y mantiene aliases de compatibilidad (`periodStart`, `periodEnd`) para superficies de lectura existentes (`domain/encounters/encounter.ts`, `infrastructure/fhir/mappers/encounter.mapper.ts`, `lib/patient/formatters/encounter.formatters.ts`).
- El flujo de finalize endurece validación en tres capas: schema Zod del formulario, validator de reglas de dominio y guardas de la Server Action antes de invocar el repository (`app/.../FinalizeEncounterForm/finalize-encounter-form.schema.ts`, `domain/shared/domain-rules.validator.ts`, `app/.../actions/finalize-encounter.action.ts`).
- El subsistema de charts quedó organizado alrededor de un modelo clínico compartido (`CLINICAL_RANGES`, `EVA_RANGES`) y de un adapter que traduce ese modelo a shapes visuales enriquecidos (`lib/patient/formatters/clinical-ranges.ts`, `lib/patient/formatters/clinical-ranges.adapter.ts`).

### Partes afectadas

- **Domain:** `Encounter`, `FinalizeEncounterInput`, `EvaAssessment`, `VitalSignRecord`, validator de reglas.
- **Infrastructure / mapping:** mapper de lectura de encounter y mappers write/finalize de encounter.
- **App / server actions:** formulario de cierre y `finalizeEncounterAction`.
- **Formatters clínicos:** rangos clínicos, formatters de signos vitales, formatters de chart y adapter de ranges.
- **UI de visualización:** `EpisodeChartsPanel`, `SingleSeriesChart`, `BloodPressureChart`, `ChartTooltip`.
- **Tests:** temporalidad de encounter, ranges, adapter, badges, tooltip, schema y action de finalize.

## 2. Evolución por épica

### A. Modelo temporal de encounters

#### Problema original

- El ADR define como dirección oficial un lifecycle `planned -> in-progress -> finished -> cancelled`, pero documenta que la realidad implementada todavía opera con compatibilidad `planned -> finished` (`docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`).
- Para soportar esa transición sin romper superficies de lectura existentes, el dominio necesitaba distinguir:
  - agenda planificada (`plannedDate`, `plannedTime`)
  - ejecución real (`actualStartAt`, `actualEndAt`)
  - aliases de compatibilidad (`periodStart`, `periodEnd`)
- Antes de esa separación, el uso de `period` como único campo temporal mezclaba semánticas distintas.

#### Decisiones de diseño

- Mantener `periodStart` y `periodEnd` como compatibilidad explícita, pero marcar en el dominio que código nuevo debe preferir `plannedDate` / `plannedTime` y `actualStartAt` / `actualEndAt` (`domain/encounters/encounter.ts`).
- Resolver la semántica representativa de lectura en un formatter dedicado, no dispersa en UI (`lib/patient/formatters/encounter.formatters.ts`).
- Hacer que el mapper FHIR derive campos nuevos desde `Encounter.period` según estado, en vez de exigir que todo el repositorio migre a la vez (`infrastructure/fhir/mappers/encounter.mapper.ts`).

#### Cambios principales

- `Encounter` incorpora `plannedDate`, `plannedTime`, `actualStartAt`, `actualEndAt` y conserva `periodStart`, `periodEnd` como alias de compatibilidad (`domain/encounters/encounter.ts`).
- `mapFhirEncounterToEncounter`:
  - interpreta `period.start` como planificado cuando `status === "planned"`
  - interpreta `period.start` como inicio real cuando `status === "finished"` o `status === "in-progress"`
  - interpreta `period.end` como fin real solo cuando `status === "finished"`
  - deriva `periodStart` con `resolveAliasPeriodStart()` y `periodEnd` con `resolveAliasPeriodEnd()` (`infrastructure/fhir/mappers/encounter.mapper.ts`).
- `getEncounterRepresentativeStart()` y `getEncounterRepresentativeEnd()` encapsulan la compatibilidad para superficies de lectura: en `finished` priorizan tiempos reales; en otros estados usan `period*` (`lib/patient/formatters/encounter.formatters.ts`).
- `getEncountersPageData()` usa esa semántica representativa para ordenar encounters del episodio activo (`app/patients/[id]/encounters/data.ts`).
- El write path conserva el estado transicional:
  - `mapToFhirEncounter()` crea encounters `planned` y escribe `period.start` desde la agenda (`infrastructure/fhir/mappers/encounter.write.mapper.ts`)
  - `mapToFhirEncounterUpdate()` cierra en `finished` y escribe `period.start` / `period.end` con tiempos reales (`infrastructure/fhir/mappers/encounter.finalize.mapper.ts`)

#### Impacto arquitectónico

- El dominio queda alineado con la dirección del ADR sin forzar todavía un `startEncounterAction` inexistente.
- La compatibilidad transicional `planned -> finished` queda explícita en código y tests, no implícita.
- Las capas de lectura pueden seguir usando `periodStart` / `periodEnd`, pero la fuente semántica ya está separada.

#### Archivos clave

- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `domain/encounters/encounter.ts`
- `lib/patient/formatters/encounter.formatters.ts`
- `infrastructure/fhir/mappers/encounter.mapper.ts`
- `infrastructure/fhir/mappers/encounter.write.mapper.ts`
- `infrastructure/fhir/mappers/encounter.finalize.mapper.ts`
- `app/patients/[id]/encounters/data.ts`
- `lib/patient/__tests__/encounter-temporal.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts` (por la semántica de orden representativo)

### B. Clinical input hardening

#### Problema original

- El write flow documentado exige validación multicapa y responsabilidades separadas (`.github/instructions/copilot.instructions.md`, `docs/write-phase-architecture.md`).
- El cierre clínico necesitaba endurecerse en límites concretos del input:
  - fechas/horas reales inválidas o incoherentes
  - nota clínica vacía
  - presión arterial cargada en forma parcial o con diastólica mayor o igual a sistólica
  - EVA no entero o fuera de 0–10
  - procedimientos con `category` y `code` inconsistentes
  - encounters inexistentes, de otro paciente o no editables
- También había una decisión de ADR relevante: el practitioner debe resolverse server-side y pasar por write input, no leerse desde el mapper.

#### Decisiones de diseño

- Reutilizar `VITAL_SIGN_CAPTURE_RANGES` como fuente de validación de captura para form schema y validator de dominio (`lib/clinical/vital-sign-capture-ranges.ts`).
- Aplicar coherencia local en Zod (`superRefine`) y coherencia de negocio/clinica en `validateFinalizeEncounterRules()` (`app/.../finalize-encounter-form.schema.ts`, `domain/shared/domain-rules.validator.ts`).
- Resolver practitioner en la Server Action con `getCurrentPractitioner()` y construir un `FinalizeEncounterInput` completo antes del repository (`app/.../actions/finalize-encounter.action.ts`).
- Mantener el contrato `ActionResult` y traducir cada error a `layer: validation | domain | fhir`, tal como indican las guías del repo (`docs/write-phase-architecture.md`).

#### Cambios principales

- `finalizeEncounterFormSchema` valida forma y coherencia local:
  - `actualDate`, `actualStartTime`, `actualEndTime`
  - `clinicalNote` trimmeada y obligatoria
  - `reasonDisplay` opcional pero no whitespace-only
  - signos vitales y EVA coercionados a número y limitados por `VITAL_SIGN_CAPTURE_RANGES`
  - procedimiento con categoría/código requeridos
  - `actualEndTime > actualStartTime`
  - presión arterial completa y con diastólica `<` sistólica
  - compatibilidad categoría/código de procedimiento (`app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.schema.ts`)
- `validateFinalizeEncounterRules()` revalida a nivel dominio:
  - IDs requeridos
  - `actualStartAt` / `actualEndAt` ISO válidos y ordenados
  - `clinicalNote` obligatoria
  - presión arterial completa y dentro de rangos de captura
  - EVA entero 0–10
  - correspondencia categoría/código de procedimiento (`domain/shared/domain-rules.validator.ts`)
- `finalizeEncounterAction()` agrega hardening server-side:
  - parsea con schema
  - verifica existencia del encounter
  - verifica que el encounter pertenezca al paciente de la ruta
  - rechaza `finished` y `cancelled`
  - conserva compatibilidad transitoria permitiendo `planned`
  - resuelve practitioner server-side y lo inserta en `FinalizeEncounterInput`
  - devuelve errores tipados por capa (`app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts`)
- `CreateEncounterInput` y `FinalizeEncounterInput` cargan `performerId` y `practitionerName` explícitamente, siguiendo la responsabilidad fijada por el ADR (`domain/encounters/encounter.write-input.ts`).
- `mapToFhirEncounter()` y `mapToFhirEncounterUpdate()` dejan de ser responsables de identidad runtime; solo transforman input validado a payload FHIR (`infrastructure/fhir/mappers/encounter.write.mapper.ts`, `infrastructure/fhir/mappers/encounter.finalize.mapper.ts`).

#### Impacto arquitectónico

- Se refuerza la separación de responsabilidades documentada en el repo:
  - Zod valida forma y coherencia local.
  - Domain validator valida reglas clínicas y de negocio.
  - Server Action controla contexto del request y ownership.
  - Mapper sigue siendo puro.
- El endurecimiento no mueve lógica clínica a infrastructure ni a UI; la UI participa solo en validación de formulario.
- La compatibilidad transicional del lifecycle se mantiene explícita sin debilitar la editabilidad server-side.

#### Archivos clave

- `.github/instructions/copilot.instructions.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `domain/encounters/encounter.write-input.ts`
- `domain/shared/domain-rules.validator.ts`
- `lib/clinical/vital-sign-capture-ranges.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.schema.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx`
- `app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts`
- `infrastructure/fhir/mappers/encounter.write.mapper.ts`
- `infrastructure/fhir/mappers/encounter.finalize.mapper.ts`
- `domain/shared/__tests__/domain-rules.validator.test.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/__tests__/finalize-encounter-form.schema.test.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/__tests__/finalize-encounter-form.render.test.tsx`
- `app/patients/[id]/encounters/[encounterId]/actions/__tests__/finalize-encounter.action.test.ts`
- `infrastructure/fhir/mappers/__tests__/encounter.write.mapper.test.ts`
- `infrastructure/fhir/mappers/__tests__/encounter.finalize.mapper.test.ts`

### C. Visual semantics & charts

#### Problema original

- Los charts longitudinales necesitaban expresar severidad clínica de manera consistente con badges y formatters, sin umbrales hardcodeados en cada componente.
- Recharts trabaja con shapes visuales (`dataKey`, `ReferenceArea`, `Tooltip`) que no coinciden con el modelo clínico del dominio.
- Había casos específicos que requerían tratamiento propio:
  - un único dato no produce una línea útil
  - SpO₂ puede tener valores reales por debajo del dominio visual deseado
  - EVA es una escala ordinal de 5 zonas, no un semáforo simple
  - tensión arterial es multiserie y su semántica actual se basa en sistólica

#### Decisiones de diseño

- Separar el problema en tres capas:
  1. dominio / semántica clínica (`EVA_RANGES`, `CLINICAL_RANGES`)
  2. adaptación a shapes de chart (`clinical-ranges.adapter.ts`)
  3. renderers de Recharts (`SingleSeriesChart`, `BloodPressureChart`, `ChartTooltip`)
- Mantener `SingleSeriesChart` como renderer genérico para métricas de una serie y sostener `BloodPressureChart` como caso especial real.
- Usar dominios visuales fijos (`CLINICAL_CHART_RANGES`) en lugar de autoscaling por dato.

#### Cambios principales

- `formatVitalSignsForChart()` y `formatEvaForChart()` convierten domain objects a series mínimas ordenadas cronológicamente (`lib/patient/formatters/encounter-charts.formatters.ts`).
- `CLINICAL_CHART_RANGES` fija dominios visuales para FC, FR, SpO₂, temperatura, TA y EVA; `CLINICAL_CHART_COLORS` centraliza paleta clínica (`lib/patient/formatters/encounter-charts.formatters.ts`).
- `clinical-ranges.ts` define una fuente clínica compartida:
  - métricas binary para signos vitales
  - EVA como `kind: "ordinal"`
  - helper para zonas, lookup y adaptación (`lib/patient/formatters/clinical-ranges.ts`)
- `clinical-ranges.adapter.ts` introduce el adapter entre clínica y chart:
  - `EnrichedChartDatum`
  - `rawValue` vs `chartValue`
  - `getValueSeverity()`
  - `toChartZones()`
  - `enrichChartData()`
- `EpisodeChartsPanel` compone el pipeline:
  - carga series longitudinales del episodio activo
  - formatea datos por métrica
  - enriquece cada punto con severidad y zona
  - elige `SingleSeriesChart` o `BloodPressureChart` según métrica (`app/patients/[id]/encounters/components/EpisodeChartsPanel.tsx`)
- `SingleSeriesChart` resuelve:
  - empty state
  - single-value fallback con badge y color clínico
  - gráfico de múltiples puntos con `ReferenceArea`, tooltip custom, punto actual y dots sutiles opcionales
  - `dataKey="chartValue"` para respetar clipping visual sin perder el valor real en tooltip (`app/patients/[id]/encounters/components/charts/SingleSeriesChart.tsx`)
- `BloodPressureChart` mantiene un renderer separado porque combina sistólica/diastólica en un eje compartido y usa la sistólica enriquecida como serie semántica principal (`app/patients/[id]/encounters/components/charts/BloodPressureChart.tsx`).
- `ChartTooltip` prioriza `payload.rawValue` cuando existe, de modo que el tooltip muestre el valor clínico real aun si el chart dibuja uno clippeado (`app/patients/[id]/encounters/components/charts/ChartTooltip.tsx`).

#### Impacto arquitectónico

- La UI deja de definir semántica clínica propia y consume un modelo enriquecido ya clasificado.
- Los charts quedan desacoplados del dominio rico (`VitalSignRecord`, `EvaAssessment`) y también de FHIR.
- La semántica clínica compartida evita drift entre badge, acento visual, reference zones y tooltip.

#### Archivos clave

- `lib/patient/formatters/encounter-charts.formatters.ts`
- `lib/patient/formatters/vital-sign.formatters.ts`
- `lib/patient/formatters/clinical-ranges.ts`
- `lib/patient/formatters/clinical-ranges.adapter.ts`
- `domain/assessments/eva-assessment.ts`
- `domain/vital-sign-record/vital-sign-record.ts`
- `app/patients/[id]/encounters/components/EpisodeChartsPanel.tsx`
- `app/patients/[id]/encounters/components/charts/SingleSeriesChart.tsx`
- `app/patients/[id]/encounters/components/charts/BloodPressureChart.tsx`
- `app/patients/[id]/encounters/components/charts/ChartTooltip.tsx`
- `lib/patient/formatters/__tests__/clinical-ranges.test.ts`
- `lib/patient/formatters/__tests__/clinical-ranges.adapter.test.ts`
- `lib/patient/formatters/__tests__/vital-sign.formatters.test.ts`
- `lib/patient/formatters/__tests__/encounter-charts.formatters.test.ts`
- `app/patients/[id]/encounters/components/charts/__tests__/ChartTooltip.test.ts`

## 3. Arquitectura de carpetas y responsabilidades

### `domain/`

- Contiene modelos clínicos y contratos agnósticos a FHIR.
- Relevante para estas épicas:
  - `domain/encounters/encounter.ts`: contrato de lectura de encounter con temporalidad separada.
  - `domain/encounters/encounter.write-input.ts`: contratos de create/finalize.
  - `domain/assessments/eva-assessment.ts`: modelo EVA y `EVA_RANGES`.
  - `domain/vital-sign-record/vital-sign-record.ts`: modelo agrupado de signos vitales.
  - `domain/shared/domain-rules.validator.ts`: reglas clínicas del write.

### `lib/patient/formatters/`

- Capa de adaptación de lectura/presentación, sin FHIR.
- Responsabilidades aquí:
  - `encounter.formatters.ts`: semántica temporal representativa.
  - `encounter-charts.formatters.ts`: shapes mínimos para chart, dominio visual, colores y formateo de fecha.
  - `vital-sign.formatters.ts`: badges y acentos para métricas clínicas.
  - `clinical-ranges.ts`: modelo de rangos clínicos compartido.
  - `clinical-ranges.adapter.ts`: traducción clínica -> chart.

### `adapter`

- No es una carpeta aislada; en esta implementación el adapter es `lib/patient/formatters/clinical-ranges.adapter.ts`.
- Su responsabilidad es evitar que la UI consuma directamente:
  - `CLINICAL_RANGES`
  - `EVA_RANGES`
  - `Infinity`
  - reglas de clipping
  - decisión de severidad por punto

### `app/.../charts/components`

- Renderers client-side basados en Recharts.
- `SingleSeriesChart.tsx`: una serie temporal con zonas y fallback.
- `BloodPressureChart.tsx`: caso multiserie.
- `ChartTooltip.tsx`: tooltip desacoplado del valor dibujado.
- `EpisodeChartsPanel.tsx`: composición del pipeline y selector de métrica.

### `tests`

- El repo no tiene un directorio único `tests/`; la cobertura vive cerca del módulo.
- Para estas épicas, la mayor parte de las garantías están en:
  - `lib/patient/__tests__/...`
  - `lib/patient/formatters/__tests__/...`
  - `app/patients/[id]/encounters/.../__tests__/...`
  - `domain/shared/__tests__/...`
  - `infrastructure/fhir/mappers/__tests__/...`

## 4. Modelo clínico

### Métricas binary

- `CLINICAL_RANGES` define `kind: "binary"` para:
  - `heartRate`
  - `respiratoryRate`
  - `oxygenSaturation`
  - `bodyTemperature`
  - `bloodPressure`
- En ese modelo existe una zona `normal` y opcionalmente múltiples zonas `warning` / `critical` (`lib/patient/formatters/clinical-ranges.ts`).
- El término `binary` en esta implementación no significa "dos zonas" sino "métrica cuyo punto de referencia principal es normal vs fuera de rango", aun cuando haya varios segmentos warning/critical.

### EVA como escala ordinal

- `EvaAssessment` es un assessment separado, no un `VitalSignRecord` (`domain/assessments/eva-assessment.ts`).
- `EVA_RANGES` define cinco bandas explícitas:
  - `none`
  - `mild`
  - `moderate`
  - `severe`
  - `worst`
- `getEvaClinicalRanges()` transforma esa fuente a `ClinicalRanges` con `kind: "ordinal"` y conserva las cinco zonas (`lib/patient/formatters/clinical-ranges.ts`).
- Consecuencia: EVA no se colapsa a 3 niveles para charting; la severidad se deriva de una escala ordinal de 5 bandas.

### Tensión arterial como caso especial

- `VitalSignRecord` modela presión arterial como `bloodPressure: { systolic, diastolic }` (`domain/vital-sign-record/vital-sign-record.ts`).
- La clasificación clínica actual del sistema usa solo sistólica para badge y severidad (`lib/patient/formatters/vital-sign.formatters.ts`, `lib/patient/formatters/clinical-ranges.adapter.ts`).
- El chart, sin embargo, muestra ambas series. Esto hace de presión arterial un caso especial real, no un simple `TimeValueDatum`.

### `CLINICAL_RANGES`

- Es la fuente compartida para lookup clínico de signos vitales.
- Incluye zonas con límites finitos e infinitos (`Number.NEGATIVE_INFINITY`, `Number.POSITIVE_INFINITY`) para cubrir toda la recta clínica relevante (`lib/patient/formatters/clinical-ranges.ts`).
- `getClinicalZones()` ordena esas zonas y `getClinicalZoneForValue()` resuelve el lookup puntual.

### `EVA_RANGES`

- Vive en dominio, no en UI (`domain/assessments/eva-assessment.ts`).
- Se reutiliza desde formatters y adapter; no hay una tabla EVA duplicada en charts.

### Por qué no se duplicó lógica clínica en UI

- La UI consume `EnrichedChartDatum[]` y `ChartZone[]`, no thresholds crudos.
- Los badges vienen de `vital-sign.formatters.ts`; las zonas y severidad de charts salen del adapter; ambos comparten la misma fuente clínica.
- Esto evita divergencias entre:
  - badge textual
  - color/accento
  - zona de fondo
  - tooltip
  - clasificación de un punto aislado

## 5. Adapter pattern

### `EnrichedChartDatum`

- `EnrichedChartDatum` agrega a cada punto:
  - `date`
  - `rawValue`
  - `chartValue`
  - `severity`
  - `zone { label, color }`
- Es el contrato que consumen los charts (`lib/patient/formatters/clinical-ranges.adapter.ts`).

### `rawValue` vs `chartValue`

- `rawValue`: valor clínico original del dato.
- `chartValue`: valor clippeado al dominio visual del eje Y.
- Esto permite mostrar un dato fuera del dominio visual sin perder su valor real en tooltip.
- Caso verificable: SpO₂ 30 queda `chartValue = 50` pero `rawValue = 30` (`lib/patient/formatters/__tests__/clinical-ranges.adapter.test.ts`).

### `getValueSeverity`

- Calcula `normal | warning | critical` desde las bandas clínicas para una métrica concreta.
- Para EVA no usa `CLINICAL_RANGES`; deriva directamente desde `EVA_RANGES` a través del orden `none -> mild -> moderate -> severe -> worst` (`lib/patient/formatters/clinical-ranges.adapter.ts`).

### `toChartZones`

- Convierte bandas clínicas a `ChartZone[]` con:
  - límites resueltos al dominio visual
  - color por severidad
  - eliminación de `Infinity` a favor de valores finitos del chart
- Usa `resolveZoneBounds()` para reemplazar `-Infinity/+Infinity` por `chartMin/chartMax`.

### `enrichChartData`

- Enriquecimiento puntual por dato:
  - clasifica severidad
  - busca label/color de zona
  - clippea `chartValue`
  - preserva `rawValue`

### Por qué el adapter existe

- Recharts necesita números finitos y claves concretas (`chartValue`, `y1`, `y2`).
- El modelo clínico tiene:
  - bandas ordinales y binary
  - límites infinitos
  - labels y severidades clínicas
- El adapter separa ambas preocupaciones.

### Qué evita arquitectónicamente

- Que cada chart implemente su propia clasificación clínica.
- Que la UI conozca `Infinity` o reglas de clamping.
- Que `CLINICAL_RANGES` y `EVA_RANGES` queden acoplados al renderer concreto.
- Que el tooltip deba adivinar cuándo un valor fue clippeado.

## 6. Instrumentación visual

### Single-value fallback

- `SingleSeriesChart` y `BloodPressureChart` desvían el render cuando `data.length === 1`.
- En lugar de forzar una línea temporal con un solo punto, muestran una tarjeta con:
  - valor principal
  - badge clínico
  - color de acento
  - fecha
  - mensaje `Solo hay un registro disponible`
- Esto está implementado directamente en ambos componentes (`app/patients/[id]/encounters/components/charts/SingleSeriesChart.tsx`, `.../BloodPressureChart.tsx`).

### Multi-point charts

- Cuando `data.length > 1`, ambos renderers usan `LineChart` de Recharts con:
  - `ResponsiveContainer`
  - `CartesianGrid`
  - `XAxis` con `formatChartDate`
  - `YAxis` con dominio fijo
  - `Legend`
  - `Tooltip` custom

### Zonas clínicas

- Las bandas clínicas se dibujan con `ReferenceArea` a partir de `toChartZones()`.
- `SingleSeriesChart` permite opacidad por severidad; `BloodPressureChart` usa opacidad fija 0.08.

### Punto actual

- El último punto de la serie se resalta con un dot de radio 4 y borde blanco en ambos charts.
- En `SingleSeriesChart`, opcionalmente se muestran dots sutiles para puntos intermedios cuando hay pocos datos (`showSubtleDots`).

### Tooltip con `rawValue`

- `ChartTooltip` toma `payload[].payload.rawValue` si está disponible; si no, usa `entry.value`.
- Esto es lo que mantiene el valor clínico real visible aun cuando el trazo usa `chartValue` (`app/patients/[id]/encounters/components/charts/ChartTooltip.tsx`).

### Clipping de SpO₂

- El dominio visual de oxígeno está fijado en `50–100` (`CLINICAL_CHART_RANGES.oxygenSaturation`).
- `enrichChartData()` clippea al dominio visual, por lo que un valor por debajo de 50 no rompe la escala del chart.
- El tooltip sigue mostrando el valor real gracias a `rawValue`.

### Tensión arterial como chart especial

- `BloodPressureChart` no reutiliza `SingleSeriesChart` porque renderiza dos series (`chartValue` para sistólica enriquecida y `diastolic` para diastólica).
- En `EpisodeChartsPanel`, cada punto de presión arterial se construye enriqueciendo solo la sistólica y luego combinándola con ambos valores originales (`app/patients/[id]/encounters/components/EpisodeChartsPanel.tsx`).
- Inferencia: esto consolida la semántica clínica vigente del sistema, donde la severidad se ancla en sistólica, mientras la diastólica se mantiene como serie informativa visible.

## 7. Tests y garantías

### Qué tests sostienen el sistema

- **Temporalidad de encounter**
  - `lib/patient/__tests__/encounter-temporal.test.ts`
  - `app/patients/[id]/encounters/__tests__/data.test.ts`
- **Modelo clínico compartido**
  - `lib/patient/formatters/__tests__/clinical-ranges.test.ts`
- **Adapter clínica -> chart**
  - `lib/patient/formatters/__tests__/clinical-ranges.adapter.test.ts`
- **Fallbacks y semántica de badge**
  - `lib/patient/formatters/__tests__/vital-sign.formatters.test.ts`
- **Dominios de chart**
  - `lib/patient/formatters/__tests__/encounter-charts.formatters.test.ts`
- **Tooltip**
  - `app/patients/[id]/encounters/components/charts/__tests__/ChartTooltip.test.ts`
- **Hardening del write flow**
  - `domain/shared/__tests__/domain-rules.validator.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/__tests__/finalize-encounter-form.schema.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/actions/__tests__/finalize-encounter.action.test.ts`
  - `infrastructure/fhir/mappers/__tests__/encounter.write.mapper.test.ts`
  - `infrastructure/fhir/mappers/__tests__/encounter.finalize.mapper.test.ts`

### Edge cases cubiertos

- `finished` usa `actualStartAt` / `actualEndAt` y hace fallback a `period*` para recursos legacy.
- Encuentros no `finished` siguen usando `period*` como superficie representativa.
- `planned` sigue siendo aceptado por `finalizeEncounterAction` como compatibilidad transitoria.
- EVA decimal o fuera de 0–10 se rechaza.
- Presión arterial incompleta o incoherente se rechaza.
- Tooltip usa `rawValue` cuando existe.
- Valores fuera del dominio visual se clippean sin perder el valor clínico real.

### No gaps / no overlaps

- `clinical-ranges.test.ts` valida que los rangos vitales no se superponen y cubren el dominio completo esperado.
- `clinical-ranges.adapter.test.ts` valida que `toChartZones()` devuelve zonas no solapadas y acotadas al dominio visual.

### Alineación badge ↔ severity

- `clinical-ranges.test.ts` compara badges de signos vitales y presión con `getClinicalZoneForValue()`.
- `clinical-ranges.adapter.test.ts` verifica que `badge.severity` siga el mismo resultado que `getValueSeverity()`.

### EVA 5 niveles

- `clinical-ranges.test.ts` verifica que al adaptar EVA a referencias visuales se preserven las cinco zonas.
- `clinical-ranges.adapter.test.ts` verifica exactamente cinco zonas EVA y labels distintos para 0, 3, 6, 9 y 10.

### Infinity resolution

- `clinical-ranges.adapter.test.ts` valida `resolveZoneBounds()` para reemplazar `-Infinity` y `+Infinity` por límites del chart.

### SpO₂ clipping

- `clinical-ranges.adapter.test.ts` valida explícitamente que un dato `30` de `oxygen-saturation` conserve `rawValue = 30` y `chartValue = 50`.
- `ChartTooltip.test.ts` valida que el tooltip muestre `30 %` y no `50 %` cuando el payload está enriquecido.

## 8. Trade-offs y límites conscientes

### Tensión arterial sigue siendo caso especial

- La abstracción genérica cubre series simples; presión arterial conserva un renderer propio.
- Esto evita esconder una diferencia estructural real: dos series y una severidad basada en sistólica.

### EVA no colapsa a 3 niveles

- La severidad final termina en tres categorías (`normal`, `warning`, `critical`), pero el sistema conserva cinco bandas EVA para labels y zonas.
- El chart no trata EVA como un simple semáforo 0–3 / 4–6 / 7–10.

### La línea no expresa semántica clínica por sí sola

- La severidad clínica está en bandas, colors, badge y tooltip; el `Line` solo dibuja tendencia sobre `chartValue`.
- No hay codificación por tramo de línea clínica distinta según severidad del segmento.

### Dominios visuales amplios vs legibilidad

- `CLINICAL_CHART_RANGES` usa dominios fijos y deliberadamente amplios.
- Beneficio: comparabilidad estable y prevención de autoscaling engañoso.
- Costo: una serie con poca variación puede verse visualmente "aplanada".

### Lo que quedó fuera de scope

- No hay chart multiserie genérico más allá de presión arterial.
- No hay thresholds personalizados por paciente.
- No hay lógica clínica completa sistólica/diastólica para clasificar presión arterial.
- No existe todavía `startEncounterAction`; el lifecycle completo sigue siendo dirección arquitectónica, no comportamiento operativo completo.

## 9. Estado actual

### Done

- Temporalidad de encounter separada en agenda, ejecución real y aliases de compatibilidad.
- Semántica representativa encapsulada para lectura y sorting.
- Practitioner resuelto server-side y pasado en write input.
- Hardening del finalize en schema, validator y action.
- Rango clínico compartido para vitales y EVA.
- Adapter explícito para charting con `rawValue` / `chartValue`.
- Single-value fallback, tooltip unificado y zonas clínicas en charts longitudinales.
- Cobertura de tests sobre rangos, adapter, tooltip, temporalidad y hardening de finalize.

### Deuda consciente

- La clasificación clínica de presión arterial sigue simplificada a sistólica.
- La compatibilidad `planned -> finished` sigue viva por decisión transitoria del ADR.
- La cobertura directa sobre componentes visuales es menor que la cobertura sobre formatters y adapter.
- No se encontró en las fuentes prioritarias un ADR específico para charts; la justificación de diseño visual se infiere principalmente de la implementación y de los tests. **Inferencia**.

### Nota de cierre — fase 1B del temporal model (UI + copy)

- `PlannedSchedule` sigue modelando la planificación vigente de la visita (`plannedDate`, `plannedTime`).
- La UI diferencia explícitamente planificación (agenda) de ejecución real (inicio/fin reales) en create/finalize e historial/detalle.
- Esta separación es conceptual y de presentación: el lifecycle operativo completo todavía no está implementado.
- El siguiente paso natural, cuando se habilite la transición operacional correspondiente, es separar de forma más explícita `actual.start` (inicio) y `actual.end` (cierre) durante el flujo clínico.
- Esa evolución futura no forma parte de esta implementación y no modifica las reglas de lifecycle actuales.

### Próximos pasos recomendables

- Cuando exista `startEncounterAction`, endurecer `finalizeEncounterAction` para requerir `in-progress`, tal como anticipa el ADR.
- Si se profundiza la semántica de tensión arterial, revisar si debe seguir basada solo en sistólica o migrar a una matriz sistólica/diastólica explícita.
- Si se agregan nuevas métricas longitudinales, mantener la misma separación: dominio clínico -> adapter -> renderer.
- Si se quiere aumentar garantías visuales, agregar tests directos de `SingleSeriesChart` y `BloodPressureChart` sobre fallback, punto actual y reference zones. Recomendación, no estado implementado.

## 10. Cómo reutilizar este documento para escribir un artículo

- Convertir en narrativa:
  - la transición desde un `Encounter.period` ambiguo hacia un modelo temporal explícito
  - el endurecimiento multicapa del write clínico
  - la separación entre semántica clínica y rendering visual
- Secciones que sirven como base de artículo:
  - **Resumen ejecutivo**
  - **Evolución por épica**
  - **Modelo clínico**
  - **Adapter pattern**
  - **Trade-offs y límites conscientes**
- Screenshots o diagramas recomendables:
  - fallback de un único dato en `SingleSeriesChart`
  - chart de SpO₂ con tooltip mostrando `rawValue` clippeado en la línea
  - `BloodPressureChart` con zonas clínicas y ambas series
  - diagrama simple de pipeline: `domain ranges -> adapter -> EnrichedChartDatum/ChartZone -> Recharts`
