# 📋 FHIR Flow — Backlog reordenado (post sprint register flow)

Fecha de actualización: 2026-04-01

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

## ✅ Sprint cerrado — In-progress continuity (2026-03)

- **T3 — UI save-progress wiring** → **Completado**
  - El encounter detail editable `in-progress` expone dos intenciones explícitas: guardar progreso y finalizar visita.
  - La persistencia parcial dejó de depender exclusivamente del cierre final de visita.

- **T4 — Hardening de rehidratación del form (`reset`)** → **Completado**
  - El formulario se resincroniza con valores canónicos derivados del loader cuando cambian.
  - Se reduce el riesgo de que estado local montado tape datos recargados.

- **T5 — Tests de continuidad** → **Completado (alcance acotado)**
  - Se agregó evidencia automatizada del loop save→reload/remount→rehydrate por `encounterId`.
  - Se cubrió aislamiento entre encounters y preservación de datos parciales.

### Evidence
- Rehydration loop funcionando para el mismo `encounterId`.
- No-mix entre encounters del mismo paciente.
- Datos parciales preservados sin defaults inventados.

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
  - Test E2E browser-level: `e2e/flows/encounter-continuity.spec.ts`
    - `"save progress survives reload by rehydrating in-progress form"` valida `save -> reload -> rehydrate` por `encounterId` para nota clínica, EVA y signos vitales seleccionados.

- **Límite confirmado en UI de completar visita (sin cierre adicional)**
  - El usuario puede finalizar o volver; si vuelve, pierde datos cargados.
  - No hay persistencia parcial operativa en esa UI.
  - El sprint valida ausencia de persistencia parcial accidental y persistencia correcta al finalizar; no cierra continuidad clínica completa de `in-progress`.
  - La validación E2E browser-level de finalize (`in-progress -> finalize -> finished`) queda explícitamente abierta para un escenario determinístico posterior.

---


## ✅ Sprint cerrado — Canonical read hardening de `finished encounter detail` (2026-03)

- **Resultado del sprint** → **Completado (alcance acotado)**
  - Se validó el path canónico de lectura de `finished encounter detail` sin cambios de código productivo.
  - Se confirmó lectura encounter-centric estricta por `encounterId` y ausencia de fallback temporal/longitudinal como source of truth en este surface.
  - Se agregaron pruebas para proteger no-mezcla por misma fecha y aislamiento de paciente (ownership encounter → patient, fail-closed).

- **Evidencia de regresión mínima agregada**
  - `"does not mix clinical data when two encounters share the same date"`.
  - `"returns null encounter when encounter does not belong to route patient"`.

- **Límite explícito de cierre**
  - El cierre aplica solo a `finished encounter detail`; no implica cierre global del read model ni de deuda longitudinal/histórica.

---

## ✅ Closed sprint — In-progress continuity (2026-03)

- **T3 — Integrated flow validation** → **DONE**
  - Flujo validado en alcance acotado:
    - `planned -> start -> in-progress -> save -> reload/remount -> rehydrate`
    - `in-progress -> finalize -> finished -> patient detail source switch`
  - Continuidad encounter-centric sostenida por `encounterId` en surfaces validadas.

- **T4 — Negative guards (fallback/mixing)** → **DONE**
  - Guardas negativas para detectar regresión por fallback temporal/sibling y mezcla cross-encounter.

### Evidence

- Test integrado encounter-centric:
  - `app/patients/[id]/encounters/[encounterId]/__tests__/critical-flow.integration.test.ts`
- Guardas de regresión negativas:
  - `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts`
  - `app/patients/[id]/__tests__/data.test.ts`

### Open debt (post-sprint)

- Browser E2E validation.
- Full system continuity (beyond encounter-centric validated surfaces).
- Canonical read hardening for finished (global, fuera del detail acotado).
- Longitudinal/historical data consistency.
- Typed `ActionError.details`.

---

## 🟢 Sprint cerrado — Alineación episode-scoped en patient detail (2026-03)

- **Resultado alcanzado**
  - `patient detail` quedó alineado al episodio activo/renderizado, evitando mezcla de datos entre episodios en esta superficie.

- **Impacto arquitectónico**
  - Se consolida el criterio episode-scoped en lectura de `patient detail` y se refuerza el límite con las vistas longitudinales.

- **Deuda resuelta**
  - Selector híbrido en `patient detail`.
  - Cross-episode leakage en `patient detail`.

- **Deuda abierta (vigente)**
  - Los charts continúan apoyándose en datos longitudinales/mixtos (modelo separado por diseño).
  - La alineación cross-surface quedó cerrada luego por contrato explícito + tests (ver sprint 2026-04 más abajo).

---

## 🟢 Sprint cerrado — Alineación episode-scoped de encounter history (2026-03)

- **Resultado alcanzado**
  - Se confirmó y endureció que la membresía de `encounter history` es episode-scoped y proviene solo de `findAllByEpisodeOfCareId(activeEpisode.id)`.
  - Se explicitó la separación entre dataset encounter-centric (lista) y datasets longitudinales (charts: vitales/EVA/procedimientos) sin cambios de UX.

