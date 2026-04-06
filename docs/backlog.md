# 📋 FHIR Flow — Backlog reordenado (post sprint register flow)

Fecha de actualización: 2026-04-06

## ✅ Cierre documental acotado — G3 (longitudinal/histórico vs encounter-centric) (2026-04-06)

- **Resultado** -> **evidencia G3 reforzada en alcance acotado**
  - Se reforzó evidencia en la frontera fallback-longitudinal vs encounter-centric usando test integrado cross-surface en `app/patients/[id]/__tests__/cross-surface.contract.test.ts`.
  - El perímetro auditado confirma coexistencia trazable `linked-by-encounter` / `derived-by-date` sin ambigüedad operacional.
  - **sin bug runtime nuevo verificable**.
  - **sin cambios productivos**.

- **Límite explícito**
  - Este cierre documental **no implica cierre global/system-wide**.
  - Este cierre documental **no sustituye G4**.
  - El fallback por fecha queda confinado a longitudinal/histórico solo en el perímetro auditado.

## ✅ Sprint cerrado — Auditoría bounded v2 de continuidad clínica transversal (2026-04-06)

- **Resultado** -> **cerrado por evidencia**
  - T1, T2 y T3 cerrados en alcance acotado.
  - **sin bug runtime nuevo verificable** en los invariants auditados.
  - El único invariant pendiente de T2 en encounter detail encounter-centric quedó **invariant refutado por evidencia existente**.
  - **no fue necesario T4**.
  - Sin cambios productivos.

- **Límite explícito**
  - Este cierre **no implica cierre global/system-wide**.
  - No se reabren practitioner consistency, ActionError fuera de encounter write, cobertura browser bounded ya cerrada ni longitudinal global por hipótesis.

## ✅ Sprint cerrado — Validación bounded de cobertura browser faltante en continuidad clínica (2026-04-06)

- **Resultado** -> **Cerrado (T4 documental aplicado)**
  - T1 y T2 cerrados en alcance acotado.
  - **cobertura browser bounded cerrada** en los dos huecos pendientes:
    1. coexistencia explícita `in-progress + finished` en `patient detail`;
    2. contraste post-finalize con dos outcomes contractuales válidos.
  - **sin bug runtime nuevo verificable**.
  - **no fue necesario abrir T3**.
  - **sin cambios productivos** (solo ajustes acotados en seed/spec/helper de spec).

- **Evidencia**
  - `npm run test:e2e -- e2e/flows/encounter-continuity.spec.ts` -> verde.
  - `npm run test:e2e -- e2e/flows/encounter-finalize.seeded.spec.ts` -> **3 passed**.

- **Límite explícito**
  - Este cierre **no implica cierre global/system-wide** de continuidad clínica.
  - No reabre practitioner consistency, ActionError fuera de encounter write, lifecycle ni longitudinal/histórico global.

## ✅ Sprint cerrado — Auditoría bounded de continuidad clínica transversal (2026-04-05)

- **Resultado** → **Cerrado por evidencia (sin cambios productivos)**
  - T1/T2 completados y T5 documental aplicado.
  - **sin bug runtime nuevo verificable** en la matriz bounded auditada.
  - El gap cross-surface `history <-> patient detail` quedó refutado/cerrado por evidencia existente.

- **Estado de gaps remanentes**
  - Persisten 2 **huecos de cobertura acotados**:
    1. browser de `patient detail` con coexistencia explícita `in-progress + finished`;
    2. contraste post-finalize con más de un seed válido.
  - Estos puntos **no requiere hardening inmediato** en este sprint.

- **Límite explícito**
  - Este cierre **no implica cierre global/system-wide** de continuidad clínica.
  - Este cierre **no implica cierre global/system-wide** del read longitudinal/histórico.
  - No se reabren practitioner consistency ni frentes cerrados previamente.

## ✅ Sprint cerrado — Hardening global del contrato longitudinal/histórico (fuera del cierre acotado) (2026-04)

- **Resultado** → **Cerrado por evidencia (sin cambios productivos)**
  - TG1 read-only ejecutado sobre surfaces objetivo de history/patient/cross-surface.
  - No se detectó bug runtime verificable fuera del closure acotado ya validado.
  - No se justificó pasar a TG2/TG3 en este sprint.
  - `app/patients/[id]/encounters/data.ts` se mantiene bounded-closed en su boundary local ya validado (sin reapertura).

