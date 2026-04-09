# Sprint — Auditoría integral y propuesta de unificación del formulario clínico `register/continuidad`

Fecha: 2026-04-08  
Estado: Diagnóstico completo (sin implementación)

## 1) Alcance auditado

### Rutas y loaders
- `app/patients/[id]/encounters/register/page.tsx`
- `app/patients/[id]/encounters/register/data.ts`
- `app/patients/[id]/encounters/[encounterId]/page.tsx`
- `app/patients/[id]/encounters/[encounterId]/data.ts`

### Formularios/componentes
- `app/patients/[id]/encounters/new/components/RegisterEncounterForm/index.tsx`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx`
- `app/patients/[id]/encounters/[encounterId]/components/PlannedFinalizeEncounterSection.tsx`

### Schemas y acciones
- `app/patients/[id]/encounters/new/actions/register-encounter.schema.ts`
- `app/patients/[id]/encounters/[encounterId]/actions/save-encounter-progress.schema.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.schema.ts`
- `app/patients/[id]/encounters/new/actions/register-encounter.action.ts`
- `app/patients/[id]/encounters/[encounterId]/actions/save-encounter-progress.action.ts`
- `app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts`

### Tests revisados
- `app/patients/[id]/encounters/register/__tests__/page.entry-flow.test.tsx`
- `app/patients/[id]/encounters/__tests__/route-flow-separation.test.ts`
- `app/patients/[id]/encounters/new/components/RegisterEncounterForm/__tests__/register-encounter-form.completion-mode.test.ts`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/__tests__/finalize-encounter-form.schema.test.ts`

---

## 2) Hallazgos concretos del runtime actual

## 2.1 ¿Cuántos formularios clínicos reales hay hoy?

Hay **dos formularios clínicos reales de carga/edición** y **un tercer sub-formulario de inicio planned**:

1. **`RegisterEncounterForm`** en `/encounters/register`.
2. **`FinalizeEncounterForm`** en `/encounters/[encounterId]` cuando `status === "in-progress"`.
3. **`PlannedFinalizeEncounterSection`** cuando `status === "planned"` (solo fecha/hora de inicio real + acción de iniciar).

Conclusión: hoy no existe una única experiencia; hay una base duplicada con variantes de surface y framing.

## 2.2 ¿Qué schema usa cada flujo?

- **Register inicial / registrar desde `/encounters/register`**
  - UI: schema local `registerEncounterFormSchema` (definido dentro de `RegisterEncounterForm`).
  - Server: `registerEncounterSchema` en `register-encounter.schema.ts`.

- **Guardado parcial tras encounter ya creado**
  - UI: sigue usando schema local de `RegisterEncounterForm`.
  - Server: `saveEncounterProgressSchema`.

- **Retomar/completar visita desde detail**
  - UI y server de finalización: `finalizeEncounterFormSchema`.
  - Guardado parcial en ese mismo surface: `saveEncounterProgressSchema`.

Conclusión: hoy hay **múltiples schemas activos** con reglas cercanas pero no idénticas.

## 2.3 Diferencias concretas detectadas

### A) Campos visibles

#### RegisterEncounterForm (`/encounters/register`)
Incluye: tipo de visita, motivo, fecha, hora inicio, hora fin, nota clínica, signos vitales, EVA, procedimientos, acciones `Guardado parcial`/`Registrar`.

#### FinalizeEncounterForm (`/encounters/[encounterId]` in-progress)
Incluye casi lo mismo, pero:
- **no expone tipo de visita editable** (usa visitType del encounter existente en acción server);
- muestra bloque “Datos base de continuidad” colapsable;
- acciones `Guardar progreso`/`Finalizar visita`;
- copy y framing diferentes.

#### PlannedFinalizeEncounterSection (`/encounters/[encounterId]` planned)
Solo permite setear fecha/hora de inicio real e iniciar visita.

### B) Obligatorios por acción

#### Guardado parcial target deseado
- Fecha + hora inicio obligatorios.

#### Estado actual
- En register (`completionMode: start`): `registerEncounterSchema` no exige fin ni nota; exige fecha/hora inicio.
- En continuidad (`saveEncounterProgressSchema`): exige fecha/hora inicio.

=> Esta parte está sustancialmente alineada.

#### Registrar/finalizar target deseado
- Fecha + hora inicio + hora fin + nota clínica obligatorios.

#### Estado actual
- register (`completionMode: complete`): `registerEncounterSchema` exige hora fin y nota.
- finalize detail: `finalizeEncounterFormSchema` exige fecha, inicio, fin, nota.