- **Impacto técnico**
  - Quedó formalizado el límite entre lectura de lista (encounter-based) y lectura longitudinal.
  - Se reforzó que las cards usan mapas strict por `encounterId` y que la navegación se mantiene encounterId-driven.

- **Qué deuda se resolvió**
  - Ambigüedad de frontera de datos en la ruta de history (lista vs charts).
  - Riesgo de leakage de fallback temporal hacia superficies encounter-centric dentro de la lista/cards.

- **Qué deuda queda abierta (explícita)**
  - Alineación cross-surface pendiente entre `patient detail` y `encounter history` como contrato explícito + blindaje de regresión.
  - Charts longitudinales continúan por diseño (decisión de modelo, no bug) y deben seguir documentados como tal.
  - Visibilidad parcial de planned encounters en history se mantiene como decisión UX (no issue de dataset).

---

## 🟢 Sprint cerrado — Contrato cross-surface explícito (`patient detail` ↔ `encounter history`) (2026-04)

- **Resultado alcanzado**
  - T1 confirmó que no había bug runtime en identidad/scoping/navegación.
  - T2 dejó explícito el contrato runtime:
    - selector de `patient detail`: `inProgressEncounter ?? lastFinishedEncounter`;
    - datasets clínicos de `patient detail` por el mismo `encounterId` seleccionado;
    - colección base de history por episodio activo;
    - distinción explícita entre colección base y colección visible;
    - ordering visible vigente de history: planned (si existe) → in-progress → previas.
  - T4 agregó cobertura de regresión para fijar este contrato.
  - T5 corrigió wording documental sin cambios de código productivo.

- **Impacto**
  - Cierre por contrato + tests + documentación.
  - Sin hardening productivo adicional en este sprint.

---


## ✅ Sprint cerrado / incidencia cerrada — Estabilización E2E seeded de finalize (2026-04)

- **Resultado alcanzado**
  - El escenario E2E seeded de finalize quedó validado y estable en alcance acotado.

- **Qué se corrigió**
  - En el helper/spec seeded se completaron campos hoy requeridos por la UI/validación (`Saturación oxígeno (%)` y `Temperatura corporal (°C)`), corrigiendo el falso negativo del test de finalize.
  - El segundo assert se alineó al contrato real vigente de `patient detail` para el seed usado (`Sin episodio activo` / `No hay visitas registradas en el episodio activo`), sin cambios en runtime productivo.
  - Se removió residuo temporal de debugging en UI (`Debug (temporal): serverResult`).

- **Evidencia**
  - `npm exec -- playwright test e2e/flows/encounter-finalize.seeded.spec.ts --workers=1 --headed` → **2 passed**.
  - Spec validado: `e2e/flows/encounter-finalize.seeded.spec.ts`.

- **Límite explícito**
  - Este cierre no implica validación global de continuidad clínica ni cambio del contrato arquitectónico de `patient detail`.
  - Aplica solo a la estabilización del escenario E2E seeded de finalize cubierto por ese spec.
  - No fue necesario modificar schema, domain rules, finalize action, seed loader base, EVA repo/mapper ni lógica clínica productiva.

---

## 🟡 Parcial / transición activa

### Track A — Lifecycle
- **L2 — Endurecer finalizeEncounterAction** → **Resuelto**
  - `finalizeEncounterAction` valida estado y exige `in-progress`.
  - Se elimina la suposición transicional de cierre directo `planned -> finished` para encounters ya planificados.

### Track C — UI/UX & Polish (estado post avances read encounter-centric)
- **(sin ID nuevo) Read encounter-centric en patient/encounter detail** → **Resuelto (alcance acotado + contrato explícito)**
  - ✅ Ya implementado:
    - separación más explícita encounter-centric vs longitudinal en `encounters/data.ts`;
    - hidratación de `encounterId` en lectura de vitales y EVA cuando FHIR trae referencia;
    - patient detail con una única fuente clínica (`inProgressEncounter ?? lastFinishedEncounter`) y datasets del mismo `encounterId`;
    - encounter detail con hidratación mínima encounter-centric también para `in-progress`.
  - 🔶 Límite vigente:
    - el cierre aplica a continuidad encounter-centric acotada (no a continuidad system-wide en todas las surfaces).

---

## 🔴 Deuda abierta (no cerrar)

### Debt transversal documentada
- **Canonical read de `finished`** → **Cerrado en alcance acotado (sin deuda runtime en este tema)**
  - `finished encounter detail` quedó validado y cerrado en alcance acotado.
  - `patient detail`, `encounter history` y charts mantienen roles distintos (summary/longitudinal) y no se consideran debt de canonical detail para este tópico.
  - Lo pendiente es mantener claridad contractual/documental cross-surface, no hardening productivo adicional en este alcance.
