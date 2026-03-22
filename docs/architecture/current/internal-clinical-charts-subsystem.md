# Subsistema de charts clínicos

## Rol del documento

Este documento describe el estado actual del subsistema de charts clínicos implementado en el repositorio y documenta sus límites, responsabilidades y simplificaciones verificables.

## Propósito y alcance

Este documento describe el subsistema de charts clínicos tal como está implementado hoy en el repositorio. El objetivo es dejar una base técnica verificable para escritura posterior de material externo.

**Criterios aplicados en este documento**

- Se describe únicamente lo que puede verificarse en código o en documentación del repo.
- No se incluyen claims de producto ni justificaciones clínicas no modeladas en el código.
- Cuando hay simplificaciones explícitas en la implementación, se documentan como trade-offs o deuda.

**Nota de contexto**

En el pedido no vino incluida la lista de archivos prioritarios (`[pegás la lista]`). Para compensarlo, este documento toma como fuentes principales los archivos que hoy implementan el flujo completo del subsistema: ruta/página, carga de datos, repositorios FHIR, mappers, formatters clínicos y componentes de chart.

---

## 1. Mapa de arquitectura: carpetas y archivos

### 1.1. UI y composición de charts

```text
app/patients/[id]/encounters/
├── page.tsx
├── data.ts
└── components/
    ├── EpisodeChartsPanel.tsx
    └── charts/
        ├── SingleSeriesChart.tsx
        ├── BloodPressureChart.tsx
        └── ChartTooltip.tsx
```

### 1.2. Modelos de dominio y reglas clínicas reutilizadas por UI

```text
domain/
├── assessments/
│   ├── assessment.repository.ts
│   └── eva-assessment.ts
└── vital-sign-record/
    └── vital-sign-record.ts

lib/
├── clinical/
│   └── vital-sign-capture-ranges.ts
└── patient/formatters/
    ├── encounter-charts.formatters.ts
    ├── clinical-ranges.ts
    ├── vital-sign.formatters.ts
    └── assessments/
        └── eva-assessment.formatters.ts
```

### 1.3. Adaptadores de infraestructura FHIR

```text
infrastructure/fhir/
├── factories/
│   └── assessment.factory.ts
├── repositories/
│   ├── vital-sign-record.fhir-repository.ts
│   └── assessments/
│       └── eva-assessment.fhir-repository.ts
├── mappers/
│   ├── vital-sign.mapper.ts
│   └── assessments/
│       └── eva-assessment.mapper.ts
└── schemas/
    ├── vital-sign.schema.ts
    └── assessments/
        └── eva-assessment.schema.ts
```

### 1.4. Tests relevantes

```text
lib/patient/formatters/__tests__/
├── encounter-charts.formatters.test.ts
├── clinical-ranges.test.ts
└── vital-sign.formatters.test.ts

infrastructure/fhir/mappers/__tests__/
└── eva-assessment.mapper.test.ts

infrastructure/fhir/repositories/__tests__/
└── eva-assessment.fhir-repository.test.ts

app/patients/[id]/encounters/__tests__/
└── data.test.ts
```

---

## 2. Responsabilidades por capa

### 2.1. Página y carga de datos

#### `app/patients/[id]/encounters/page.tsx`

Responsabilidades:

- Resolver `patientId` desde la ruta.
- Invocar `getEncountersPageData(patientId)`.
- Renderizar `EpisodeChartsPanel` con dos colecciones longitudinales ya normalizadas a dominio: `vitalSigns` y `evaRecords`.
- Mantener el panel de charts como parte del historial del episodio activo, separado del detalle de cada encuentro.

Esto implica que los charts longitudinales no consultan FHIR directamente ni conocen recursos FHIR; reciben objetos de dominio ya adaptados.

#### `app/patients/[id]/encounters/data.ts`

Responsabilidades:

- Instanciar repositorios vía factories FHIR.
- Resolver paciente, episodio activo y lista de encounters.
- Ejecutar un fan-out por encounter para cargar vitales, EVA, procedimientos y otras evaluaciones.
- Aplanar (`flat`) los arreglos por encounter para construir las series longitudinales que consume `EpisodeChartsPanel`.
- Mantener simultáneamente dos vistas de los mismos datos:
  - longitudinal por episodio (`vitalSigns`, `evaRecords`)
  - indexada por encounter (`vitalsByEncounterId`, `evaByEncounterId`, etc.)

