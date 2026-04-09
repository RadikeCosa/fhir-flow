# 📋 FHIR Flow — Backlog operativo vigente

Fecha de actualización: 2026-04-08

## Criterio de lectura de este backlog

Este documento refleja **trabajo activo real** y separa explícitamente:

- frentes **abiertos reales**;
- pendientes **nominales/documentales**;
- frentes **cerrados** que no deben reabrirse sin evidencia nueva verificable.

### Regla operativa

Este backlog **no se considera cerrado** mientras exista al menos un frente en **Abierto real**.

Los ítems en estado **Cerrado bounded**, **Cerrado por evidencia** o **Histórico** **no forman parte del trabajo activo** y **no deben reabrirse** salvo evidencia nueva verificable.

---

## 🧭 Taxonomía operativa

- **Cerrado real:** implementado y validado; no requiere seguimiento operativo.
- **Cerrado bounded:** cerrado en alcance acotado; no reabrir sin evidencia nueva verificable.
- **Cerrado por evidencia:** cierre diagnóstico/documental válido para el perímetro auditado; no equivale a cierre global/system-wide.
- **Abierto real:** brecha técnica vigente con impacto operativo.
- **Abierto nominal/documental:** drift o claridad documental pendiente, sin urgencia técnica runtime.
- **Histórico:** registro útil para trazabilidad; fuera del foco de decisión inmediata.

---

# ✅ Cierre global ejecutado (sin cambios productivos)

## Continuidad clínica system-wide / longitudinal / legacy

**Estado** → **Cerrado real**

### Diagnóstico de cierre final (ejecutivo)

- Se auditó el perímetro completo pedido (`patient detail`, `encounter detail` in-progress/finished, `encounter history`, composición longitudinal/history y evidencia browser cross-surface existente).
- En el estado actual del repositorio, **no se detectó bug runtime nuevo verificable** dentro de esos límites.
- Se identificó únicamente remanente **documental/histórico** (no runtime): explicar explícitamente que el fallback por fecha queda limitado a longitudinal/history y que legacy sin `encounterId` no puede subir a source-of-truth encounter-centric.
- No fue necesario hardening productivo adicional para cerrar el frente.

### Matriz única de cierre (`surface × invariant × evidencia × estado`)

| Surface | Invariant | Evidencia verificable | Estado |
|---|---|---|---|
| patient detail | No-mezcla cross-encounter + source encounter-centric | `inProgressEncounter ?? lastFinishedEncounter` + lectura clínica solo por `findAllByEncounterId(clinicalEncounterSource.id)` en loader; cobertura en `app/patients/[id]/__tests__/data.test.ts` y `cross-surface.contract.test.ts`. | 🟢 Verde |
| patient detail | No-mezcla cross-patient / fail-closed | Selección de patient/episodes por `patientId` y contrato cross-surface con guardas negativas en tests de patient detail. | 🟢 Verde |
| encounter detail (in-progress/finished) | No-mezcla cross-encounter + source encounter-centric por `encounterId` | Loader usa `findById(encounterId)` + datasets `findAllByEncounterId(encounterId)`/`findEvaByEncounterId(encounterId)`; cobertura negativa de no-mix y same-date sibling en `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`. | 🟢 Verde |
| encounter detail (in-progress/finished) | No-mezcla cross-patient / fail-closed | Guardrail explícito `encounter.patientId !== patientId => encounter: null` en loader + tests de guardas del mismo archivo. | 🟢 Verde |
| encounter history | Encounter-centric estricto para maps/cards + no contaminación por fallback | `vitalsByEncounterId`/`evaByEncounterId`/`proceduresByEncounterId` solo aceptan registros con `encounterId` explícito; fallback por fecha no entra en maps encounter-centric. Cobertura en `app/patients/[id]/encounters/__tests__/data.test.ts`. | 🟢 Verde |
| longitudinal/history composition | Legacy sin `encounterId` permitido solo bajo policy; prohibido como truth encounter-centric | `resolveLongitudinalLinkageOrigin`: acepta `linked-by-encounter`; permite `derived-by-date` solo sin `encounterId`; rechaza `encounterId` externo por fecha. Cobertura en `encounters/__tests__/data.test.ts` y `cross-surface.contract.test.ts`. | 🟢 Verde |
| navegación browser cross-surface | Continuidad y consistencia cross-surface sin mezcla | Spec E2E dedicada `e2e/flows/encounter-cross-surface-no-mix.spec.ts` con roundtrip `detail -> patient detail -> history -> detail` y guardas no-mix pre/post finalize (evidencia histórica del sprint G2). | 🟢 Verde (evidencia existente) |