=> También alineado en obligatoriedad core.

### C) Rangos/validaciones

Puntos comunes en los 3 schemas clínicos:
- rangos de vitales/EVA coherentes con `VITAL_SIGN_CAPTURE_RANGES`;
- validación de PA sistólica/diastólica completa;
- diastólica < sistólica;
- coherencia categoría/código de procedimiento.

Diferencias puntuales:
- `registerEncounterSchema` y `saveEncounterProgressSchema` bloquean inicio futuro explícitamente.
- `finalizeEncounterFormSchema` valida orden inicio/fin, pero no replica de la misma forma el bloqueo de futuro que sí existe en register/save.
- `registerEncounterFormSchema` del cliente acepta `actualEndTime` vacío (`""`) antes de normalizar, mientras server schema maneja string opcional.

### D) Copy/framing

- `/encounters/register`: “Registrar visita”, “Datos de la visita”, CTA `Guardado parcial` / `Registrar`.
- `/encounters/[encounterId]` in-progress: “Continuar visita en curso” + formulario titulado por secciones de continuidad y botón `Finalizar visita`.
- in-progress en detail puede mostrar resumen de nota con input oculto por defecto detrás de `Editar` en “Datos base de continuidad”.

Esta diferencia de framing explica percepción de “segunda surface/formulario”.

## 2.4 ¿Por qué puede quedar oculta la nota clínica en continuidad?

Porque en `FinalizeEncounterForm` los campos base (fecha/inicio/fin/nota) están detrás del toggle `showCoreVisitFields` y arrancan colapsados en `false`. En modo colapsado solo se ve resumen (`clinicalNoteSummary`) y no el textarea editable.

No es pérdida de dato: es decisión de UX de colapsado inicial + apertura automática solo si hay errores de esos campos.

## 2.5 ¿Por qué a veces se percibe obligación de signos vitales para finalizar?

No hay obligación directa por regla de negocio de “debe haber vitales”.

La fricción viene de efectos colaterales de validación:
- si se carga PA incompleta (solo sistólica o solo diastólica), falla;
- si se carga PA con diastólica >= sistólica, falla;
- si se cargan valores fuera de rango, falla.

Esto puede interpretarse erróneamente como “vitales obligatorios”, cuando en realidad son opcionales pero estrictamente validados si se informan.

---

## 3) Matriz exacta: actual vs target deseado

| Flujo | Surface actual | Form real | Acción server | Obligatorios reales hoy | Gap vs target |
|---|---|---|---|---|---|
| Register inicial | `/encounters/register` | RegisterEncounterForm | `registerEncounterAction` (`start`/`complete`) | start: fecha+inicio; complete: +fin+nota | Casi alineado |
| Guardado parcial | `/encounters/register` o `/encounters/[id]` | RegisterEncounterForm o FinalizeEncounterForm | `saveEncounterProgressAction` (si ya existe encounter) | fecha+inicio | Alineado en regla; no alineado en unicidad UX |
| Retomar/completar | `/encounters/[encounterId]` in-progress | FinalizeEncounterForm | save/finalize | finalize exige fecha+inicio+fin+nota | Gap de experiencia/copy/visibilidad de nota |
| Registrar/finalizar | ambos surfaces según contexto | dos formularios | register complete / finalize | ambos piden fecha+inicio+fin+nota | Duplicación de surface y de schemas |

---

## 4) Respuestas explícitas solicitadas

### 4.1 ¿Hoy hay dos formularios distintos o una sola base con variantes?

**Sí, hay dos formularios clínicos distintos reales** (`RegisterEncounterForm` y `FinalizeEncounterForm`), con fuerte solapamiento de campos y comportamiento.

### 4.2 ¿Hoy hay dos schemas realmente distintos con reglas divergentes?

**Sí, hay más de dos**: al menos `registerEncounterSchema`, `saveEncounterProgressSchema`, `finalizeEncounterFormSchema` + schema local de UI en register. Comparten gran parte de reglas, pero tienen divergencias de framing y algunas validaciones de tiempo/futuro.

### 4.3 ¿Los signos vitales quedan obligatorios por diseño o por efecto colateral?

**Por efecto colateral percibido**: no son obligatorios globalmente, pero cualquier vital informado activa validaciones estrictas (rangos y par sistólica/diastólica), lo que puede bloquear submit y parecer obligatoriedad.

### 4.4 Diferencia exacta entre register inicial, guardado parcial, retomar/completar, registrar/finalizar