En otras palabras: esta capa arma el *read model* que luego separa la necesidad de charts longitudinales de la necesidad de listas o cards por encuentro.

### 2.2. Componentes de UI

#### `EpisodeChartsPanel.tsx`

Responsabilidades:

- Ser el punto de entrada del subsistema visual.
- Mantener el estado local de la métrica seleccionada (`MetricKey`).
- Convertir datos de dominio en datos mínimos para chart mediante `formatVitalSignsForChart` y `formatEvaForChart`.
- Seleccionar el renderer concreto:
  - `SingleSeriesChart` para FC, FR, SpO₂, temperatura y EVA
  - `BloodPressureChart` para presión arterial

La decisión de usar `useMemo` en esta capa evita reprocesar formateo longitudinal mientras no cambien `vitalSigns` o `evaRecords`.

#### `SingleSeriesChart.tsx`

Responsabilidades:

- Implementar el renderer genérico de series simples.
- Resolver tres estados de render:
  - sin datos
  - un único dato (fallback no-gráfico)
  - dos o más datos (línea temporal)
- Aplicar zonas clínicas y/o banda normal sobre el eje Y mediante `ReferenceArea`.
- Centralizar configuración parametrizable por métrica en `SINGLE_SERIES_CHART_CONFIGS`.
- Reutilizar el tooltip común `ChartTooltip`.

#### `BloodPressureChart.tsx`

Responsabilidades:

- Implementar el caso que no entra en el renderer genérico: dos series (`systolic`, `diastolic`).
- Aplicar el mismo contrato de estados visuales que `SingleSeriesChart`:
  - vacío
  - un dato único
  - tendencia longitudinal
- Mantener el caso de presión arterial separado porque el dato no es un único `value` sino una dupla.

#### `ChartTooltip.tsx`

Responsabilidades:

- Uniformar el tooltip de Recharts.
- Tomar el valor numérico crudo de `entry.value` y delegar, opcionalmente, el formateo a `valueFormatter`.
- Renderizar nombre de serie, color y valor visible.

### 2.3. Formatters y reglas clínicas reutilizables

#### `encounter-charts.formatters.ts`

Responsabilidades:

- Definir contratos mínimos para charting (`TimeValueDatum`, `BloodPressureDatum`, `VitalSignsChartData`).
- Convertir objetos de dominio ricos (`VitalSignRecord`, `EvaAssessment`) en estructuras mínimas para Recharts.
- Definir rangos fijos de chart (`CLINICAL_CHART_RANGES`) y paleta (`CLINICAL_CHART_COLORS`).
- Adaptar zonas clínicas de dominio al formato específico que consumen los componentes (`adaptClinicalRangesToChartReferences`).
- Formatear etiquetas temporales (`formatChartDate`).

#### `clinical-ranges.ts`

Responsabilidades:

- Ser la fuente compartida de zonas clínicas para vitales y EVA.
- Modelar dos clases de rango:
  - `binary`: normal + warning/critical
  - `ordinal`: lista ordenada de zonas
- Exponer operaciones de consulta (`getClinicalRanges`, `getEvaClinicalRanges`, `getClinicalZones`, `getClinicalZoneForValue`).

#### `vital-sign.formatters.ts`

Responsabilidades:

- Traducir zonas clínicas a badges de UI y colores de acento.
- Exponer presentaciones reutilizables para el fallback de un solo valor:
  - `getVitalSignSingleValuePresentation`
  - `getBloodPressureSingleValuePresentation`
- Resolver la simplificación actual de presión arterial a partir de la sistólica en `getBloodPressureBadge`.

#### `assessments/eva-assessment.formatters.ts`

Responsabilidades:

- Traducir la escala EVA a badge y formato visible.
- Mantener la semántica visual de EVA alineada con `EVA_RANGES` del dominio.

### 2.4. Dominio

#### `domain/vital-sign-record/vital-sign-record.ts`

Responsabilidades:

- Definir el contrato FHIR-agnóstico para un conjunto de signos vitales por fecha/visita.
- Representar presión arterial como objeto anidado `bloodPressure` con `systolic` y `diastolic`.
- Expresar que los campos de medición son opcionales porque no toda visita registra todo.

#### `domain/assessments/eva-assessment.ts`

Responsabilidades:

- Definir `EvaAssessment` como assessment tipado (`type: "eva"`).
- Declarar `EVA_RANGES` como fuente semántica del subsistema para 0–10.