---

## T2 — Perímetro global de continuidad clínica system-wide

**Estado** → **Cerrado real (validación final ejecutada)**

### Resultado operativo final

Frente cerrado sin reabrir bounded closures ya saldadas y sin abrir frentes nuevos.

### Surfaces incluidas

1. `patient detail`
2. `encounter detail` (`in-progress` y `finished`)
3. `encounter history`
4. surfaces longitudinales/históricas de history (charts y composición con fallback temporal controlado)
5. browser continuity/finalize en alcance system-wide como evidencia cross-surface

### Invariants globales de cierre

1. **No-mezcla cross-encounter** en surfaces encounter-centric.
2. **No-mezcla cross-patient** con fail-closed.
3. **Source-of-truth correcto por surface**:
   - encounter-centric por `encounterId` donde corresponda;
   - fallback temporal solo en longitudinal/histórico.
4. **Continuidad clínica verificable** en ciclo:
   - `save -> reload/remount -> rehydrate -> finalize`
5. **Consistencia cross-surface** entre:
   - selector/fuente de `patient detail`,
   - navegación de history,
   - detail encounter.
6. **Tratamiento explícito de legacy sin `encounterId`**:
   - permitido en longitudinal bajo policy controlada;
   - prohibido como source-of-truth encounter-centric.

### No alcance explícito

- reabrir practitioner consistency en encounter write;
- tratar `ActionError` fuera de encounter write como urgencia técnica;
- reabrir canonical read bounded de `finished encounter detail`;
- reabrir cobertura browser bounded ya cerrada;
- refactors UI/UX de polish visual sin impacto en invariants.

### Criterio de cierre aplicado

- matriz `surface × invariant × evidencia × estado` completa y en verde;
- evidencia integrada por surface + guardas negativas relevantes;
- sin hueco técnico runtime real remanente dentro del perímetro;
- sin hardening productivo adicional necesario.

---

## T3 — Estado de subtickets del frente global

**Estado** → **Cerrado**

### Estado resumido

- **G1 — Invariants críticos encounter-centric/cross-surface** → **Cerrado por evidencia (alcance acotado)**
- **G2 — Continuidad browser system-wide de surfaces incluidas** → **Cerrado por evidencia existente**
- **G3 — Longitudinal/histórico: límites de fallback y consistencia con encounter-centric** → **Reforzado/cerrado en alcance acotado**
- **G4 — Legacy sin `encounterId`: policy verificable y guardrails finales** → **Endurecido/cerrado en alcance acotado**

### Regla de interpretación

Este cierre corresponde al perímetro solicitado de continuidad system-wide / longitudinal / legacy.  
No reabre practitioner consistency, ActionError fuera de encounter write, canonical read bounded de finished detail ni cobertura browser bounded ya cerrada.

---

# 🟡 Abierto nominal/documental

## Modelo longitudinal de charts
**Estado** → **Abierto nominal/documental**

- Pendiente de documentación transversal más sintética para evitar lecturas ambiguas.
- No implica bug runtime nuevo.
- No tiene prioridad por encima del cierre operativo ya consolidado.

## Visibilidad de planned encounters en history
**Estado** → **Abierto nominal/documental**

- Se mantiene como decisión UX.
- No corresponde a bug de dataset ni de scoping.
- No tratar como frente técnico principal.

## Register form — refinamiento UX/semántico acotado
**Estado** → **Abierto nominal/documental**

- Frente acotado al surface `/encounters/register`: copy, jerarquía visual y affordances de interacción.
- No se trata como cambio arquitectónico ni como reapertura de lifecycle/write/planning-vs-register.
- Regla explícita a sostener en documentación y futuros criterios UX: register corresponde a visitas ocurridas o en curso; visitas futuras corresponden a planning (`/encounters/new`).
- Sprint documental preparado en `docs/sprints/sprint-ux-register-form-acotado-2026-04-07.md`, sin cambios productivos en esta etapa.