- **Deuda longitudinal/histórica** → **Deuda abierta**
  - El fallback temporal por fecha se mantiene como estrategia longitudinal; no debe reutilizarse como source-of-truth encounter-centric.
  - Persisten casos históricos sin `encounterId` que requieren manejo controlado.

## 🔴 Deuda abierta (post-sprint)

- **Alineación cross-surface episode-scoped (`patient detail` ↔ `encounter history`)** → **Cerrada (contrato + tests)**
  - Cerrada en contrato runtime explícito y tests de regresión.
  - No queda deuda de bug runtime en identidad/scoping/navegación para este alcance.

- **Modelo longitudinal de charts (decisión explícita)** → **Pendiente de documentación transversal**
  - Los charts permanecen longitudinales (fuera del contrato encounter-centric estricto de lista/detail).
  - Su composición puede incluir filtrado derivado del episodio activo en la route de history, sin convertirlos en source-of-truth de membresía de lista.

- **Visibilidad de planned encounters en history (decisión UX)** → **Pendiente**
  - La lista sigue mostrando subset en planned por decisión de UX.
  - No corresponde a problema de dataset ni de scoping.

- **Continuidad clínica de `in-progress` (scope global)** → **Pendiente (solo fuera del alcance acotado)**
  - La continuidad encounter-centric acotada ya está operativa (detalle editable + save/reload/remount/rehydrate + source switch post-finalize).
  - Lo pendiente corresponde a cobertura/garantías system-wide, no a bug runtime en el path acotado.

- **Duplicación de instantánea clínica parcial tras `finalize`** → **Deuda abierta**
  - Bug runtime real y distinto del cierre previo de submit/UX de `save-progress`, que ya quedó cerrado.
  - Los valores parciales guardados durante `in-progress` reaparecen luego de finalizar el mismo encounter como valores adicionales o coexistentes con la clínica final.
  - Afecta encounter detail y charts/history longitudinal, porque ambas surfaces terminan leyendo dos conjuntos de datos para lo que semánticamente debería ser una única visita.
  - La causa raíz no está cerrada todavía; la dirección esperable es investigar consolidación de snapshot/finalize y no asumir que el filtrado de lectura por sí solo resuelve el problema.

- **Canonical read hardening global de `finished` (más allá de detail)** → **Pendiente**
  - `finished encounter detail` ya quedó validado; sigue pendiente la cobertura/hardening global en surfaces restantes.

- **Datos históricos sin `encounterId`** → **Pendiente**
  - Continúan existiendo casos legacy sin linkage completo que requieren estrategia explícita para no contaminar surfaces encounter-centric.

- **Cobertura E2E browser-level del circuito completo** → **Pendiente**
  - Existen tests de integración livianos encounter-centric, pero no cobertura browser E2E del circuito completo.

- **Continuidad clínica full-system** → **Pendiente**
  - El cierre de continuidad aplica solo a encounter detail `in-progress`; no hay garantía de continuidad transversal en todas las surfaces.

- **Tipado de `ActionError.details` por capa** → **Pendiente**
  - `details` continúa transicional y sin tipado final por variante/capa.

- **Canonical read de `finished` (global, fuera de detail acotado)** → **Pendiente**
  - El cierre acotado de `finished encounter detail` no equivale a cierre global en todas las surfaces.

---

## 🚀 Siguiente fase (prioridad sugerida)

1. **Sprint — Endurecimiento de la instantánea clínica tras finalizar visita**
  - Prioridad inmediata para investigar y contener la duplicación de instantánea clínica parcial que aparece después de `finalize`.
  - Este sprint sustituye la propuesta anterior de alineación cross-surface como siguiente paso, porque el bug runtime nuevo es más específico y afecta también a encounter detail.
  - Alcance sugerido: diagnóstico de coexistencia parcial/final, definición del punto real de consolidación y hardening mínimo sin prometer una solución que aún no está cerrada.

## 🚀 Próximo sprint propuesto

### Sprint — Endurecimiento de la instantánea clínica tras finalizar visita

**Objetivo breve**
- Investigar y contener la duplicación de valores clínicos parciales que reaparecen después de finalizar el mismo encounter.
- Asegurar que la semántica de snapshot clínico siga siendo no acumulativa en `in-progress` y no genere coexistencia con la snapshot final.

**Scope inicial**
- diagnosticar si la duplicación nace en la escritura, en la consolidación al finalizar o en la lectura posterior;
- verificar el efecto en encounter detail y charts/history longitudinal;
- definir hardening mínimo sin asumir todavía si la corrección final vive en write o read path.

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

---

### Sprint cerrado — Cierre del submit de save-progress (2026-04-02)

- La incidencia de submit/UX de `save-progress` en el encounter detail editable quedó resuelta. Ver: `docs/sprints/Sprint — Save-progress submit lifecycle fix — 2026-04-02.md`.

- La observación de “todos los signos vitales obligatorios” no correspondía a una restricción real de validación; venía del submit anterior con redirect y no de schemas o domain rules.