#### `domain/assessments/assessment.repository.ts`

Responsabilidades:

- Definir el contrato abstracto de acceso a EVA (`findEvaByPatientId`, `findEvaByEncounterId`) sin depender de FHIR.

### 2.5. Infraestructura FHIR

#### Schemas (`schemas/*.ts`)

Responsabilidades:

- Validar recursos FHIR crudos antes del mapeo.
- Mantener esta validación en capa de infraestructura, sin contaminar dominio/UI.
- Diferenciar dos formas de `Observation` para vitales:
  - medición simple con `valueQuantity`
  - presión arterial con `component[]`

#### Mappers (`mappers/*.ts`)

Responsabilidades:

- Convertir `Observation` validada a objetos de dominio.
- En vitales, agrupar múltiples observaciones por fecha y performer para producir un `VitalSignRecord` agregado.
- En EVA, proyectar una observación a `EvaAssessment`.

#### Repositories (`repositories/*.ts`)

Responsabilidades:

- Ejecutar búsquedas FHIR.
- Validar cada recurso con Zod.
- Loggear invalidaciones y descartar recursos defectuosos.
- Delegar en mappers la proyección final a dominio.

#### Factories (`factories/*.ts`)

Responsabilidades:

- Proveer la implementación concreta del contrato de repositorio a capas superiores.
- Encapsular la selección de la implementación FHIR actual.

---

## 3. Modelo clínico elegido

## 3.1. Vitales: agregado de dominio por fecha/performer

El modelo elegido para signos vitales **no** es “una observación FHIR = un punto de UI”.

La infraestructura transforma varias `Observation` FHIR en un `VitalSignRecord` agregado. En `mapFhirObservationsToVitalSignRecords`:

- se reconoce el tipo clínico por LOINC,
- se normaliza la fecha a `YYYY-MM-DD`,
- se agrupa por `date + performer`,
- y se rellena un único objeto que puede contener FC, FR, SpO₂, temperatura y presión arterial.

Consecuencia arquitectónica: la UI consume una unidad clínica “registro de signos vitales de una visita/fecha”, no una lista plana de observaciones independientes.

## 3.2. Presión arterial como dato compuesto

En dominio, la presión arterial no se modela como `value: number`; se modela como `bloodPressure: { systolic, diastolic }`.

Eso replica la forma clínica relevante del dato y además coincide con la naturaleza componente de FHIR para este caso.

## 3.3. EVA como assessment ordinal separado de vitales

EVA no se mezcla con `VitalSignRecord`. Se modela por separado como `EvaAssessment`, con `score` entero 0–10 y rangos semánticos explícitos (`none`, `mild`, `moderate`, `severe`, `worst`).

Consecuencia: EVA comparte el pipeline visual de charting, pero no el contrato de dominio de signos vitales.

## 3.4. Rango clínico vs rango de captura vs rango de chart

El repo distingue tres nociones relacionadas pero no idénticas:

- **rango de captura**: `VITAL_SIGN_CAPTURE_RANGES`, usado para formularios/inputs.
- **rangos clínicos**: `CLINICAL_RANGES` y `EVA_RANGES`, usados para clasificar normal/alerta/crítico o zonas ordinales.
- **rango de chart**: `CLINICAL_CHART_RANGES`, usado para fijar el dominio visual del eje Y.

Esa separación evita mezclar semántica clínica con decisiones de render.

---

## 4. Adapter pattern

El subsistema usa adaptación en varios niveles. No hay una única clase llamada “Adapter”, pero sí una cadena clara de adaptadores.

## 4.1. Adaptación FHIR -> dominio

### Vitales

Pipeline:

1. `VitalSignRecordFhirRepository` consulta `Observation` con categoría `vital-signs`.
2. `fhirVitalSignObservationSchema` valida shape aceptando observaciones simples y component-based.
3. `mapFhirObservationsToVitalSignRecords` adapta el recurso FHIR validado al dominio `VitalSignRecord`.

### EVA

Pipeline:

1. `EvaAssessmentFhirRepository` consulta `Observation` con código `72514-3` y categoría `survey`.
2. `fhirEvaObservationSchema` valida el recurso.
3. `mapFhirObservationsToEvaAssessments` lo adapta a `EvaAssessment`.

Esta es la frontera principal entre modelo externo (FHIR) y modelo interno.

## 4.2. Adaptación dominio -> shape de chart

