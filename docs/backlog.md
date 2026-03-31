# 📋 FHIR Flow — Backlog reordenado (post sprint register flow)

Fecha de actualización: 2026-03-31

## 🧭 Convenciones
- **Resuelto:** implementado y validado en el sprint de register flow.
- **Parcial:** dirección correcta con transición activa.
- **Deuda abierta:** brecha reconocida, no cerrada.
- **Siguiente fase:** no prioritario para cerrar transición actual.

Tracks:
- **Track A — Lifecycle** → estados de un encounter existente.
- **Track B — Creation** → cómo nace un encounter.
- **Track C — UI/UX & Polish** → mejoras visuales y consistencia.

---

## ✅ Resuelto en sprint register flow

### Track B — Creation
- **R1 — Entry point “Registrar visita”** → **Resuelto**
  - Ruta operativa: `/patients/[id]/encounters/register`.
  - Separada de `/patients/[id]/encounters/new` (planificar).

- **A1 — Ajustar CTAs globales** → **Resuelto**
  - Patient detail ya condiciona acciones por `inProgressEncounter` y `nextPlannedEncounter`.
  - 4 estados explícitos de CTA en runtime.

- **R2 — Crear encounter en in-progress** → **Resuelto**
  - `registerEncounterAction` con `completionMode: "start"`.
  - Persistencia interoperable con ownership metadata.

- **R3 — Crear encounter en finished** → **Resuelto**
  - `registerEncounterAction` con `completionMode: "complete"`.
  - Reusa reglas clínicas shared de cierre.

- **R4 — Unificar pipeline clínico** → **Resuelto**
  - Pipeline clínico compartido extraído y reutilizado entre finalize/register.

### Track A — Lifecycle (habilitadores)
- **(sin ID nuevo) Save progress separado** → **Resuelto (alcance de sprint)**
  - Operación existente: `saveEncounterProgressAction`.
  - Snapshot transaccional + reemplazo de recursos managed por esta app.

- **L1 — Implementar startEncounterAction** → **Resuelto**
  - `startEncounterAction` está operativo para transición explícita `planned -> in-progress` en encounters ya planificados.

## ✅ Sprint cerrado — Rehidratación in-progress (2026-03)

- **T1 — Contrato loader → initial values** → **Completado**
  - Se cerró el contrato explícito entre loader encounter-centric y valores iniciales del formulario para `in-progress`.

- **T2 — Loader encounter detail (`in-progress`)** → **Completado**
  - `encounter detail` entrega lectura clínica por `encounterId` para continuidad de la visita en curso.

- **T3 — Mapper clinical read → form values** → **Completado**
  - Se implementó el mapeo de lectura clínica persistida hacia valores iniciales editables, tolerando parcialidad sin mezclar encounters.

- **T4 — Wiring formulario editable** → **Completado**
  - El formulario consume initial values rehidratados y mantiene flujo consistente de edición/guardado/reapertura.

- **T5 — Tests de rehidratación y no-mezcla** → **Completado**
  - Se incorporaron pruebas para continuidad clínica por `encounterId` y protección contra contaminación entre datasets de encounters.

---


## ✅ Sprint cerrado — Validación E2E de continuidad encounter-centric (2026-03)

- **V1 — Continuidad básica `write -> read -> render`** → **Completado (alcance acotado)**
  - Validación manual satisfactoria en flujos ya implementados.
  - No se detectaron bugs concretos que exigieran hardening adicional en el sprint.

- **V2 — No-mezcla encounter-centric en surfaces activas** → **Completado (alcance acotado)**
  - `patient detail` y `encounter detail` validados sin mezcla de datasets entre encounters activos.

