# Modelo clínico actual

## Rol del documento

Este documento describe el modelo clínico actual que hoy consumen lectura, formatters y visualización longitudinal. Se limita a decisiones verificables en código y documentación vigente del repositorio; cuando una conexión no puede verificarse completamente, se marca como inferencia o pendiente de verificación.

## Relación con otros documentos

- Ver [`internal-clinical-charts-subsystem.md`](./internal-clinical-charts-subsystem.md) como estado actual del subsistema de charts clínicos.
- Ver [`encounters-and-clinical-evolution.md`](../../evolution/encounters-and-clinical-evolution.md) para entender cómo se llegó a este modelo.

## Fuentes utilizadas

- `domain/vital-sign-record/vital-sign-record.ts`
- `domain/assessments/eva-assessment.ts`
- `lib/patient/formatters/clinical-ranges.ts`
- `lib/patient/formatters/vital-sign.formatters.ts`
- `lib/patient/formatters/encounter-charts.formatters.ts`
- `docs/architecture/current/internal-clinical-charts-subsystem.md`
- `docs/write-phase-architecture.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `infrastructure/fhir/mappers/vital-sign.mapper.ts`
- `infrastructure/fhir/mappers/assessments/eva-assessment.mapper.ts`
- `lib/patient/formatters/clinical-ranges.adapter.ts`
- `app/patients/[id]/encounters/components/EpisodeChartsPanel.tsx`

## 1. Modelo de signos vitales: `VitalSignRecord` como agregado por fecha y performer

`VitalSignRecord` no modela una `Observation` FHIR individual. El contrato de dominio declara un registro agregado, FHIR-agnóstico, con identificador sintético, `patientId`, `date`, `recordedBy` y un conjunto opcional de mediciones (`heartRate`, `respiratoryRate`, `oxygenSaturation`, `bodyTemperature`, `bloodPressure`). La propia definición del tipo aclara que el agrupamiento por visita/fecha no existe en FHIR y que debe ser construido por la capa de mapeo. El mapper vigente confirma esa decisión: toma múltiples `Observation`, identifica el tipo por LOINC, normaliza la fecha a `YYYY-MM-DD`, deriva un performer principal y agrupa por la clave `${date}::${performerKey}`. El resultado es un agregado clínico longitudinal centrado en fecha y performer, no en recurso FHIR individual.

Consecuencias técnicas de ese diseño:

- el `id` del agregado es sintético y no proviene de FHIR;
- el agregado admite campos opcionales porque no todas las capturas registran todas las métricas;
- la serie longitudinal se apoya en un modelo ya consolidado antes de llegar a la UI;
- el agrupamiento se hace en infraestructura, de modo que la UI no necesita reconstruir visitas a partir de observaciones sueltas.

### `encounterId` y relación con el encounter

El dominio permite `encounterId?: string` y documenta que puede faltar en registros históricos previos a la write phase. En el estado actual, los mappers de lectura de vitales y EVA ya hidratan `encounterId` cuando `Observation.encounter.reference` está presente (incluyendo referencias relativas y absolutas).

Esto mejora de forma concreta la trazabilidad encounter-centric en lectura. Aun así, `encounterId` sigue siendo opcional por compatibilidad histórica y por recursos que pueden no traer ese vínculo.

## 2. Presión arterial como dato compuesto

La presión arterial no se modela como un único número. `VitalSignRecord` define `bloodPressure?: { systolic: number; diastolic: number }`, y el comentario del dominio explicita que esto responde a la representación habitual en FHIR como componentes de una sola observación. El mapper mantiene esa semántica: reconoce códigos LOINC de presión arterial, recorre `component[]`, busca `8480-6` para sistólica y `8462-4` para diastólica, y solo construye `bloodPressure` cuando ambas están presentes.

Esto evita dos simplificaciones incorrectas:

- no se pierden los dos ejes clínicos al colapsar la presión arterial en un único valor bruto;
- la UI no tiene que deducir por sí misma cuándo dos observaciones forman una misma toma.

Al mismo tiempo, la clasificación visual actual sí usa una simplificación controlada: `getBloodPressureBadge()` evalúa solo la sistólica para decidir `Normal`, `Alerta` o `Crítico`, y deja explícito que la diastólica queda reservada para uso futuro. Esa simplificación está documentada en código y debe describirse como estado actual, no como guideline clínica completa.

## 3. EVA como assessment separado y ordinal

`EvaAssessment` vive fuera de `VitalSignRecord`. El dominio lo define como un assessment específico (`type: "eva"`) que extiende la base de assessments y contiene `score: number`. El mapper de EVA tampoco intenta insertarlo dentro del agregado de signos vitales: proyecta cada `Observation` válida a un `EvaAssessment` con `id`, `patientId`, `date`, `score`, `recordedBy` y `encounterId` cuando existe referencia FHIR.

La separación tiene implicancias concretas:

- EVA no se trata como un signo vital más dentro del agregado de mediciones por fecha;
- la persistencia y lectura longitudinal de EVA usan repositorio y mapper propios;
- el chart de EVA entra al pipeline visual como otra métrica temporal, pero desde un modelo de dominio distinto.

Además, EVA es **ordinal**, no binaria. `EVA_RANGES` define cinco zonas discretas: `none`, `mild`, `moderate`, `severe` y `worst`, con etiquetas clínicas `Sin dolor`, `Leve`, `Moderado`, `Intenso` e `Insoportable`. `getEvaClinicalRanges()` traduce esas zonas al contrato compartido `ClinicalRanges` con `kind: "ordinal"`, preservando el orden 0–10 y asignando severidad visual: normal para `none` y `mild`, warning para `moderate`, critical para `severe` y `worst`.

## 4. Tres niveles de rango: capture range, clinical range y chart range

El repositorio ya distingue tres tipos de rango con responsabilidades diferentes. No son intercambiables.

### 4.1. Capture range

El *capture range* pertenece al endurecimiento del input de escritura. La documentación de write phase fija una arquitectura de validación por capas y el documento del subsistema de charts distingue explícitamente los rangos de captura de los rangos usados en presentación. En esta fase, este documento no redefine esos límites numéricos porque no son parte de las fuentes clínicas listadas como obligatorias aquí. Su función verificable es otra: restringir qué valores de entrada acepta el sistema antes de persistirlos.

### 4.2. Clinical range

El *clinical range* es la semántica compartida para clasificación clínica reutilizable. `CLINICAL_RANGES` modela signos vitales con `kind: "binary"` y zonas `normal`, `warning` y `critical`; `EVA_RANGES` más `getEvaClinicalRanges()` modelan EVA como `kind: "ordinal"`. Sobre esas estructuras operan helpers como:

- `getClinicalRanges(type)`
- `getEvaClinicalRanges()`
- `getClinicalZones(ranges)`
- `getClinicalZoneForValue(ranges, value)`

Ese nivel es el que consumen badges, colores de acento, zonas de referencia y enriquecimiento de chart data.

### 4.3. Chart range

El *chart range* es un dominio visual fijo para renderizar series longitudinales. `CLINICAL_CHART_RANGES` no expresa umbral clínico ni validación de captura; expresa la ventana útil del gráfico:

- `heartRate: 30–220`
- `respiratoryRate: 5–60`
- `oxygenSaturation: 50–100`
- `bodyTemperature: 30.0–43.0`
- `bloodPressure: 40–280`
- `eva: 0–10`

El propio comentario del archivo aclara que estos rangos no representan extremos fisiológicos completos, sino una ventana útil de monitoreo ambulatorio. Por eso, chart range y clinical range pueden diferir legítimamente: uno organiza visualización; el otro clasifica significado clínico.

## 5. `CLINICAL_RANGES` y `EVA_RANGES`

### `CLINICAL_RANGES`

`CLINICAL_RANGES` es la tabla compartida de referencia clínica para signos vitales. Su contrato permite dos formas:

- `binary`: una zona normal y listas opcionales de warning/critical;
- `ordinal`: una lista ordenada de zonas.

En el estado actual, signos vitales usan el formato `binary`:

- frecuencia cardíaca: normal 60–100, warning en bandas adyacentes, critical fuera de esas bandas;
- frecuencia respiratoria: normal 12–20;
- saturación de oxígeno: normal desde 95, warning 90–94, critical por debajo de 90;
- temperatura: normal 36.0–37.4 con bandas de alerta y crítico a ambos extremos;
- presión arterial: clasificación binaria basada en sistólica.

### `EVA_RANGES`

`EVA_RANGES` permanece en dominio y aporta semántica clínica propia de la escala ordinal. No se duplica en `clinical-ranges.ts`; en cambio, se importa y se adapta a `ClinicalRanges` mediante `getEvaClinicalRanges()`. Esa decisión mantiene una sola fuente de verdad para los labels y cortes de EVA, y permite reutilizar luego esa misma semántica en adapter, badges y charts.

## 6. Por qué la UI no duplica lógica clínica

La UI no define por su cuenta umbrales, etiquetas ni severidades clínicas. Esa separación se verifica en varios pasos del pipeline:

1. **Dominio / constantes compartidas**: `VitalSignRecord`, `EvaAssessment`, `EVA_RANGES`.
2. **Formatters clínicos**: `clinical-ranges.ts` y `vital-sign.formatters.ts` resuelven zonas, badges y colores a partir de fuentes compartidas.
3. **Adapter para charts**: `clinical-ranges.adapter.ts` toma ranges clínicos y los convierte en `ChartZone` y `EnrichedChartDatum`, con `rawValue`, `chartValue`, `severity` y `zone`.
4. **Charts**: `EpisodeChartsPanel` y los componentes de Recharts consumen datos ya enriquecidos.

Esa cadena explica por qué `SingleSeriesChart` o `BloodPressureChart` no necesitan reimplementar reglas como “qué es moderado en EVA” o “qué color corresponde a una zona crítica”. Cuando el valor llega al chart, ya puede venir:

- clasificado por severidad (`getValueSeverity()` / `enrichChartData()`),
- convertido a zonas visuales (`toChartZones()`),
- acotado al dominio visual (`chartValue`),
- preservando el valor clínico real para tooltip (`rawValue`).

En términos arquitectónicos, esto es coherente con la write phase y con el ADR: FHIR queda fuera del boundary de dominio, y la UI consume contratos ya preparados por dominio, formatters y adapter en vez de ejecutar lógica clínica distribuida.

## 7. Conexión entre dominio, formatters, adapter y charts

El flujo verificable hoy puede describirse así:

```text
FHIR Observation(s)
  -> mapper de infraestructura
  -> dominio (`VitalSignRecord` / `EvaAssessment`)
  -> formatters clínicos compartidos
  -> adapter de chart
  -> componentes de charts