`formatVitalSignsForChart` y `formatEvaForChart` realizan la segunda adaptación:

- de modelos de dominio ricos y heterogéneos
- a estructuras mínimas orientadas a visualización:
  - `{ date, value }`
  - `{ date, systolic, diastolic }`

La UI de chart queda desacoplada de FHIR y también de detalles extra del dominio (`recordedBy`, `patientId`, `encounterId`, etc.).

## 4.3. Adaptación rangos clínicos -> overlays de Recharts

`adaptClinicalRangesToChartReferences` traduce `ClinicalRanges` a:

- `normalRange` para banda normal única
- `referenceZones` para overlays coloreados

Esta función es, en la práctica, el adaptador entre un modelo clínico independiente del renderer y las primitivas visuales que consumen `SingleSeriesChart` y `BloodPressureChart`.

## 4.4. Adaptación semántica clínica -> badge/presentación

`getVitalSignBadge`, `getBloodPressureBadge`, `getEvaBadge` y sus helpers de single-value presentation convierten clasificación clínica en contratos de UI:

- `label`
- `colorClass`
- `accentColor`

Esto evita que los componentes decidan por sí mismos la semántica del badge.

---

## 5. Cómo se instrumenta el render

## 5.1. Flujo de render completo

1. La página server-side (`encounters/page.tsx`) pide `getEncountersPageData(patientId)`.
2. La capa de datos construye series longitudinales a partir de repositorios FHIR.
3. `EpisodeChartsPanel` recibe `vitalSigns` y `evaRecords` ya adaptados a dominio.
4. En cliente, `useMemo` deriva:
   - `chartData = formatVitalSignsForChart(vitalSigns)`
   - `evaData = formatEvaForChart(evaRecords)`
5. El `select` controla qué métrica se muestra.
6. El panel elige entre `SingleSeriesChart` o `BloodPressureChart`.
7. Los componentes de chart renderizan un estado vacío, un fallback de único dato o un `LineChart` de Recharts.

## 5.2. Por qué el render es client-side

`EpisodeChartsPanel`, `SingleSeriesChart` y `BloodPressureChart` están marcados con `"use client"`. El motivo verificable es que dependen de Recharts y de estado local (`useState`, `useMemo` en el panel).

## 5.3. Instrumentación visual disponible hoy

El render actual ya incorpora instrumentación de lectura clínica y accesibilidad básica:

- `role="status"` para estados vacíos y fallback de un único registro.
- `role="img"` + `aria-label` en charts con línea temporal.
- `Legend` de Recharts.
- `Tooltip` custom con `ChartTooltip`.
- `ReferenceArea` para bandas/zonas clínicas.
- marcado explícito del último punto con `dot` custom en cada serie.

## 5.4. Selección de renderer

La selección del renderer no es dinámica por reflexión ni por configuración externa. Está codificada en el `switch` de `EpisodeChartsPanel`.

Esto da bajo costo cognitivo y un routing de render explícito, a cambio de requerir edición manual cuando se incorpora una nueva métrica.

---

## 6. `rawValue` vs `chartValue`

En la implementación actual **no existe** un par de campos persistidos o normalizados llamados `rawValue` y `chartValue`.

Lo que sí existe es una separación implícita entre:

- **valor numérico crudo**: el número almacenado en el datum (`value`, `systolic`, `diastolic`) y recibido por Recharts como `entry.value`.
- **valor visible de chart**: el string que se muestra después de aplicar `valueFormatter` o de concatenar `unit`.

### 6.1. Dónde vive el valor crudo

- `TimeValueDatum.value`
- `BloodPressureDatum.systolic`
- `BloodPressureDatum.diastolic`
- `ChartTooltip`: `const rawValue = typeof entry.value === "number" ? entry.value : 0`

### 6.2. Dónde se convierte al valor visible

- `ChartTooltip` transforma `rawValue` a `displayValue`.
- `SingleSeriesChart` transforma `point.value` a `formattedValue` en el fallback de un solo dato.
- En EVA, el `tooltipValueFormatter` de configuración produce `Dolor: {v} / 10`.

### 6.3. Implicación técnica

El diseño actual conserva **un único valor numérico canónico** y posterga el formateo a la capa visual. Eso simplifica el pipeline y evita duplicar datos, pero también significa que no hay un objeto de chart con separación explícita entre valor clínico bruto y valor ya formateado.

---

## 7. Resolución de single-value fallback