- **Límite explícito**
  - La deuda longitudinal/histórica global/system-wide sigue abierta como categoría amplia.
  - Este cierre solo afirma que, en las surfaces auditadas por TG1, no se confirmó gap técnico nuevo verificable.
  - Hardening opcional/no bloqueante: evaluar más adelante un único caso cross-surface de legacy `derived-by-date` sin `encounterId` (no requerido para este cierre).

## ✅ Sprint cerrado — Hardening operativo del test stack + cierre acotado de 2 flujos browser E2E (2026-04)

- **HT1 — Hardening del test stack** → **Completado (alcance acotado)**
  - Vitest detecta `.test.ts` y `.test.tsx` en `__tests__`.
  - `package.json` expone scripts explícitos para Vitest.
  - `vitest.setup.ts` agrega bootstrap mínimo de entorno.
  - Resolución runtime de alias activa en Vitest.
  - Playwright mantiene `reuseExistingServer: false` para evitar acoplamiento con estado previo de servidor.
  - Seed loaders E2E con contrato más explícito y verificación mínima post-seed.

- **HT2 — Browser E2E finalize cross-surface (sin charts)** → **Completado (alcance acotado)**
  - Cobertura browser E2E disponible para finalize cross-surface con no-mezcla de datasets.

- **HT3 — Browser E2E start + save-progress + reload/rehydrate (sin finalize ni charts)** → **Completado (alcance acotado)**
  - Cobertura browser E2E disponible para continuidad del mismo encounter en reload/rehydrate.
  - El hardening incluyó dos fixes reales:
    - observabilidad/timing de save-progress antes del reload;
    - lectura encounter-scoped con `cache: "no-store"` para FC/EVA en repositorios usados por rehidratación.

- **Límite explícito del cierre**
  - Validado en alcance acotado para estos dos flujos browser E2E.
  - No implica cierre global system-wide de continuidad completa ni del read longitudinal/histórico.
  - Sin charts y sin reabrir deudas ya cerradas fuera de este alcance.

## 🧭 Taxonomía operativa (normalizada)
- **Cerrado real:** implementado y validado; no requiere seguimiento operativo.
- **Cerrado bounded:** cerrado en alcance acotado; **no reabrir sin evidencia nueva verificable**.
- **Cerrado por evidencia (sin cambios productivos):** cierre diagnóstico/documental válido para el perímetro auditado; **no equivale a cierre global**.
- **Abierto real:** brecha técnica vigente con impacto operativo.
- **Abierto nominal/documental:** drift o claridad documental pendiente, sin urgencia técnica runtime.
- **Histórico / no prioritario:** registro útil para contexto, fuera del foco de decisión inmediata.

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

- Browser E2E validation (global/system-wide, incluyendo longitudinal/histórico).
- Full system continuity (beyond encounter-centric validated surfaces).
- Canonical read hardening for finished (global, fuera del detail acotado).
- Longitudinal/historical data consistency.
- Typed `ActionError.details` fuera del frente encounter write (pendiente de extensión global).

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

## ✅ Sprint cerrado — Validación browser E2E del circuito clínico completo (alcance acotado) (2026-04)

- **Resultado alcanzado**
  - Se validó el loop browser integrado: `planned -> start -> save -> reload -> rehydrate -> finalize` en `e2e/flows/encounter-continuity.spec.ts`.
  - Ejecución final verificada: `npm run test:e2e -- e2e/flows/encounter-continuity.spec.ts` -> **2 passed**.

- **Diagnóstico de cierre**
  - No se detectó bug runtime clínico verificable en el flujo validado.
  - El ajuste final fue de expectativa de test en `patient detail` post-finalize.
  - Para este seed/estado, el contrato vigente compatible es empty-state (`Sin episodio activo` / `No hay visitas registradas en el episodio activo`), no necesariamente tarjeta `ÚLTIMA VISITA`.

- **Límite explícito**
  - Cierre acotado al spec/seed validados.
  - No implica cierre global/system-wide de continuidad clínica ni del read longitudinal/histórico.

---

## 🟡 Abierto real — transición activa acotada

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

## 🔴 Abierto real (no cerrar en T1)