- **Register inicial**: entra por `/encounters/register`, crea encounter o finaliza directo según intención.
- **Guardado parcial**: puede ocurrir en register o detail, siempre con exigencia mínima de fecha+inicio.
- **Retomar/completar**: cae en detail in-progress con `FinalizeEncounterForm` y copy de continuidad/finalización.
- **Registrar/finalizar**: existe en ambos mundos (register complete y finalize detail) con obligatoriedad de fin+nota.

### 4.5 Estrategia correcta (A/B/C/D)

**Recomendación firme: C — extraer un formulario clínico compartido nuevo como source-of-truth único.**

Justificación:
- A (unificar sobre RegisterEncounterForm) arrastra lógica acoplada a creación inicial + submit dual local.
- B (unificar sobre FinalizeEncounterForm) arrastra UX colapsada y acople a detail/in-progress.
- C permite separar claramente:
  - `ClinicalEncounterForm` (UI única de campos + secciones + copy consistente).
  - `clinicalEncounterSchemaBase` + refinamientos por intención (`save-progress`, `register/finalize`).
  - wrappers mínimos de route para contexto/encounterId.

---

## 5) Diseño recomendado (target unificado)

## 5.1 Source-of-truth propuesto

- **Componente único**: `ClinicalEncounterForm` reutilizable en register y continuidad.
- **Esquema único base**: `clinicalEncounterBaseSchema`.
- **Reglas por intención**:
  - `save-progress`: requiere fecha + hora inicio.
  - `complete`: requiere fecha + hora inicio + hora fin + nota.
- **Acciones**:
  - mantener `registerEncounterAction`, `saveEncounterProgressAction`, `finalizeEncounterAction` pero consumiendo parser/normalizador compartido para eliminar drift.

## 5.2 Reglas finales de validación (propuesta)

1. **Guardado parcial**
   - obligatorios: `actualDate`, `actualStartTime`;
   - opcionales: visitType, reasonDisplay, clinicalNote, vitales, EVA, procedimientos, endTime.

2. **Registrar / Finalizar**
   - obligatorios: `actualDate`, `actualStartTime`, `actualEndTime`, `clinicalNote`;
   - opcionales: reasonDisplay, vitales, EVA, procedimientos.

3. **Vitales/EVA/procedimientos**
   - nunca obligatorios por presencia;
   - si se informan, validar rangos/coherencia.

4. **Semántica de continuidad**
   - nota clínica siempre visible/editable por defecto (sin ocultamiento por colapso inicial), o colapso opcional pero iniciado abierto.

## 5.3 Estrategia de rollout recomendada

### Fase 1 (infra de formulario único)
- extraer `ClinicalEncounterForm` + `useClinicalEncounterForm` + schema base compartido.
- usarlo en `/encounters/register` sin cambiar contratos de acción.

### Fase 2 (continuidad/detail)
- reemplazar cuerpo de `FinalizeEncounterForm` por wrapper sobre `ClinicalEncounterForm`.
- mantener route `/encounters/[encounterId]` como shell contextual (estado, breadcrumbs, navegación).

### Fase 3 (hardening y cleanup)
- eliminar schemas duplicados/locales que queden huérfanos.
- consolidar tests a una matriz única por intención.
- alinear copy/labels/acciones entre register y continuidad.

---

## 6) Plan de sprint propuesto (nuevo)

### Nombre
`Sprint: unificación real del formulario clínico register/continuidad`

### Objetivo
Lograr **una única experiencia clínica** en register + continuidad con un solo formulario y reglas de validación coherentes por intención.

### Entregables
1. `ClinicalEncounterForm` compartido.
2. schema base compartido + refinamientos por acción.
3. wrappers delgados para register/detail.
4. matriz de tests única (campos, obligatoriedad, copy y rutas).
5. eliminación de drift de copy/colapsado/acciones.

### Criterios de aceptación
- no existe diferencia de campos entre register y continuidad, salvo contexto de ruta.
- `save-progress` nunca exige vitales/EVA/procedimientos.
- `complete` exige exactamente fecha+inicio+fin+nota.
- nota clínica editable visible al retomar visita.
- pruebas de regresión verdes para ambos entry points.

---

## 7) Conclusión ejecutiva

El problema reportado es real y hoy proviene de **duplicación de formularios + esquemas + framing** entre register y continuidad. Las reglas core están casi alineadas, pero la experiencia no está unificada y provoca inconsistencias percibidas (incluyendo nota clínica oculta en continuidad y falsa sensación de obligatoriedad de vitales).

La decisión recomendada es **C (nuevo formulario clínico compartido)**, con schema base único y validación por intención de acción. No se recomienda seguir acumulando parches sobre los dos formularios actuales.