## 7.1. Motivo

Tanto `SingleSeriesChart` como `BloodPressureChart` desvían el render cuando `data.length === 1`.

La decisión es explícita: con un solo punto no se intenta forzar una línea temporal; se muestra una tarjeta de estado centrada con:

- etiqueta de la métrica
- valor principal
- badge
- fecha
- mensaje `Solo hay un registro disponible`

## 7.2. Reuso de semántica clínica existente

### Signos vitales de una sola serie

`SingleSeriesChart` usa:

- `getVitalSignSingleValuePresentation(vitalSignType, point.value)` cuando `fallbackKind === "vital-sign"`
- badge EVA + `getClinicalStateAccentColor` cuando `fallbackKind === "eva"`

### Presión arterial

`BloodPressureChart` usa `getBloodPressureSingleValuePresentation(point.systolic, point.diastolic)`.

## 7.3. Qué garantiza este diseño

El fallback no inventa semántica visual nueva. Reusa exactamente las mismas reglas de badge y color que ya usan otros componentes del sistema.

Eso evita desalineaciones entre:

- badge textual
- color del acento
- zona clínica usada por otros listados/cards

---

## 8. Resolución de badge alignment

## 8.1. Fuente única de semántica

La alineación de badges se sostiene sobre dos niveles:

1. `clinical-ranges.ts` / `EVA_RANGES` definen la clasificación clínica.
2. `vital-sign.formatters.ts` y `eva-assessment.formatters.ts` traducen esa clasificación a badges y colores de UI.

## 8.2. Cómo se mantiene alineado el fallback de charts

Los charts no definen badges hardcodeados dentro del componente. En cambio:

- `SingleSeriesChart` delega en `getVitalSignSingleValuePresentation` o `getEvaBadge`
- `BloodPressureChart` delega en `getBloodPressureSingleValuePresentation`

## 8.3. Evidencia en tests

`clinical-ranges.test.ts` verifica que:

- el `label` del badge coincide con la zona clínica calculada,
- y que `colorClass` coincide con la severidad.

`vital-sign.formatters.test.ts` verifica que el fallback de un solo dato reutiliza esa misma semántica.

---

## 9. Resolución de zonas clínicas

## 9.1. Modelo de origen

Las zonas clínicas viven fuera de los componentes, en `clinical-ranges.ts`:

- vitales: modelo `binary`
- EVA: modelo `ordinal`

## 9.2. Adaptación a overlays visuales

`adaptClinicalRangesToChartReferences` toma ese modelo y devuelve:

- `normalRange` opcional
- `referenceZones` ordenadas por `min`

Además puede:

- incluir o no la zona normal como banda separada,
- incluir o no zonas normales dentro de `referenceZones`,
- clamp-ear zonas al dominio visual del chart.

## 9.3. Aplicación en charts de serie simple

`SingleSeriesChart` usa:

- `normalRange` para la banda verde normal cuando aplica
- `referenceZones` para alerta/crítico y, en EVA, también normal

## 9.4. Aplicación en presión arterial

`BloodPressureChart` usa un único conjunto de referencias clínicas (`BLOOD_PRESSURE_CHART_REFERENCES`) sobre un eje Y compartido por sistólica y diastólica.

## 9.5. Particularidad de EVA

EVA se adapta con estas opciones:

- `includeNormalRange: false`
- `includeNormalReferenceZones: true`
- `clampToDomain: CLINICAL_CHART_RANGES.eva`

Resultado: en EVA no hay una sola “banda normal”; hay cinco zonas ordinales visibles, incluyendo las no dolorosas.

---

## 10. Caso especial: EVA

## 10.1. Modelo clínico específico

EVA se apoya en `EVA_RANGES`:

- `0`: `Sin dolor`
- `1–3`: `Leve`
- `4–6`: `Moderado`
- `7–9`: `Intenso`
- `10`: `Insoportable`

Esto se transporta a `getEvaClinicalRanges()` como un modelo ordinal de cinco zonas.

## 10.2. Render específico dentro del renderer genérico

Aunque usa `SingleSeriesChart`, EVA no es “un vital más”. Sus diferencias están codificadas en `SINGLE_SERIES_CHART_CONFIGS.eva`:

- `label: "EVA"`
- `unit: ""`
- dominio fijo `0..10`
- `ticks: [0, 2, 4, 6, 8, 10]`
- `referenceZones` provenientes del modelo ordinal
- `tooltipValueFormatter: (v) => \`Dolor: ${v} / 10\``
- `emptyMessage: "No hay datos de EVA"`