### Frente técnico principal abierto
- **Deuda longitudinal/histórica** → **Abierto real**
  - El fallback temporal por fecha se mantiene como estrategia longitudinal; no debe reutilizarse como source-of-truth encounter-centric.
  - Avance acotado implementado en loader de history/charts: clasificación local de linkage (`linked-by-encounter` / `derived-by-date`) y guardas para evitar filtración a maps/cards encounter-centric.
  - Persisten casos históricos sin `encounterId`; quedan tolerados en longitudinal y siguen siendo deuda abierta a nivel global/system-wide.

## 🟡 Abierto nominal/documental (no urgente)

- **Modelo longitudinal de charts (decisión explícita)** → **Nominal/documental**
  - Pendiente de documentación transversal para evitar lecturas ambiguas.
  - No implica bug runtime nuevo ni urgencia de hardening en este sprint.

- **Visibilidad de planned encounters en history (decisión UX)** → **Nominal/documental**
  - La lista sigue mostrando subset en planned por decisión de UX.
  - No corresponde a problema de dataset ni de scoping.

## ✅ Cerrado bounded / por evidencia (no reabrir sin evidencia nueva)

- **Canonical read de `finished` en encounter detail** → **Cerrado bounded**
  - `finished encounter detail` quedó validado y cerrado en alcance acotado.
  - No equivale a cierre global en todas las surfaces.
  - **No reabrir sin evidencia nueva verificable**.

- **Alineación cross-surface episode-scoped (`patient detail` ↔ `encounter history`)** → **Cerrada (contrato + tests)**
  - Cerrada en contrato runtime explícito y tests de regresión.
  - No queda deuda de bug runtime en identidad/scoping/navegación para este alcance.
  - **No reabrir sin evidencia nueva verificable**.

- **Sprint cerrado / incidencia cerrada — Endurecimiento de la instantánea clínica tras finalizar visita (2026-04)** → **Cerrado bounded**
  - El bug runtime de duplicación post-finalize quedó cerrado con cleanup write-side en `finalize`.
  - La semántica de snapshot parcial de `save-progress` permanece intacta y no se modifica en este cierre.
  - La protección de regresión ahora cubre finalize write-path, encounter detail loader y longitudinal loader.
  - No se declara cerrada la deuda global longitudinal/histórica fuera del encounter afectado.

- **Cobertura E2E browser-level del circuito completo (alcance acotado)** → **Cerrada (este sprint)**
  - El cierre aplica al loop integrado validado en `e2e/flows/encounter-continuity.spec.ts`.
  - No se extrapola a cobertura browser global/system-wide.
  - **No reabrir sin evidencia nueva verificable**.

- **Cobertura browser bounded faltante en continuidad clínica (T1/T2/T4)** → **Cerrada bounded**
  - Quedó cerrada en los dos huecos definidos del sprint bounded.
  - **No reabrir sin evidencia nueva verificable**.

- **Practitioner consistency en encounter write** → **Cerrado bounded**
  - Cerrado en el frente encounter write del sprint correspondiente.
  - **No reabrir sin evidencia nueva verificable**.

- **Tipado de `ActionError.details` por capa (fuera de encounter write)** → **Cierre por evidencia diagnóstica/documental (nominal)**
  - En el estado real del repo no hay perímetro operativo actual fuera de encounter write con deuda real de implementación confirmada.
  - Resultado fase 3: cierre por evidencia diagnóstica/documental (drift nominal), sin reapertura de encounter write y sin sobredeclarar cierre global.
  - **No tratar como urgencia técnica salvo evidencia nueva de perímetro operativo**.

## 🔴 Abierto real (pendiente post-sprint)

- **Canonical read hardening global de `finished` (más allá de detail)** → **Abierto real**
  - `finished encounter detail` ya quedó validado; sigue pendiente la cobertura/hardening global en surfaces restantes.

- **Datos históricos sin `encounterId`** → **Abierto real**
  - Continúan existiendo casos legacy sin linkage completo que requieren estrategia explícita para no contaminar surfaces encounter-centric.

- **Continuidad clínica full-system** → **Abierto real**
  - El cierre de continuidad aplica solo a encounter detail `in-progress`; no hay garantía de continuidad transversal en todas las surfaces.

- **Continuidad clínica de `in-progress` (scope global)** → **Abierto real (scope global)**
  - La continuidad encounter-centric acotada ya está operativa (detalle editable + save/reload/remount/rehydrate + source switch post-finalize).
  - Lo pendiente corresponde a cobertura/garantías system-wide, no a bug runtime en el path acotado.

### T2 — Perímetro global de continuidad clínica system-wide (definición verificable)