## Register entry flow — unificación de entrada (diagnóstico técnico-funcional)
**Estado** → **Abierto nominal/documental (análisis listo para sprint acotado)**

- Se evaluó fricción UX/operativa del gate inicial en `/encounters/register` (`Iniciar visita` vs `Finalizar directamente`) por introducir una decisión operativa temprana antes de la carga clínica natural del formulario.
- Recomendación documental: avanzar con **entrada directa al formulario clínico unificado + intención explícita en acciones finales** (`Guardar progreso` / `Finalizar visita`) manteniendo semántica explícita de intención y sin inferencias implícitas por campos.
- Se descarta creación inmediata al entrar por riesgo de encounters huérfanos, ruido de auditoría y mayor complejidad de rollback/cancelación sin valor clínico proporcional.
- Este frente se trata como **rediseño acotado del flow register**, sin reapertura de lifecycle ADR-001, sin cambios al practitioner model y sin mezclar planning (`/encounters/new`) con register (`/encounters/register`).
- Sprint documental propuesto: `docs/sprints/sprint-register-entry-flow-unificado-2026-04-08.md`.

## Register → save progress → detail continuity (auditoría runtime)
**Estado** → **Cerrado por evidencia (post-implementación)**

- La auditoría inicial detectó fricción de continuidad register→detail y abrió el frente de reparación.
- Con la implementación single-surface posterior, `Guardado parcial` ya no obliga salto inmediato a detail y la continuidad inicial queda en register.
- Se conserva trazabilidad histórica del diagnóstico en `docs/sprints/sprint-audit-register-progress-detail-continuity-2026-04-08.md`.



## Unificación formulario clínico register/continuidad (auditoría integral)
**Estado** → **Abierto real (prioridad alta)**

- Auditoría integral ejecutada el 2026-04-08: se confirma coexistencia de dos formularios clínicos reales (`RegisterEncounterForm` y `FinalizeEncounterForm`) y múltiples schemas activos con drift menor pero acumulativo.
- Brecha principal: inconsistencia de experiencia/surface/copy en continuidad (`/encounters/register` vs `/encounters/[encounterId]`), con percepción de “segundo formulario” y ocultamiento inicial del input editable de nota clínica al retomar.
- Vitales/EVA/procedimientos no son obligatorios por regla global, pero su validación estricta al informar valores genera percepción de obligatoriedad en ciertos casos.
- Decisión recomendada del audit: **unificación real sobre un nuevo formulario clínico compartido** (no seguir con dos formularios paralelos).
- Sprint documental propuesto: `docs/sprints/sprint-unificacion-formulario-clinico-register-continuidad-2026-04-08.md`.
- Avance implementado en fases 2/3: `register` y `continuidad/detail` reutilizan composición clínica compartida (`ClinicalEncounterForm` + bloques clínicos comunes), eliminando divergencias principales de campos base entre surfaces.
## Register single-surface clínico (redefinición de flujo target)
**Estado** → **Cerrado real (implementado)**

- Implementado el single-surface clínico en `/encounters/register` con continuidad de guardado parcial en la misma route.
- Se mantiene arquitectura vigente (lifecycle, practitioner model, separación planning/register) sin reaperturas de ADR.
- Sprint ejecutado y actualizado en `docs/sprints/sprint-redefinicion-register-single-surface-2026-04-08.md`.

## Patient detail — refinamiento UX/jerarquía (estado estabilizado)
**Estado** → **Histórico (estabilizado / fuera de foco inmediato)**

- Refinamiento ejecutado en esta iteración para consolidar `patient detail` como pantalla operativa compacta.
- Resultado vigente: identificación mínima visible, diagnóstico principal con tags relevantes, señal operativa breve, CTA principal único por estado, acciones secundarias subordinadas, contacto como acceso secundario expandible y recuperación de contexto mínimo de “visita relevante” sin inflar la pantalla.
- Alcance acotado al frente de presentación/jerarquía: sin cambios arquitectónicos, sin reapertura de lifecycle ni lógica clínica.
- No se marca cierre definitivo del frente: queda pausado/estabilizado para uso actual y fuera del foco inmediato.
- Evolución posterior posible: surface `episode detail`, fuera del alcance de este registro y no activada como deuda urgente.