## 10.3. Badge y color en fallback de un único valor

En el fallback de un único dato, EVA usa:

- `getEvaBadge(point.value)`
- `getClinicalStateAccentColor(evaBadge)`

Eso evita duplicar la tabla de severidad dentro del chart.

## 10.4. Pipeline de datos específico

FHIR -> dominio:

- búsqueda por `Observation` con código `72514-3`
- categoría `survey`
- validación por `fhirEvaObservationSchema`
- mapeo a `EvaAssessment`

Dominio -> chart:

- `formatEvaForChart(records)` produce `{ date, value: score }[]`
- ordenado cronológicamente ascendente para el renderer

---

## 11. Caso especial: tensión arterial

## 11.1. Motivo para no usar `SingleSeriesChart`

La presión arterial rompe el contrato básico de `TimeValueDatum` porque requiere dos series simultáneas.

Por eso existe `BloodPressureChart.tsx` como componente separado.

## 11.2. Modelado FHIR y dominio

### En FHIR

`vital-sign.schema.ts` acepta un shape específico con `component[]` para observaciones compuestas.

### En el mapper

`mapFhirObservationsToVitalSignRecords` detecta LOINC `85354-9` o `55284-4` para presión arterial y busca componentes:

- `8480-6` -> sistólica
- `8462-4` -> diastólica

Solo si ambas existen se asigna `record.bloodPressure`.

### En dominio

Se materializa como `bloodPressure: { systolic, diastolic }`.

## 11.3. Render longitudinal

`BloodPressureChart` usa:

- eje Y fijo común `CLINICAL_CHART_RANGES.bloodPressure`
- una línea para `systolic`
- una línea para `diastolic`
- tooltip común con unidad `mmHg`
- marca visual del último punto en ambas series

## 11.4. Clasificación clínica actual

La semántica de badge para presión arterial hoy se resuelve en `getBloodPressureBadge(systolic, _diastolic)` **solo por sistólica**. El parámetro diastólico se conserva, pero queda explícitamente sin uso (`void _diastolic`).

Esto es una simplificación consciente de la implementación actual, no un modelo hemodinámico completo.

## 11.5. Zonas clínicas actuales

El chart usa `CLINICAL_RANGES.bloodPressure` adaptado a overlays. Ese rango también está definido sobre una escala única, compatible con la clasificación basada en sistólica.

Implicación: las zonas de fondo del chart de presión arterial representan la semántica clínica actual del sistema, que está anclada en la sistólica y no en una matriz sistólica/diastólica completa.

---

## 12. Tests que sostienen el diseño

## 12.1. `lib/patient/formatters/__tests__/clinical-ranges.test.ts`

Protege lo siguiente:

- badges de vitales alineados con zonas clínicas compartidas
- badge de presión arterial alineado con rango compartido
- ausencia de solapamientos entre zonas
- cobertura completa del dominio esperado sin gaps
- preservación de las cinco zonas EVA al adaptarlas a overlays de chart

Es el test central para afirmar que la semántica clínica usada por charts y badges sale de una fuente consistente.

## 12.2. `lib/patient/formatters/__tests__/vital-sign.formatters.test.ts`

Protege lo siguiente:

- el fallback de un único valor reutiliza el badge de vitales
- el fallback de presión arterial reutiliza su badge
- los colores de acento derivan de la semántica de badge existente

Este test sostiene específicamente la decisión de no duplicar reglas visuales dentro del chart.

## 12.3. `lib/patient/formatters/__tests__/encounter-charts.formatters.test.ts`

Protege lo siguiente:

- `CLINICAL_CHART_RANGES` cubre, como mínimo, los rangos de captura
- el eje compartido de presión arterial cubre el rango previsto
- la saturación de oxígeno usa dominio visual fijo `50..100`

Esto sostiene la elección de dominios visuales fijos en vez de dominios dinámicos por muestra.

## 12.4. `infrastructure/fhir/mappers/__tests__/eva-assessment.mapper.test.ts`

Protege lo siguiente:

- mapeo correcto de `Observation` FHIR válida a `EvaAssessment`
- descarte de registros inválidos o incompletos
- orden descendente por fecha en el resultado del mapper

Este test sostiene la parte FHIR -> dominio del caso EVA.