- **Estado** → **Abierto real (delimitado)**
- **Objetivo operativo**: delimitar el frente global para ejecución posterior, sin reabrir cierres bounded.

#### Surfaces incluidas (perímetro global)
1. `patient detail` (selector clínico y datasets del encounter fuente).
2. `encounter detail` (`in-progress` y `finished`, lectura por `encounterId` + continuidad de edición donde aplique).
3. `encounter history` (colección por episodio activo, navegación por `encounterId` y límites con charts).
4. Superficies longitudinales/históricas de la ruta de history (charts y composición con fallback temporal controlado).
5. Browser continuity/finalize en alcance **system-wide** solo como evidencia de contrato cross-surface (sin reabrir specs bounded ya cerradas).

#### Invariants globales de cierre (qué debe validar este frente)
1. **No-mezcla cross-encounter** en surfaces encounter-centric (`patient detail`, `encounter detail`, cards/lista history).
2. **No-mezcla cross-patient** (ownership/route consistency fail-closed).
3. **Source-of-truth correcto por surface**:
   - encounter-centric por `encounterId` donde corresponda;
   - fallback temporal solo en longitudinal/histórico.
4. **Continuidad clínica verificable** en ciclo `save -> reload/remount -> rehydrate -> finalize` en superficies incluidas.
5. **Consistencia cross-surface** entre selector/fuente de `patient detail`, navegación de history y detalle encounter.
6. **Tratamiento explícito de legacy sin `encounterId`**:
   - permitido en longitudinal bajo policy controlada;
   - prohibido como source-of-truth encounter-centric.

#### No alcance explícito (fuera de este frente global)
- Reabrir practitioner consistency en encounter write.
- Tratar `ActionError` fuera de encounter write como urgencia técnica.
- Reabrir canonical read bounded de `finished encounter detail`.
- Reabrir cobertura browser bounded ya cerrada.
- Refactors UI/UX de polish visual sin impacto en invariants de continuidad.

#### Criterio de cierre verificable (mínimo exigido)
- **Matriz obligatoria** `surface × invariant × evidencia` con estado por fila (`verde/ámbar/rojo`) y enlace a prueba/documento.
- **Evidencia mínima por surface incluida**:
  - al menos una prueba integrada o E2E que cubra no-mezcla + source-of-truth;
  - al menos una guarda negativa donde aplique (mixing/fallback indebido/ownership).
- **Límite interpretativo explícito**:
  - verde en un subset bounded **no** permite inferir cierre global;
  - cierre global solo se declara cuando la matriz completa no deja filas críticas sin evidencia.

### T3 — Subtickets accionables del frente global (único frente, ejecución por fases)

- **Estado** → **Parcialmente ejecutado (G1 cerrado por evidencia; G2 con cierre documental acotado del hueco principal de evidencia browser; G3/G4 abiertos)**.
- **Criterio de agrupación**: prioridad por criticidad de invariant + dependencia entre surfaces (primero encounter-centric/cross-surface, luego longitudinal, luego legacy).

#### Orden sugerido de ejecución
1. **G1 — Invariants críticos encounter-centric/cross-surface** ✅
2. **G2 — Continuidad browser system-wide de superficies incluidas**
3. **G3 — Longitudinal/histórico: límites de fallback y consistencia con encounter-centric**
4. **G4 — Legacy sin `encounterId`: policy verificable y guardrails finales**

#### Subtickets (ejecutables)

**G1 — Invariants críticos encounter-centric/cross-surface**
- **Estado**: **cerrado por evidencia (alcance G1 / acotado)**.
- **Resultado**:
  - matriz `surface × invariant × evidencia × estado` cerrada para `patient detail`, `encounter detail` y `encounter history` (contrato observable);
  - **sin bug runtime nuevo verificable**;
  - los 2 ámbar de T1 (invariant 2 en `patient detail` y `encounter history`) pasaron a verde en T2 por evidencia negativa explícita;
  - T3/T4 absorbidos por evidencia suficiente para el alcance G1;
  - **sin cambios productivos**.
- **Límite explícito**:
  - **no implica cierre global/system-wide**;
  - **no sustituye G2/G3/G4**;
  - no reabre canonical read bounded de `finished detail` ni practitioner/write closures.