---

# ✅ Cerrado bounded / por evidencia (no reabrir sin evidencia nueva)

## Canonical read de `finished` en encounter detail
**Estado** → **Cerrado bounded**

- Validado como path canónico encounter-centric por `encounterId`.
- Sin fallback temporal como source-of-truth en ese surface.
- No equivale a cierre global del read model.

## Canonical read hardening global de `finished` (más allá de detail)
**Estado** → **Cierre documental acotado**

- Señalización canónica cross-surface reforzada.
- `patient detail` deriva al detail canónico.
- `encounter history` permanece como resumen/navegación secundaria.
- No implica cierre global/system-wide.

## Alineación cross-surface (`patient detail` ↔ `encounter history`)
**Estado** → **Cerrado bounded**

- Contrato runtime explícito fijado.
- Tests de regresión presentes.
- Sin deuda runtime nueva verificable en este alcance.

## Continuidad clínica encounter-centric acotada
**Estado** → **Cerrado bounded**

- `encounter detail` rehidrata por `encounterId`.
- `patient detail` usa `inProgressEncounter ?? lastFinishedEncounter`.
- Save/reload/remount/rehydrate validados en alcance acotado.
- No implica continuidad full-system.

## Cobertura browser bounded de continuidad clínica
**Estado** → **Cerrada bounded**

- Cerrados los huecos acotados definidos en el sprint correspondiente.
- Sin bug runtime nuevo verificable.
- No implica cierre browser global/system-wide.

## G1 — Invariants encounter-centric/cross-surface
**Estado** → **Cerrado por evidencia (alcance acotado)**

- Matriz auditada cerrada para `patient detail`, `encounter detail` y `encounter history`.
- Sin bug runtime nuevo verificable.
- Sin cambios productivos.

## G2 — Hueco principal de evidencia browser
**Estado** → **Cierre documental acotado**

- Roundtrip cross-surface pre-finalize cubierto en alcance acotado.
- Sin bug runtime nuevo verificable.
- Sin cambios productivos adicionales.

## G3 — Frontera longitudinal/histórico vs encounter-centric
**Estado** → **Cierre documental acotado**

- Frontera reforzada en el perímetro auditado.
- Fallback por fecha confinado a longitudinal/histórico.
- Sin bug runtime nuevo verificable.

## G4 — Legacy sin `encounterId`
**Estado** → **Cierre documental acotado**

- Policy mínima verificable por surface.
- Guardrail puntual aplicado.
- Sin refactor general ni backfill masivo.

## Practitioner consistency en encounter write
**Estado** → **Cerrado bounded**

- Cerrado en el frente encounter write.
- No reabrir sin evidencia nueva verificable.

## Tipado de `ActionError.details` fuera de encounter write
**Estado** → **Cierre por evidencia diagnóstica/documental**

- No hay hoy perímetro operativo no-encounter que justifique tratarlo como urgencia técnica real.
- Mantener como drift nominal y no como frente activo.

---

# ✅ Resuelto y operativo

## Track B — Creation
- R1 — Entry point “Registrar visita” → **Resuelto**
- A1 — Ajustar CTAs globales → **Resuelto**
- R2 — Crear encounter en `in-progress` → **Resuelto**
- R3 — Crear encounter en `finished` → **Resuelto**
- R4 — Unificar pipeline clínico → **Resuelto**

## Track A — Lifecycle
- Save progress separado → **Resuelto**
- L1 — `startEncounterAction` → **Resuelto**
- L2 — endurecimiento de `finalizeEncounterAction` → **Resuelto**

---

# 📦 Histórico / referencia

Los sprints cerrados y auditorías previas se conservan solo como trazabilidad histórica.  
No deben leerse como trabajo activo mientras su contenido ya esté absorbido por este backlog y por la validación arquitectónica vigente.

Cualquier reapertura requiere **evidencia nueva verificable**, no solo duda narrativa o reformulación documental.