## 12.5. `infrastructure/fhir/repositories/__tests__/eva-assessment.fhir-repository.test.ts`

Protege lo siguiente:

- la query FHIR correcta para paciente y para encounter
- descarte de observaciones inválidas por schema
- comportamiento ante bundle vacío o error de red

Esto sostiene la capa de adaptación externa para EVA.

## 12.6. `app/patients/[id]/encounters/__tests__/data.test.ts`

Protege lo siguiente:

- ordenamiento de encounters que luego condiciona el armado de la pantalla de historial
- estabilidad del read model que abastece al panel longitudinal

No testea el chart directamente, pero sí una precondición del contexto donde el panel se inserta.

---

## 13. Trade-offs y deudas conscientes

## 13.1. Rangos poblacionales, no personalizados

`getVitalSignBadge` y `getBloodPressureBadge` documentan explícitamente que los rangos usados son poblacionales y no personalizados por paciente.

Impacto:

- simplifica el subsistema
- permite una semántica estable y compartida
- pero limita interpretación clínica avanzada

## 13.2. Presión arterial clasificada solo por sistólica

`getBloodPressureBadge` ignora diastólica en la clasificación actual.

Impacto:

- simplifica badge, color y zonas de fondo
- evita una matriz clínica más compleja
- pero reduce fidelidad para casos donde la diastólica sería relevante por sí misma

## 13.3. Dominios visuales fijos

`CLINICAL_CHART_RANGES` usa dominios fijos en lugar de calcular min/max por dataset.

Impacto:

- facilita comparación visual entre pacientes/episodios
- evita charts “zoomed” por accidente
- pero puede desaprovechar resolución visual cuando la variación real es pequeña

## 13.4. Presión arterial requiere componente separado

La extracción a `BloodPressureChart` evita forzar una abstracción falsa sobre datos multiserie.

Impacto:

- mantiene simple el contrato de `SingleSeriesChart`
- pero deja duplicación estructural entre ambos renderers (empty state, fallback single-value, layout general, dot del último punto, etc.)

## 13.5. Fan-out por encounter en la carga de datos

`getEncountersPageData` resuelve vitales, EVA, procedimientos y otras evaluaciones con `Promise.all(encounters.map(...))` por repositorio.

Impacto:

- mantiene muy explícito el armado del read model
- desacopla cada repositorio
- pero crece en cantidad de llamadas a medida que aumenta el número de encounters

## 13.6. Sin abstracción explícita `rawValue/chartValue`

La separación entre valor crudo y valor visible existe, pero como convención de presentación y no como contrato de datos.

Impacto:

- menos complejidad estructural
- menos duplicación de datos
- pero el pipeline depende de recordar dónde se formatea cada métrica

## 13.7. Cobertura de tests más fuerte en formatters/adapters que en componentes de chart

La evidencia automática más fuerte está en:

- ranges
- badges
- adapters FHIR
- shape de datos

La protección directa sobre componentes `SingleSeriesChart`, `BloodPressureChart` y `ChartTooltip` es comparativamente menor.

Impacto:

- la semántica clínica base está bastante asegurada
- pero los detalles de render quedan más expuestos a regresiones de UI que las reglas clínicas

---

## 14. Resumen operativo

El subsistema actual se apoya en una cadena de adaptación bien definida:

1. **FHIR Observation** validada por schema.
2. **Dominio** FHIR-agnóstico (`VitalSignRecord`, `EvaAssessment`).
3. **Shape mínimo de chart** (`TimeValueDatum`, `BloodPressureDatum`).
4. **Semántica clínica compartida** (`clinical-ranges`, badges, colors, reference zones).
5. **Renderer client-side** (`EpisodeChartsPanel`, `SingleSeriesChart`, `BloodPressureChart`, `ChartTooltip`).

Las decisiones más relevantes de diseño son:

- vitales agrupados por fecha/performer y no uno-a-uno con Observation
- EVA modelada como assessment separado
- presión arterial tratada como caso compuesto y renderer específico
- rangos clínicos y badges centralizados fuera de la UI
- fallback textual para series de un único valor
- dominios visuales fijos y zonas clínicas adaptadas a overlays de Recharts

Ese conjunto produce un subsistema relativamente desacoplado de FHIR en UI y suficientemente parametrizable para reutilizar un renderer genérico en todas las métricas simples, manteniendo excepciones explícitas donde el modelo clínico realmente cambia.