- **V3 — Evidencia reproducible mínima** → **Completado**
  - Test integrado: `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
    - `"hydrates only the clinical datasets of the requested encounterId"`.
  - Test integrado: `app/patients/[id]/__tests__/data.test.ts`
    - `"loads clinical datasets from inProgressEncounter instead of lastFinishedEncounter when both exist"`.

- **Límite confirmado en UI de completar visita (sin cierre adicional)**
  - El usuario puede finalizar o volver; si vuelve, pierde datos cargados.
  - No hay persistencia parcial operativa en esa UI.
  - El sprint valida ausencia de persistencia parcial accidental y persistencia correcta al finalizar; no cierra continuidad clínica completa de `in-progress`.

---

## 🟡 Parcial / transición activa

### Track A — Lifecycle
- **L2 — Endurecer finalizeEncounterAction** → **Resuelto**
  - `finalizeEncounterAction` valida estado y exige `in-progress`.
  - Se elimina la suposición transicional de cierre directo `planned -> finished` para encounters ya planificados.

### Track C — UI/UX & Polish (estado post avances read encounter-centric)
- **(sin ID nuevo) Read encounter-centric en patient/encounter detail** → **Parcial**
  - ✅ Ya implementado:
    - separación más explícita encounter-centric vs longitudinal en `encounters/data.ts`;
    - hidratación de `encounterId` en lectura de vitales y EVA cuando FHIR trae referencia;
    - patient detail con una única fuente clínica (`inProgressEncounter ?? lastFinishedEncounter`) y datasets del mismo `encounterId`;
    - encounter detail con hidratación mínima encounter-centric también para `in-progress`.
  - 🔶 Aún abierto:
    - continuidad clínica completa de `in-progress` en UI (incluida integración/rehidratación de save progress) no está cerrada.

---

## 🔴 Deuda abierta (no cerrar)

### Debt transversal documentada
- **Canonical read hardening completo de `finished` (global)** → **Deuda abierta**
  - El path `finished encounter detail` se mantiene preservado y validado en alcance acotado.
  - Sigue pendiente el hardening completo por estado/surfaces y su validación E2E global.
- **Deuda longitudinal/histórica** → **Deuda abierta**
  - El fallback temporal por fecha se mantiene como estrategia longitudinal; no debe reutilizarse como source-of-truth encounter-centric.
  - Persisten casos históricos sin `encounterId` que requieren manejo controlado.

## 🔴 Deuda abierta (post-sprint)

- **Continuidad clínica completa de `in-progress` en UI** → **Pendiente**
  - Sigue abierta la continuidad completa de edición/reanudación clínica en la UI de visita en curso.

- **Canonical read hardening completo de `finished`** → **Pendiente**
  - El cierre validado es acotado; falta hardening completo y cobertura integral en el conjunto de surfaces relevantes.

- **Datos históricos sin `encounterId`** → **Pendiente**
  - Continúan existiendo casos legacy sin linkage completo que requieren estrategia explícita para no contaminar surfaces encounter-centric.

- **Cobertura E2E browser-level del circuito completo** → **Pendiente**
  - Existen tests de integración livianos encounter-centric, pero no cobertura browser E2E del circuito completo.

- **Tipado de `ActionError.details` por capa** → **Pendiente**
  - `details` continúa transicional y sin tipado final por variante/capa.

---

## 🚀 Siguiente fase (prioridad sugerida)

1. **Bloque prioritario inmediato (read + UX clínica):**
   - continuidad clínica real de `in-progress` en UI;
   - integración/rehidratación de `saveEncounterProgressAction` en surfaces encounter-centric;
   - validación de no-mezcla encounter/datasets:
- patient detail: datasets pertenecen al mismo encounterId renderizado
- encounter detail: no fallback temporal si existe linkage
- charts: fallback permitido solo en modo longitudinal
2. **Profundizar validación E2E post-cierre de canonical read en `finished detail`**.
3. Tipado de `ActionError.details` por capa.
4. Hardening incremental UI/UX (F2/F3/G2 y luego temporal UX/hardening/dashboard).

## 🚀 Próximo sprint propuesto

### Validación clínica E2E y continuidad post-cierre de finished detail

**Objetivo breve**
- Consolidar validación end-to-end y continuidad encounter-centric sin reabrir artificialmente el cierre ya logrado en `finished encounter detail`.

**Scope inicial**
- reforzar validaciones de no-mezcla entre encounter-centric y longitudinal en rutas abiertas;
- definir y ejecutar validaciones de integración/E2E para lectura/rehidratación/edición;
- mantener explícito el límite entre deuda longitudinal/histórica abierta y surfaces canónicas ya cerradas.

---

## 📦 Backlog histórico (IDs mantenidos)

### Track C — UI/UX (pendiente no crítico)
- **F2** — Ajustes visuales en encounter finished.
- **F3** — Limpieza de layout en detalle finished.
- **G2** — Simplificación de history list.
- **K3, K5, C4, E2, K4** — Temporal UX.
- **E4, E6, C1, E3, C2, C3, K6, I2, G1** — Hardening & validaciones.
- **B2, B3, B4, B1, A2** — Patient dashboard.

### Futuro
- **M1** — Modelado adicional clínico.
- **FUT1** — Features futuras (no definidas aún).