```

### 7.1. Mapper e infraestructura

- `mapFhirObservationsToVitalSignRecords()` agrupa observaciones por fecha y performer y produce `VitalSignRecord`.
- `mapFhirObservationsToEvaAssessments()` proyecta observaciones de EVA a `EvaAssessment`.

### 7.2. Formatters

- `formatVitalSignsForChart()` separa series mínimas por métrica.
- `formatEvaForChart()` genera una serie temporal simple para EVA.
- `getVitalSignBadge()` y `getBloodPressureBadge()` convierten clasificación clínica en badge reutilizable.
- `getClinicalStateAccentColor()` centraliza colores de acento para fallback de valor único.
- `adaptClinicalRangesToChartReferences()` transforma `ClinicalRanges` al shape de referencias que necesitan los charts.

### 7.3. Adapter

`clinical-ranges.adapter.ts` cubre el puente entre semántica clínica y semántica gráfica. Sus responsabilidades verificables son:

- resolver el dominio visual por métrica (`getChartDomain()`);
- derivar bandas clínicas para signos vitales y EVA (`getBandsForMetric()`);
- traducirlas a `ChartZone` (`toChartZones()`);
- enriquecer cada punto con `rawValue`, `chartValue`, `severity` y `zone` (`enrichChartData()`).

La existencia de `rawValue` y `chartValue` muestra una decisión concreta: el gráfico puede clipear valores al dominio visible sin perder el dato clínico real para tooltip o lectura puntual.

### 7.4. Charts

`EpisodeChartsPanel` coordina el pipeline. Primero formatea `vitalSigns` y `evaRecords`; después enriquece series con el adapter; por último elige entre `SingleSeriesChart` y `BloodPressureChart`. La presión arterial queda como renderer separado porque no encaja en el contrato de serie simple: necesita sistólica y diastólica en paralelo, aunque la severidad principal actual siga basándose en la sistólica.

## 8. Inference y pendientes de verificación

- **Estado verificado:** hidratación de `encounterId` en lectura de vitales y EVA cuando FHIR provee `Observation.encounter.reference`; cubierta con tests para referencia ausente, relativa y absoluta.
- **Inferencia razonable:** la separación entre capture range, clinical range y chart range es parte del modelo actual del repo porque aparece en write architecture, en el subsistema de charts y en los formatters; aun así, este documento evita fijar aquí reglas de captura no citadas en las fuentes clínicas obligatorias.
- **Deuda abierta:** la hidratación de `encounterId` mejora coherencia del read model, pero no reemplaza la necesidad de fallback longitudinal controlado para datos históricos sin vínculo encounter explícito.
- **Pendiente de verificación:** si en fases futuras la clasificación visual de presión arterial incorporará diastólica. El estado implementado hoy usa solo sistólica para badge/severity.

## 9. Alcance de este documento

Este documento describe el modelo clínico implementado y reutilizado por lectura longitudinal y charts. No redefine reglas clínicas nuevas, no sustituye a los documentos de autoridad sobre lifecycle/write flow y no convierte simplificaciones actuales en decisiones clínicas cerradas.
