# Auditoría técnica: manejo temporal y asociación clínica por encounter

Fecha: 2026-03-30

## 1. Executive summary

- **Diagnóstico corto (actualizado):** el sistema ya persiste vínculo `encounter` al escribir signos vitales y EVA **y también hidrata `encounterId` en lectura** cuando `Observation.encounter.reference` existe.  
- **Problema raíz principal (actualizado):** la desalineación principal quedó acotada al modo longitudinal por fecha (deuda controlada) y a la continuidad clínica completa de `in-progress` en UI (deuda abierta).  
- **Nivel de riesgo:** **medio** en historial longitudinal por fallback temporal, **medio** en continuidad clínica completa de `in-progress`, **bajo** en consistencia encounter-centric base (patient detail + encounter detail loaders).

> Regla explícita: **los charts longitudinales pueden requerir una estrategia distinta y no deben forzarse a usar exactamente la misma lógica que las surfaces centradas en encounter**. (verificado)

---

## 2. Hallazgos por capa

### 2.1 Domain

1. `Encounter` separa semánticas de agenda vs ejecución (`plannedDate`, `plannedTime`, `actualStartAt`, `actualEndAt`) pero mantiene aliases de compatibilidad (`periodStart`, `periodEnd`). **Verificado**.
2. `VitalSignRecord` y `BaseAssessment` declaran `encounterId?` opcional (permite históricos sin vínculo). **Verificado**.
3. Hay riesgo de sobrecarga semántica por coexistencia de `periodStart/periodEnd` con campos explícitos nuevos; parte del código aún usa alias representativos para ordenar/mostrar. **Verificado**.

### 2.2 Infrastructure / schemas

1. El schema de EVA incluye `encounter` opcional, pero el de vitales no exige/expone explícitamente `encounter` ni `subject` en tipado de salida usado por mapper. **Verificado**.
2. El schema de vitales mantiene flexibilidad para recursos históricos, pero el mapper sí hidrata `encounterId` cuando la referencia existe. **Verificado**.

### 2.3 Infrastructure / mappers

1. Write mappers de vitales/EVA setean `encounter.reference = Encounter/{id}` y `effectiveDateTime`. **Verificado**.
2. Mapper de vitales agrupa por `effectiveDateTime + performer` (`groupKey = date::performer`) y sí incluye `encounterId` cuando existe referencia. **Verificado**.
3. Mapper de EVA sí mapea `encounterId` cuando existe referencia. **Verificado**.
4. `Encounter` mapper usa `period.start` como `actualStartAt` para `in-progress/finished`; para `planned` intenta recuperar `plannedDate/plannedTime` y compone alias con timezone de app. **Verificado**.

### 2.4 Infrastructure / repositories

1. Repos de vitales/EVA tienen métodos `findByPatientId` y `findByEncounterId`. **Verificado**.
2. `findByEncounterId` filtra en FHIR por `encounter`; adicionalmente, los objetos de dominio conservan `encounterId` cuando la referencia está presente en FHIR. **Verificado**.
3. Repos de patient-level en encounters page consumen todo por paciente y luego filtran en app por fecha/encounter. **Verificado**.

### 2.5 Loaders (`data.ts`)

1. **Patient detail**: usa una fuente clínica única (`inProgressEncounter ?? lastFinishedEncounter`) y carga procedimientos/EVA/vitales por ese mismo `encounterId`. **Verificado**.
2. **Encounters list/history**: filtro longitudinal mezcla criterio `(encounterId en episodio) OR (misma fecha YYYY-MM-DD)`. **Verificado**.
3. **Encounter detail**: para estado `finished` carga por `findByEncounterId`; evita mezcla por fecha en esta surface. **Verificado**.

### 2.6 Formatters

1. `formatDateTime` usa timezone app `America/Argentina/Buenos_Aires` solo si hay componente temporal; para date-only fuerza UTC. **Verificado**.
2. `formatChartDate` usa timezone UTC también para datetimes (charts), lo cual puede diferir de vistas clínicas locales. **Verificado**.
3. Existen normalizaciones por `slice(0,10)` para agrupar/filtrar por día en encounters page. **Verificado**.

### 2.7 UI surfaces

1. **Patient detail**: comportamiento encounter-centric base corregido; evita desacople entre encounter mostrado y payload clínico. **Verificado**.
2. **Encounters history/list**: sirve para resumen longitudinal del episodio, pero la mezcla por fecha debería estar etiquetada como longitudinal y no reutilizarse como source-of-truth encounter-centric. **Verificado**.
3. **Encounter detail**: más alineado a encounter-centric, pero solo muestra bloques clínicos en `finished` (si se requiere continuidad en curso, falta modo encounter-centric in-progress). **Inferido**.
4. **Charts longitudinales**: correctamente orientados a serie temporal; no deberían forzarse a semántica estricta por encounter. **Verificado**.

