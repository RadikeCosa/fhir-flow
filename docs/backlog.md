# 📋 FHIR Flow — Backlog operativo vigente

Fecha de actualización: 2026-04-07

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

# ✅ Frente operativo global (cerrado por evidencia ensamblada)

## Continuidad clínica system-wide / longitudinal / legacy

**Estado** → **Cerrado por evidencia (cierre documental global del frente operativo)**

### Veredicto de cierre

La matriz global `surface × invariant × evidencia × estado` quedó cubierta en nivel suficiente para T2 usando evidencia existente (unit/integration/browser acotado), sin identificar filas críticas con brecha funcional verificable.

El remanente detectado en la etapa final fue de ensamblado documental, no de gap técnico real: no apareció bug runtime nuevo verificable en este frente y no fue necesario aplicar fixes productivos.

### Alcance del cierre global de este frente

1. **Longitudinal/histórico (incluyendo charts)**
   - Se mantiene explícito que charts/history longitudinal pueden mezclar encuentros por diseño.
   - Lo validado para cierre es el confinamiento de esa lógica a surfaces longitudinales permitidas.
   - No hay contaminación de source-of-truth encounter-centric en `patient detail` ni `encounter detail`.

2. **Legacy sin `encounterId`**
   - Se sostiene la policy mínima por surface y guardrail de G4 como base operativa vigente.
   - No se requirió migración/backfill masivo para declarar el cierre documental del frente.

3. **Continuidad clínica system-wide**
   - Se cierra por ensamblado de evidencia existente entre surfaces incluidas.
   - El cierre no depende de nuevas specs browser mientras la evidencia integration/unit existente siga cubriendo T2 en las celdas relevantes.
   - No se reabren G1/G2/G3/G4 ni closures bounded previas por ausencia de evidencia técnica nueva.

---

## T2 — Perímetro global de continuidad clínica system-wide

**Estado** → **Cerrado por evidencia (criterio T2 satisfecho)**

### Resultado operativo

El criterio T2 queda satisfecho en este frente: matriz global cubierta con evidencia suficiente por surface e invariant aplicable, sin filas críticas sin evidencia funcional.

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

### Criterio mínimo de cierre (cumplido)

- matriz obligatoria `surface × invariant × evidencia × estado`: **consolidada**;
- cobertura por pruebas integradas/E2E en surfaces incluidas según aplicabilidad: **presente**;
- guardas negativas en invariants críticos: **presentes**;
- no quedan filas críticas sin evidencia funcional suficiente para este frente: **verificado**.

---

## T3 — Estado de subtickets del frente global

**Estado** → **Cerrado por evidencia (absorbido por cierre global documental)**

### Estado resumido

- **G1 — Invariants críticos encounter-centric/cross-surface** → **Cerrado por evidencia (alcance acotado)**
- **G2 — Continuidad browser system-wide de surfaces incluidas** → **Cierre documental acotado (hueco principal cubierto)**
- **G3 — Longitudinal/histórico: límites de fallback y consistencia con encounter-centric** → **Reforzado/cerrado en alcance acotado**
- **G4 — Legacy sin `encounterId`: policy verificable y guardrails finales** → **Endurecido/cerrado en alcance acotado**

### Regla de interpretación

Estos avances quedan absorbidos por el cierre documental global de este frente operativo, sin modificar su límite acotado original y sin reabrirlos.
La reapertura futura de este frente requiere **evidencia nueva verificable** (no duda narrativa ni reformulación documental).

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