**G2 — Continuidad browser system-wide (sin reabrir bounded)**
- **Estado**: **parcial (cierre documental acotado del hueco principal de evidencia browser de G2)**.
- **Objetivo**: verificar continuidad clínica global en ciclo `save -> reload/remount -> rehydrate -> finalize` atravesando las surfaces del perímetro T2 donde aplica.
- **Evidencia nueva incorporada (alcance acotado)**:
  - corrida verde de `e2e/flows/encounter-cross-surface-no-mix.spec.ts` para el loop `save -> reload/remount -> rehydrate -> patient detail -> finalize -> history -> return detail`;
  - **cobertura browser G2 validada en alcance acotado** para el hueco principal de evidencia;
  - **sin bug runtime nuevo verificable**;
  - **sin cambios productivos de app runtime** (fix mínimo de readiness en seed loader E2E).
- **Límite explícito**:
  - **no implica cierre global/system-wide** del frente G2;
  - **no sustituye G3/G4**;
  - no duplicar ni reabrir specs bounded ya cerrados; solo cubrir brechas globales faltantes.

**G3 — Longitudinal/histórico (consistencia y frontera de fallback)**
- **Objetivo**: validar que fallback temporal quede confinado a longitudinal/histórico y no contamine surfaces encounter-centric.
- **Scope**: route de history/charts + frontera explícita con datasets encounter-centric.
- **Evidencia esperada**: guardas negativas de no-filtración + filas de matriz en verde para invariant 3 (frontera de source-of-truth) e invariant 5 (consistencia cross-surface).
- **Límite explícito**: no refactor UI/UX de charts ni rediseño de modelo longitudinal en esta fase.

**G4 — Legacy sin `encounterId` (policy operativa verificable)**
- **Objetivo**: dejar criterio ejecutable para casos legacy sin linkage completo, permitidos en longitudinal bajo policy controlada y excluidos como source-of-truth encounter-centric.
- **Scope**: reglas de aceptación/rechazo por surface + evidencias de no contaminación en encounter-centric.
- **Evidencia esperada**: filas de matriz en verde para invariant 6 + pruebas/fixtures de casos legacy representativos.
- **Límite explícito**: no implica backfill masivo ni cierre global automático del frente longitudinal/histórico.

#### Fuera de alcance de T3 (explícito)
- practitioner consistency en encounter write;
- `ActionError` fuera de encounter write como urgencia técnica;
- refactors UI/UX de polish;
- bounded closures ya cerrados (canonical read bounded, cobertura browser bounded, etc.).

## 📚 Histórico / no prioritario

- **Canonical read de `finished` (global, fuera de detail acotado)** → **Histórico (duplicado de frente abierto global)**
  - Se mantiene solo como traza histórica para evitar duplicar frentes abiertos en el plano operativo.

---

## 🚀 Estado de cierre acotado + siguiente fase

1. **Sprint cerrado (alcance acotado) — Hardening del read global (encounter-centric vs longitudinal/histórico)**
  - Estado actual verificado: T1/T2/T3/T4/T5 cerrados en alcance acotado.
  - Referencia: `docs/sprints/Sprint propuesto — Hardening del read global encounter-centric vs longitudinal-historico — 2026-04-04.md`.
  - Límite explícito: no implica cierre global/system-wide del read longitudinal/histórico ni reapertura de otros tracks.
2. **Deuda longitudinal/histórica global abierta (system-wide)**
  - Permanece abierta fuera del alcance acotado ya cerrado del sprint de hardening read-global.
3. **Practitioner consistency en encounter write (cerrado)**
  - Cierre alcanzado en el frente encounter write para `createEncounterAction`, `saveEncounterProgressAction`, `finalizeEncounterAction` y `registerEncounterAction`.
  - Regla consolidada en ese alcance: practitioner resuelto server-side y transportado por write input (`performerId`, `practitionerName`) hasta repository/mapper.
  - `startEncounterAction` queda documentado como exención explícita del sprint (transición de estado sobre encounter ya atribuido), no como gap abierto.
  - No implica rediseño global de identity ni soporte multi-practitioner.

### T5 — Handoff operativo al próximo sprint técnico (recomendación principal)

- **Siguiente sprint técnico recomendado (primero en abrir):** `G2 — Continuidad browser system-wide de superficies incluidas`.
- **Objetivo:** continuar el frente global con G2/G3/G4, manteniendo G1 cerrado por evidencia en alcance acotado.
- **No alcance:** reapertura de G1 sin evidencia nueva verificable.

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