---

## 3. Mapa temporal del sistema

| Campo / transformación | Semántica actual | Surfaces que lo usan | Problema detectado | Decisión sugerida |
|---|---|---|---|---|
| `plannedDate` | Día planificado local de visita | encounter detail (planned), forms, patient detail (próxima) | convive con alias legacy | mantener como semántica de agenda |
| `plannedTime` | Hora planificada local | mismas anteriores | opcional; cuando falta se cae a date-only | mantener opcional, explícito |
| `plannedAtUtc` (interno) | instant UTC derivado de plannedDate+plannedTime | create encounter write | potencial confusión si se muestra directo | usar solo write/infra |
| `actualStartAt` | inicio real UTC | encounter detail, lifecycle, validations | en lecturas legacy puede confundirse con `period.start` | source-of-truth para visita iniciada/finalizada |
| `actualEndAt` | fin real UTC | finalize/register complete | correcto | source-of-truth de cierre |
| `period.start` (FHIR) | multipropósito: planned start (planned) o actual start (in-progress/finished) | encounter mapper | sobrecarga semántica en el mismo campo FHIR | encapsular en mapper y no propagar ambigüedad a UI |
| `period.end` (FHIR) | fin real (finished) | encounter mapper | menor riesgo | mantener |
| `periodStart` (domain alias) | alias de compatibilidad; puede ser planned o actual | muchas UI para sorting/display | sobrecarga alta | deprecación progresiva en reads encounter-centric |
| `periodEnd` (domain alias) | alias de fin | UI read-only | menor pero confunde | deprecación gradual |
| `recordedAt` | timestamp de snapshot in-progress (`new Date().toISOString()`) | save-progress write | usa reloj servidor, no hora capturada en UI | aceptable para snapshot, documentar |
| `effectiveDateTime` vitales/EVA (write) | instante clínico (start, end o recordedAt según flujo) | write mappers y charts | semántica variable por flujo | separar metadato “snapshotAt” vs “measurementAt” (futuro) |
| `VitalSignRecord.date` | copia de `effectiveDateTime` | patient detail, encounter detail, charts | `encounterId` puede faltar en históricos sin referencia | mantener hidratación actual y fallback longitudinal controlado |
| `EvaAssessment.date` | copia de `effectiveDateTime` | patient detail, history, charts | `encounterId` puede faltar en históricos sin referencia | idem anterior |
| `slice(0,10)` + regex YYYY-MM-DD | normalización date-only para matching por día | encounters/data.ts | produce mezcla entre encounters por misma fecha | restringir a modo longitudinal explícito |
| `formatDateTime` | rendering local app TZ si datetime; UTC si date-only | detail/cards | posible divergencia con chart labels | mantener, pero documentar modo |
| `formatChartDate` | rendering en UTC | charts | distinta semántica de huso vs surfaces clínicas | válido para longitudinal, no reutilizar para encounter-centric |

---

## 4. Asociación clínica por surface

## 4.1 Encounter-centric reads (deben priorizar `encounterId`)

### Patient detail (visita activa/relevante)
- **Contrato actual:** `lastEncounter` se resuelve desde una fuente clínica única (`inProgressEncounter ?? lastFinished`) y los bloques clínicos se cargan por el mismo `encounterId`. **Verificado**.
- **Criterio actual:** encounter-centric consistente para la surface. **Verificado**.
- **Riesgo:** bajo para mezcla inter-encounter en patient detail. **Verificado**.
- **Decisión recomendada:** mantener tests de no-mezcla y evitar reintroducir fallback por fecha en esta surface. **Verificado (recomendación)**.

### Encounter detail
- **Contrato actual:** `encounter`, `vitalSigns`, `evaRecords`, `procedures` por `findByEncounterId` para `finished` e `in-progress` en loader. **Verificado**.
- **Criterio actual:** por `encounterId` (correcto para finished e in-progress en hidratación). **Verificado**.
- **Riesgo:** bajo para mezcla inter-encounter; medio para continuidad in-progress (no muestra snapshots clínicos). **Inferido**.
- **Decisión recomendada:** mantener filtro por encounter; evaluar habilitar lectura de snapshot in-progress por encounter si producto lo requiere. **Inferido**.

### Formularios/continuidad visita en curso
- **Contrato actual:** writes guardan vínculo `Encounter/{id}` en recursos clínicos. **Verificado**.
- **Criterio actual:** encounter-centric correcto en write path. **Verificado**.
- **Riesgo:** bajo en persistencia y bajo/medio en recuperación (acotado a históricos sin linkage). **Verificado**.
- **Decisión recomendada:** mantener tests de hidratación `encounterId` y fallback longitudinal controlado para históricos. **Verificado (recomendación)**.

## 4.2 Longitudinal / chart reads (válido agrupar por fecha/serie)

