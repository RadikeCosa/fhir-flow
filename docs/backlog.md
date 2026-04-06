# 📋 FHIR Flow — Backlog operativo vigente

Fecha de actualización: 2026-04-06

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

# 🔴 Frente activo único

## Continuidad clínica system-wide / longitudinal / legacy

**Estado** → **Abierto real**

### Motivo de permanencia como frente abierto

La continuidad encounter-centric en alcance acotado ya fue validada en múltiples surfaces y specs.  
Sin embargo, **no existe todavía cierre global/system-wide** del sistema completo.

Lo pendiente ya no es un bug acotado aislado del path principal validado, sino el cierre global de invariants cross-surface y de la frontera longitudinal/histórica/legacy.

### Este frente unifica lo que sigue realmente abierto

1. **Deuda longitudinal/histórica**
   - El fallback temporal por fecha se mantiene como estrategia longitudinal.
   - No debe reutilizarse como source-of-truth encounter-centric.
   - Persisten casos históricos sin `encounterId` tolerados en longitudinal.

2. **Legacy sin `encounterId`**
   - Existe policy mínima verificable y guardrails puntuales ya aplicados.
   - Aun así, no puede declararse cierre global/system-wide del frente legacy.
   - No hay migración/backfill masivo ejecutado.

3. **Continuidad clínica full-system**
   - La continuidad `in-progress` encounter-centric acotada ya está operativa y validada.
   - Lo pendiente es la garantía transversal system-wide entre surfaces incluidas.
   - No debe confundirse evidencia bounded con cierre global.

---

## T2 — Perímetro global de continuidad clínica system-wide

**Estado** → **Abierto real (delimitado)**

### Objetivo operativo

Cerrar el frente global sin reabrir bounded closures ya saldados.

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

### Criterio mínimo de cierre

- matriz obligatoria `surface × invariant × evidencia × estado`;
- al menos una prueba integrada o E2E por surface incluida para cubrir no-mezcla + source-of-truth;
- al menos una guarda negativa donde aplique;
- no declarar cierre global mientras existan filas críticas sin evidencia.

---

## T3 — Estado de subtickets del frente global

**Estado** → **Parcialmente ejecutado**

### Estado resumido

- **G1 — Invariants críticos encounter-centric/cross-surface** → **Cerrado por evidencia (alcance acotado)**
- **G2 — Continuidad browser system-wide de surfaces incluidas** → **Parcial con hueco principal de evidencia ya cubierto en alcance acotado**
- **G3 — Longitudinal/histórico: límites de fallback y consistencia con encounter-centric** → **Reforzado/cerrado en alcance acotado**
- **G4 — Legacy sin `encounterId`: policy verificable y guardrails finales** → **Endurecido/cerrado en alcance acotado**

### Regla de interpretación

Estos avances **no implican cierre global/system-wide** del frente.  
Funcionan como antecedentes válidos y no deben reabrirse salvo evidencia nueva verificable.

---

# 🟡 Abierto nominal/documental

## Modelo longitudinal de charts
**Estado** → **Abierto nominal/documental**

- Pendiente de documentación transversal más sintética para evitar lecturas ambiguas.
- No implica bug runtime nuevo.
- No tiene prioridad por encima del frente activo único.

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