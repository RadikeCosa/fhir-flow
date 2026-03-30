# 📋 FHIR Flow — Backlog reordenado (post sprint register flow)

Fecha de actualización: 2026-03-30

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

---

## 🟡 Parcial / transición activa

### Track A — Lifecycle
- **L2 — Endurecer finalizeEncounterAction** → **Parcial**
  - Dirección cerrada: requerir `in-progress`.
  - Estado actual: sigue compatibilidad `planned -> finished` (transicional).

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

### Track A — Lifecycle
- **L1 — Implementar startEncounterAction** → **Deuda abierta (crítico)**
  - Falta transición explícita `planned -> in-progress` para encounters ya planificados.

### Debt transversal documentada
- **Canonical read completo de finished detail** → **Deuda abierta**
  - Detail es target canónico por arquitectura, pero el cierre completo sigue pendiente.
- **Deuda longitudinal/histórica** → **Deuda abierta**
  - El fallback temporal por fecha se mantiene como estrategia longitudinal; no debe reutilizarse como source-of-truth encounter-centric.
  - Persisten casos históricos sin `encounterId` que requieren manejo controlado.

---

## 🚀 Siguiente fase (prioridad sugerida)

1. **Bloque prioritario inmediato (read + UX clínica):**
   - continuidad clínica real de `in-progress` en UI;
   - integración/rehidratación de `saveEncounterProgressAction` en surfaces encounter-centric;
   - validación de no-mezcla encounter/datasets:
- patient detail: datasets pertenecen al mismo encounterId renderizado
- encounter detail: no fallback temporal si existe linkage
- charts: fallback permitido solo en modo longitudinal
2. **Cerrar deuda de canonical read para `finished`** (hardening por estado + validación end-to-end).
3. **L1** — startEncounterAction.
4. **L2** — endurecer finalize con retiro progresivo del fallback transicional.
5. Tipado de `ActionError.details` por capa.
6. Hardening incremental UI/UX (F2/F3/G2 y luego temporal UX/hardening/dashboard).

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