### Encounters list/history + Episode charts
- **Contrato actual:** series de episodio usando datos por paciente filtrados por `(encounterId en episodio) OR (misma fecha)`. **Verificado**.
- **Criterio actual:** mixto encounter + fecha para rescatar históricos sin linkage. **Verificado**.
- **Riesgo:** medio (falsos positivos por misma fecha), pero tolerable en contexto longitudinal si se comunica como agregado. **Inferido**.
- **Decisión recomendada:**
  1) conservar modo longitudinal,  
  2) marcar origen de punto (`linked-by-encounter` vs `derived-by-date`),  
  3) no reutilizar este agregado para surfaces encounter-centric. **Verificado (recomendación)**.

> Reglas de separación propuestas (explícitas):
> - **Encounter-centric:** primero `encounterId`; fecha solo como fallback controlado y trazable cuando no exista linkage histórico.
> - **Longitudinal/chart:** puede usar composición por fecha y agregación temporal, siempre desacoplada del source-of-truth de una visita concreta.

---

## 5. Inconsistencias y bugs probables

1. **Bug principal reportado (patient detail):** corregido; la sección usa una única fuente encounter-centric para encounter y datasets clínicos. **Verificado (estado actual)**.
2. **Pérdida de `encounterId` en lectura:** corregida en mappers de vitales/EVA cuando existe referencia FHIR; persiste deuda histórica sin linkage. **Verificado (estado actual)**.
3. **Agrupación vitales por `fecha+performer`:** puede fusionar mediciones de encounters distintos del mismo profesional en mismo timestamp exacto. **Inferido (poco frecuente, posible)**.
4. **Timezone heterogéneo UI:** detail usa TZ local app, charts usan UTC; puede cambiar etiqueta de hora/día entre surfaces. **Verificado**.
5. **Sobrecarga de `period.start`:** en planned representa agenda, en in-progress/finished representa ejecución real; riesgo de interpretaciones cruzadas si se consume fuera de mapper. **Verificado**.

---

## 6. Propuesta de simplificación (sin implementar)

Dependency order sugerido:

1. **Contrato de lectura dual (base):** formalizar dos read models: `EncounterClinicalSnapshotReadModel` (encounter-centric) y `EpisodeLongitudinalReadModel` (chart).  
2. **Hidratación de linkage (infra):** mantener mapeo de `encounterId` en vitales/EVA desde `Observation.encounter.reference` y cobertura de tests.  
3. **Patient detail (loader):** mantener `encounterSourceId` único y evitar regresiones de mezcla implícita.  
4. **Aislar fallback por fecha (solo longitudinal):** mantener heurística por fecha únicamente en read model de charts/historial, con trazabilidad (`derivedByDate=true`).  
5. **Deprecación semántica alias temporal:** en encounter-centric dejar de depender de `periodStart/periodEnd` salvo compatibilidad; priorizar `planned*` + `actual*`.  
6. **Unificación de presentación temporal por modo:** declarar explícitamente convención de timezone por surface (clínica operativa vs chart analítico).  
7. **Migración histórica opcional (más adelante):** backfill de `encounter` en observaciones históricas para reducir fallback por fecha.

---

## 7. Plan de remediación por fases

### Fase 1 — Quick wins (alta prioridad)

1. Patient detail: alinear encounter mostrado y datasets clínicos usando mismo `encounterId`. **Verificado (implementado)**.
2. Mapper EVA/vitales: hidratar `encounterId` en dominio cuando exista referencia. **Verificado (implementado)**.
3. Agregar tests de no-mezcla en patient detail e encounters list (caso dos encounters mismo día). **Inferido**.

### Fase 2 — Cambios estructurales (prioridad media)

1. Introducir servicios/loaders separados: `getEncounterCentricData(encounterId)` y `getEpisodeLongitudinalData(episodeId)`. **Inferido**.
2. Etiquetar explícitamente registros longitudinales derivados por fecha. **Inferido**.
3. Reducir dependencias de `periodStart/periodEnd` en UI encounter-centric. **Inferido**.

### Fase 3 — Más adelante (prioridad baja / dependencias externas)

1. Estrategia de migración histórica en servidor FHIR para completar `Observation.encounter`. **Pendiente de verificación (requiere datos reales)**.
2. Revisión de política de timezone clínica vs analítica con producto/operaciones. **Pendiente de verificación**.
3. Posible separación de timestamps clínicos (`measurementAt`) y administrativos (`recordedAt/snapshotAt`) en modelo de dominio. **Inferido**.

---

## Anexo: estado de evidencia

- **Verificado:** inspección estática de código del repositorio.
- **Inferido:** conclusión lógica basada en composición/contratos sin ejecución contra servidor FHIR real.
- **Pendiente de verificación:** depende de datos reales históricos, configuración del backend FHIR o decisiones funcionales de producto.
