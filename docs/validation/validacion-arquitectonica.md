# Validación Arquitectónica Vigente (estado real)

Este documento describe el estado real del sistema en relación a la arquitectura definida en los documentos de autoridad. No introduce nuevas reglas.

## Rol del documento

Este documento ofrece una validación honesta del estado real de la arquitectura: distingue lo válido hoy, lo transicional y la deuda conocida sin presentar el estado actual como cierre definitivo.
No redefine autoridad ni crea frentes paralelos: cuando un frente ya está unificado operativamente en backlog (p. ej. continuidad system-wide), aquí se reporta su estado con el mismo límite de alcance.

Fecha: 2026-04-07

Este documento reemplaza el enfoque de "aprobado total" por una validación honesta del estado actual.

## Autoridad utilizada

- `.github/instructions/copilot.instructions.md`
- `docs/write-phase-architecture.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` (archivo ADR vigente en el repositorio)

## Convenciones de estado

- **Válido hoy**: implementado y alineado con arquitectura.
- **Parcialmente válido**: dirección correcta, implementación incompleta o con transición activa.
- **Deuda conocida**: brecha reconocida entre modelo objetivo y comportamiento actual.
- **Pendiente ADR / tickets siguientes**: decisión ya definida por ADR pero aún no operativa.

## Cierre final del frente global (2026-04-06)

Veredicto del sprint final de auditoría: **deuda global longitudinal/histórico + legacy sin `encounterId` + continuidad cross-surface en el perímetro solicitado = cerrada**.

Resultado del diagnóstico:

- **Hueco runtime real:** no se detectó uno nuevo verificable dentro de las surfaces auditadas.
- **Hueco documental:** se mantiene solo el deber de declarar explícitamente límites de policy (fallback por fecha solo longitudinal/history; nunca source-of-truth encounter-centric).
- **Hardening productivo adicional:** no requerido para declarar cierre del frente en este alcance.

## Matriz de validación vigente

| Tema | Estado | Diagnóstico actual | Evidencia de autoridad | Acción siguiente |
|---|---|---|---|---|
| Hexagonal boundaries | **Válido hoy** | El dominio no debe depender de FHIR; FHIR permanece fuera del boundary de dominio. | Reglas no negociables en copilot instructions + write flow oficial. | Mantener enforcement en revisiones y tests de arquitectura. |
| Validation layers | **Parcialmente válido** | La separación por capas está bien definida (Form Zod, Domain Rules, Inverse Mapper, FHIR Client), pero requiere enforcement sostenido en implementación. | Secciones de Validation Architecture en ambos docs base. | Mantener checklist por PR y evitar mover reglas clínicas a schema/mapper. |
| ActionResult / ActionError | **Parcialmente válido (fase 2 cerrada en encounter write)** | `ActionResult` se mantiene como contrato estable; helper central de `ActionError` operativo; `fhir.details` quedó tipado/normalizado en el frente encounter write incluido en el sprint. | ADR + write-phase + sprint fase 2; implementación y tests de encounter write alineados. | Extender cierre solo cuando se adopte en otros frentes, sin romper contrato estable. |
| Inverse mapper purity | **Parcialmente válido** | Regla arquitectónica es clara: mapper puro, sin resolver identidad ni reglas de negocio. Persisten riesgos de drift cuando la resolución de contexto no entra por input. | copilot instructions + ADR (responsabilidad de practitioner en Server Action). | Verificar por flujo que mapper solo transforme input validado y no lea config. |
| Practitioner resolution (encounter write front) | **Válido hoy (alcance acotado)** | En encounter write, los flujos attribution-driven (`createEncounterAction`, `saveEncounterProgressAction`, `finalizeEncounterAction`, `registerEncounterAction`) resuelven practitioner server-side y lo propagan por write input hacia repository/mapper. `startEncounterAction` queda como exención explícita del sprint por ser transición de estado sobre encounter ya atribuido. | ADR sección de practitioner responsibility + write-phase + sprint practitioner consistency (T1–T5). | Mantener cobertura de regresión en ese frente sin extrapolar a rediseño global de identity. |
| Register flow (`/encounters/register`) | **Válido hoy** | La separación de entry points está operativa: `/encounters/new` planifica y `/encounters/register` registra con `registerEncounterAction` y `completionMode` explícito (`start`/`complete`). | Estado de app layer + write-phase actualizado. | Mantener consistencia documental y evitar regresión semántica entre rutas. |
| Register entry flow (`/encounters/register`) | **Parcialmente válido (fricción de continuidad register→detail detectada)** | El gate inicial ya fue eliminado y el usuario entra directo al formulario con intención explícita en submit (`Guardar progreso`/`Finalizar visita`). La auditoría runtime 2026-04-08 confirma que el redirect post-`Guardar progreso` a detail es correcto encounter-centric, pero deja fricción UX/semántica por superposición parcial register/detail (timing + nota + acciones) y framing temprano de “Finalizar visita” en el surface `in-progress`. | ADR-001 + write-phase + checkpoint app-layer + sprint UX 2026-04-07 + sprint entry-flow 2026-04-08 + sprint audit continuidad 2026-04-08. | Ejecutar reparación mínima de continuidad UX/composición sin reabrir lifecycle ni practitioner model. |
| Register UX/semántica (surface de formulario) | **Parcialmente válido (refinamiento UX pendiente, sin brecha arquitectónica)** | El surface `register` está operativo y consistente con lifecycle, pero conserva señales semánticas mejorables (etiqueta "real" en fecha/horas, bloque "Profesional" visible sin aportar decisión, affordance de nota clínica siempre expandida y necesidad de reforzar en UI que no corresponde registrar visitas futuras desde register). | ADR-001 + ADR-003 + write-phase + checkpoint app architecture + sprint UX documental 2026-04-07. | Ejecutar sprint UX acotado del formulario sin alterar arquitectura ni reglas de cierre clínico. |
| Save progress separado | **Válido hoy** | `saveEncounterProgressAction` existe como operación propia con snapshot transaccional y ownership metadata interoperable para recursos clínicos gestionados por esta app. | write-phase + código de acciones/rules/repositorio. | Mantener hardening de validaciones por estado y ownership. |
| Lifecycle transition (`planned -> in-progress`) | **Válido hoy** | `startEncounterAction` ya está operativo para encounters planificados y la finalización exige `in-progress`. | Reglas de estado en actions/domain + write-phase actualizado. | Mantener hardening de regresiones y tests de estado. |
| Canonical read (finished detail) | **Validado (alcance acotado)** | El path `finished encounter detail` quedó validado como lectura canónica encounter-centric por `encounterId`, sin fallback temporal como source of truth en ese surface. El hardening global de read model fuera de ese alcance permanece abierto. | ADR + write-phase + backlog vigente + validación específica del sprint 2026-03 (auditoría + tests). | Sostener cobertura de regresión en `finished detail` y mantener explícita la deuda global fuera de este surface. |
| Canonical read hardening global de `finished` (más allá de detail) | **Cierre documental acotado (hardening mínimo de señalización canónica)** | Se cerró este ticket en alcance documental con hardening mínimo correcto fuera de detail: `patient detail` refuerza navegación al detail canónico del `lastEncounter` y `encounter history` se mantiene como resumen/navegación secundaria. Resultado: **sin bug runtime nuevo verificable**, **sin refactor general** y **sin reapertura** del closure bounded de `finished encounter detail`. | Sprint `sprint-canonical-read-finished-global-audit-2026-04-06.md` + fix mínimo ya aplicado en `LastEncounterSection` + tests de render del CTA canónico. | Mantener límite explícito: **no implica cierre global/system-wide**, **no reabre G1–G4** y no sustituye la deuda longitudinal/histórica global. |
| Encounter-centric vs longitudinal read split | **Válido hoy (frente global auditado cerrado)** | Separación operativa verificable: patient/encounter detail se mantienen encounter-centric por `encounterId`; fallback por fecha queda confinado al dominio longitudinal/history bajo policy explícita de legacy sin `encounterId`. | Loader `encounters/data.ts` + tests route-level (`encounters/__tests__/data.test.ts`, `cross-surface.contract.test.ts`) + auditorías G3/G4. | Mantener regresión en tests y no relajar guardrails de policy. |
| Clinical linkage (`encounterId`) in read mappers | **Parcialmente válido** | Vital signs y EVA ya hidratan `encounterId` cuando `Observation.encounter.reference` existe (incluyendo casos ausente/relativo/absoluto). Mejora coherencia encounter-centric pero no elimina deuda histórica sin referencia. | Mappers/schemas de lectura y tests endurecidos recientes. | Mantener fallback longitudinal controlado para históricos sin linkage y evaluar backfill futuro. |
| In-progress continuity (bounded scope) | **validado (alcance acotado)** | Quedó validado en alcance acotado el circuito encounter-centric para surfaces auditadas: encounter detail por `encounterId` + source selection de patient detail (`inProgressEncounter ?? lastFinishedEncounter`). | Tests integrados del flujo crítico + guardas negativas de fallback/mezcla en `encounter detail` y `patient detail`. | Mantener alcance explícito: no implica continuidad global del sistema, ni cierre longitudinal/charts, ni hardening canónico global de finished. |
| Test stack hardening (Vitest/Playwright/E2E loaders) | **Válido hoy (operativo, alcance acotado)** | El stack quedó más estable operativamente para ejecución local/CI: discovery Vitest en `__tests__`, scripts explícitos, bootstrap mínimo, alias runtime, Playwright sin reutilizar servidor y seed loaders con contrato explícito + verificación mínima. | Configuración de test runner + scripts + setup + loaders E2E vigentes en repositorio. | Mantener hardening incremental sin declarar cierre arquitectónico global. |
| Browser E2E continuity/finalize (sin charts) | **validado (alcance acotado, sprint cerrado)** | Hay cobertura browser útil en dos flujos: finalize cross-surface/no-mix y loop integrado `planned -> start -> save -> reload -> rehydrate -> finalize` en continuity. Para el seed validado en continuity, el post-finalize de `patient detail` es compatible con contrato vigente de empty-state (`Sin episodio activo` / `No hay visitas registradas en el episodio activo`), sin bug runtime clínico verificable. | Specs browser E2E estabilizados + corrida final `npm run test:e2e -- e2e/flows/encounter-continuity.spec.ts` (2 passed). | Mantener wording acotado: no implica cierre total system-wide ni del read longitudinal/histórico. |
| Cobertura browser bounded faltante en continuidad clínica (T1/T2/T4) | **cerrado (alcance acotado)** | Sprint cerrado con **cobertura browser bounded cerrada** en 2 huecos: coexistencia explícita `in-progress + finished` en `patient detail` y contraste post-finalize con dos outcomes contractuales válidos. Resultado con **sin bug runtime nuevo verificable**, **no fue necesario abrir T3** y **sin cambios productivos** (solo ajustes acotados en seed/spec/helper de spec). | Corridas verificadas: `npm run test:e2e -- e2e/flows/encounter-continuity.spec.ts` (verde) + `npm run test:e2e -- e2e/flows/encounter-finalize.seeded.spec.ts` (3 passed). | Mantener límite explícito: **no implica cierre global/system-wide** de continuidad clínica ni del read longitudinal/histórico. |
| Auditoría bounded v2 de continuidad clínica transversal (T1/T2/T3) | **cerrado por evidencia (alcance acotado)** | Sprint cerrado con **sin bug runtime nuevo verificable** en los invariants auditados. El único invariant parcialmente cubierto al cierre de T2 (encounter detail encounter-centric) quedó **invariant refutado por evidencia existente** en test-level del propio front encounter detail. **no fue necesario T4** y no hubo cambios productivos. | Evidencia principal: `app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts` + corrida `npm run test -- app/patients/[id]/encounters/[encounterId]/__tests__/data.test.ts` (verde). | Mantener límite explícito: **no implica cierre global/system-wide** ni reapertura de practitioner, ActionError fuera de encounter write, cobertura browser bounded cerrada o longitudinal global por hipótesis. |
| Auditoría bounded de continuidad clínica transversal (T1/T2/T5) | **cerrado por evidencia (alcance acotado)** | Cierre documental del sprint con **sin bug runtime nuevo verificable** en la matriz bounded auditada. Gap cross-surface `history <-> patient detail` refutado por evidencia existente. Permanecen 2 **huecos de cobertura acotados** (coexistencia browser `in-progress + finished` en patient detail, y contraste post-finalize con más de un seed), que **no requiere hardening inmediato**. | Sprint `sprint-continuidad-clinica-full-system.md` + evidencia ya existente en tests integrados/E2E y cierres previos. | Mantener seguimiento acotado de cobertura pendiente sin abrir T3/T4, y sin extrapolar a cierre global. |
| Sprint técnico G1 — invariants encounter-centric/cross-surface (T1+T2+T5) | **cerrado por evidencia (alcance G1 / acotado)** | G1 quedó cerrado por evidencia en `patient detail`, `encounter detail` y `encounter history` (contrato observable), con **sin bug runtime nuevo verificable** y **sin cambios productivos**. Los 2 ámbar de T1 (ownership/cross-patient en patient detail/history) pasaron a verde en T2 por evidencia negativa explícita; T3/T4 quedaron absorbidos por evidencia suficiente para el alcance G1. | `docs/sprints/sprint-tecnico-g1-invariants.md` + `docs/sprints/g1-t1-matriz-auditoria-2026-04-06.md` + `docs/sprints/g1-t2-hardening-evidence-2026-04-06.md` + tests route-level en `app/patients/[id]/__tests__/data.test.ts` y `app/patients/[id]/encounters/__tests__/data.test.ts`. | Mantener límite explícito: **no implica cierre global/system-wide**, **no sustituye G2/G3/G4** y **no reabre bounded closures previas**. |
| G2 — evidencia browser cross-surface del perímetro auditado | **Validado por evidencia existente** | El roundtrip browser `encounter detail -> patient detail -> history -> encounter detail` quedó cubierto en el spec dedicado de no-mezcla/continuidad, suficiente para cierre del frente en el alcance pedido. | `e2e/flows/encounter-cross-surface-no-mix.spec.ts` + evidencia de sprint G2 documentada. | Mantener la spec vigente; si falla en CI/local, tratar primero como issue de harness/seed antes de inferir bug clínico. |
| G3 — fallback longitudinal/histórico vs encounter-centric (frontera auditada) | **Cerrado por evidencia** | Coexistencia `linked-by-encounter` / `derived-by-date` validada en longitudinal, con prohibición efectiva de contaminar source-of-truth encounter-centric en patient/detail/maps. | `cross-surface.contract.test.ts` + `encounters/data.ts` + `encounters/__tests__/data.test.ts`. | Mantener policy y guardas negativas. |
| G4 — legacy sin `encounterId` (policy mínima + guardrail puntual) | **Cerrado por evidencia** | Policy operativa verificable aplicada: legacy sin `encounterId` solo en longitudinal/history; registros con `encounterId` externo no entran por fallback de fecha; prohibido como source encounter-centric. | `resolveLongitudinalLinkageOrigin` en `encounters/data.ts` + tests de regresión en `encounters/__tests__/data.test.ts`. | Mantener sin migración/backfill forzado mientras no exista requerimiento nuevo. |
| Patient detail — refinamiento UX/jerarquía operativa | **Válido hoy (estabilizado, no cierre definitivo)** | En el refinamiento reciente, `patient detail` quedó más claro para operación diaria: mejor jerarquía de información, CTA principal por estado, acciones secundarias subordinadas y contacto del paciente como acceso expandible secundario. Se redujo redundancia visual y se recuperó contexto mínimo de “visita relevante” sin volver a competir con detail/history. No se detecta problema arquitectónico nuevo en este ajuste. | Estado actual del front `patient detail` + consistencia con límites encounter-centric ya validados en backlog y matriz vigente. | Mantener el frente pausado/estabilizado (fuera de foco inmediato); `episode detail` queda como evolución posible posterior, no como deuda urgente activa. |
| Auditoría TG1 read-only (hardening global longitudinal/histórico fuera del cierre acotado) | **validado (sin gap técnico verificable en surfaces auditadas)** | La auditoría TG1 read-only no encontró brecha técnica verificable en history loader auditado, patient detail loader ni contrato cross-surface ya cubierto. Se confirma cierre por evidencia sin cambios productivos y sin pasar a TG2/TG3. | Matriz de auditoría TG1 sobre tests objetivo (`encounters/__tests__/data.test.ts`, `[id]/__tests__/data.test.ts`, `cross-surface.contract.test.ts`) + guardrails del sprint. | Mantener prudencia global: no sobredeclarar cierre system-wide; mantener `encounters/data.ts` bounded-closed en su boundary local salvo regresión nueva verificable. |
| Cierre documental final del frente global longitudinal/histórico + legacy sin `encounterId` + continuidad system-wide | **cerrado por evidencia (ensamblado global, sin fix productivo nuevo)** | Con inventario/matriz global y clasificación final de remanentes, no se identificaron gaps técnicos críticos: las celdas parciales/sin evidencia fueron de ensamblado documental y no de brecha funcional verificable. Se considera suficiente la evidencia existente por surface según aplicabilidad de invariants; no se exige browser adicional cuando integration/unit ya cubre T2. | Backlog operativo actualizado + evidencias ya vigentes de G1/G2/G3/G4/TG1 en tests unitarios/integrados/E2E acotados. | Mantener límites explícitos: charts/history longitudinal **no** son surfaces encounter-centric; la mezcla longitudinal permitida queda confinada y no contamina `patient detail` / `encounter detail`; cualquier reapertura requiere evidencia nueva verificable. |
| Documentation drift | **Parcialmente válido** | Documentación alinea dirección, pero hubo deriva de tono (“todo aprobado”) y riesgo de leer transición como estado final. | Diferencia entre validación previa y lenguaje explícito de ADR/write-phase. | Mantener este documento como checklist vivo y actualizar por fase/ticket real. |

## Revisión explícita por tema solicitado

### 1. Hexagonal boundaries

**Estado:** Válido hoy

El principio se mantiene: el dominio no debe importar tipos/recursos FHIR y la traducción a FHIR pertenece al borde de infraestructura (mappers + client). Esto sigue siendo correcto y vigente.

### 2. Validation layers

**Estado:** Parcialmente válido

La arquitectura de validación está correctamente estratificada y definida. Lo pendiente no es de diseño, sino de disciplina de implementación: evitar overlap (por ejemplo, reglas clínicas en schema o mapper) y sostener validaciones en la secuencia obligatoria de Server Action.

### 3. ActionResult / ActionError

**Estado:** Parcialmente válido (fase 2 cerrada en encounter write)

`ActionResult` permanece como contrato estable de Server Action y los campos top-level (`layer/message/code`) se sostienen estables. En encounter write, `ActionError` quedó endurecido con helper central y `fhir.details` tipado/normalizado. Este cierre no debe sobredeclararse como cierre global fuera de ese frente.

Actualización diagnóstica fase 3 (2026-04-05): en el estado actual del repo se verificó **sin perímetro operativo actual fuera de encounter write** para extender adopción en implementación, con **sin deuda real de implementación confirmada** fuera de ese frente. El remanente vigente se clasifica como **drift documental / deuda nominal**, con **cierre por evidencia diagnóstica/documental** en esta fase; **no implica reapertura de encounter write** ni cierre global eterno del tema.

Revalidación diagnóstica (2026-04-06): el inventario actual de Server Actions (`"use server"`) sigue acotado al frente `app/patients/[id]/encounters/**`; no se encontró consumer runtime real fuera de encounter write que haga branching/parseo de `error.details` (incluyendo `fieldErrors`, `formErrors`, `OperationOutcome` o `issue[]`). Con evidencia vigente, se mantiene **veredicto documental/nominal** y no corresponde abrir implementación por simetría.

### 4. Inverse mapper purity

**Estado:** Parcialmente válido

La pureza del inverse mapper está definida como regla no negociable. La deuda aparece cuando el contexto requerido por mapeo no entra de forma explícita por write input en todos los flujos.

### 5. Practitioner resolution

**Estado:** Válido hoy (alcance encounter write)

La responsabilidad quedó correctamente asignada por ADR en el frente encounter write: resolver practitioner en Server Action y pasar contexto al repositorio/mapper por input. Fuera de ese frente no hay perímetro operativo nuevo que justifique abrir deuda técnica urgente en este documento; se mantiene como guardrail de alcance.

### 6. Register flow separado (`/encounters/register`)

**Estado:** Válido hoy

La separación de entry points está implementada: `/encounters/new` planifica y `/encounters/register` registra visita. El register flow usa `registerEncounterAction` con `completionMode` explícito (`start`/`complete`) y validación server-side de EpisodeOfCare.

### 6.1 Save progress separado

**Estado:** Válido hoy

`saveEncounterProgressAction` existe como operación separada para encuentros en `in-progress`, con persistencia transaccional de snapshot clínico y metadata de ownership para interoperabilidad de recursos gestionados por esta app.

### 6.2 Register UX/semántica del formulario (refinamiento acotado)

**Estado:** Parcialmente válido (documentado para sprint UX, sin cambio arquitectónico)

Se identifica un frente UX puntual en `/encounters/register` que no modifica arquitectura ni lifecycle:

- revisar si "real" sigue aportando claridad en campos de fecha/hora de inicio/hora de fin;
- evaluar si el bloque "Profesional" visible aporta valor operativo o agrega ruido;
- reforzar semántica de producto: register no corresponde a visitas futuras (esas pertenecen a planning);
- permitir entrada progresiva de nota clínica vía bloque colapsable/expandible, sin relajar la regla vigente de nota requerida cuando la intención es completar/finalizar.

Este frente queda explicitado como sprint UX/documental acotado (`docs/sprints/sprint-ux-register-form-acotado-2026-04-07.md`) y no reabre decisiones cerradas de ADR-001/ADR-003 ni separación planning/register.


### 6.3 Register entry flow unificado + continuidad post-primer submit

**Estado:** Parcialmente válido (entry unificado implementado; continuidad UX acotada pendiente)

Diagnóstico funcional actualizado:

- `/encounters/register` ya opera con entrada directa al formulario clínico y decisión explícita en submit (`Guardar progreso` / `Finalizar visita`).
- En runtime, al usar `Guardar progreso` el flujo crea encounter en `in-progress`, redirige a `/encounters/[encounterId]` y continúa en `FinalizeEncounterForm`.
- Ese salto mantiene coherencia arquitectónica encounter-centric, pero introduce fricción de continuidad: superposición parcial de campos base (fecha/hora/nota) y cambio de framing a “Finalizar visita” demasiado temprano para un estado todavía editable.

Evaluación de alternativas:

- **A. Mantener surfaces actuales + reparar continuidad UX (copy/framing/composición):** mejor opción mínima hoy; conserva arquitectura y elimina la fricción principal percibida.
- **B. Reducir register al mínimo de alta en curso:** viable si se busca bajar aún más superposición con detail.
- **C. Entrada directa + creación inmediata al entrar:** desaconsejado por alta probabilidad de crear encounters vacíos, mayor ruido operativo y complejidad de limpieza/cancelación sin valor clínico equivalente.

Recomendación vigente: **A** como reparación mínima correcta, manteniendo separación planning/register y contratos write actuales.

Impacto esperado sobre operaciones:

1. `registerEncounterAction`: mantiene semántica actual del primer submit (`start` crea `in-progress`; `complete` crea `finished`).
2. `saveEncounterProgressAction`: mantiene continuidad en detail para encounters ya creados.
3. Redirect/revalidate: se preserva redirect encounter-centric a detail; el ajuste es de UX/composición, no de routing.
4. Superposición de campos: requiere ajuste de presentación para no percibirse como “segundo formulario real”.
5. Semántica de surface `in-progress`: conviene reencuadrar continuidad clínica y no solo cierre.

Límites explícitos:

- No reabre lifecycle ADR-001 ni practitioner model.
- No fusiona planning con register.
- No permite inferir intención por campos clínicos: la intención debe mantenerse explícita en la acción del usuario al submit.

### 7. Lifecycle transition en encounters planificados

**Estado:** Válido hoy

`startEncounterAction` ya habilita transición explícita `planned -> in-progress` y `finalizeEncounterAction` exige `in-progress`. La creación directa por register en `finished` permanece como modo de creación, no como transición de un encounter ya planificado.

### 8. Canonical read de finished detail

**Estado:** validado (alcance acotado)

El path `finished encounter detail` quedó validado como lectura canónica acotada: lectura clínica por `encounterId`, sin fallback temporal/longitudinal como source of truth en este surface, y render basado en datos rehidratados del loader.

También quedó validado el fail-closed de ownership encounter → patient: ante mismatch, el loader retorna `encounter: null` y evita cargar datos clínicos.

Este estado no se extiende al read model completo del sistema: fuera de `finished encounter detail` las garantías siguen siendo parciales y deben mantenerse como deuda abierta hasta nueva evidencia.

### 9. Documentation drift

**Estado:** Parcialmente válido

La base documental principal (copilot instructions + write-phase + ADR) está alineada en dirección. El drift estuvo en validaciones con lenguaje excesivamente concluyente para temas que siguen transicionales o con deuda.

### 10. Encounter-centric vs longitudinal (estado actual)

**Estado:** Válido hoy (frente auditado cerrado)

Las superficies `patient detail` y `encounter detail` se sostienen como encounter-centric por `encounterId`.
El fallback por fecha permanece como estrategia exclusivamente longitudinal/history y no se reutiliza como source-of-truth encounter-centric.
Avance acotado implementado en el loader longitudinal: clasificación local del origen de linkage (`linked-by-encounter` / `derived-by-date`) con trazabilidad mínima y precedencia explícita de vínculo por encounter.
Con la evidencia consolidada en este sprint final, este frente queda cerrado en el perímetro global solicitado (sin extender el cierre a temas fuera de alcance explícito).

Actualización de alineación (TG1 read-only posterior): en las surfaces auditadas para hardening global fuera del cierre acotado, no se detectó brecha técnica verificable; el cierre de ese sprint fue por evidencia, sin cambios productivos y sin reapertura de `app/patients/[id]/encounters/data.ts` en su boundary local ya validado.

Actualización documental acotada G3 (2026-04-06): evidencia reforzada con test integrado cross-surface para la frontera fallback-longitudinal vs encounter-centric. En el perímetro auditado, el fallback por fecha queda confinado a longitudinal/histórico, sin contaminación de source-of-truth encounter-centric (`patient detail`). Resultado: sin bug runtime nuevo verificable, sin cambios productivos, no implica cierre global/system-wide y no sustituye G4.

Actualización documental acotada G4 (2026-04-06): queda definida una **policy operativa mínima verificable para legacy sin `encounterId`** con guardrail puntual ya aplicado en loader longitudinal. Regla explícita: fallback `derived-by-date` permitido solo para registros sin `encounterId`; registros con `encounterId` explícito externo al episodio quedan rechazados por fecha. Este cierre se mantiene acotado: sin refactor general, sin migración/backfill masivo, sin bug runtime nuevo verificable fuera del caso corregido, sin implicar cierre global/system-wide y sin reabrir G1/G2/G3.

Actualización de cierre documental final (2026-04-07): el frente operativo global longitudinal/histórico + legacy sin `encounterId` + continuidad system-wide queda **cerrado por evidencia ensamblada**. La matriz global no dejó filas críticas sin evidencia funcional suficiente; los remanentes fueron clasificados como brecha documental (no técnica) y no requirieron cambios productivos ni nuevas specs browser para T2. Se preserva explícitamente la semántica correcta: charts/history longitudinal pueden mezclar encuentros por diseño, siempre confinados al dominio longitudinal permitido y sin contaminar surfaces encounter-centric (`patient detail`, `encounter detail`). Cualquier reapertura futura exige evidencia nueva verificable.

Actualización de estabilización `patient detail` (2026-04-07): el refinamiento reciente deja una jerarquía operativa más clara en la pantalla (identificación mínima, diagnóstico/tags, señal breve, CTA principal único por estado, secundarias subordinadas y contacto expandible como capa secundaria). Con esto, `patient detail` reduce competencia con detail/history y mantiene un resumen compacto del episodio (“visita relevante”) sin re-inflar UI. Esta iteración no crea `episode detail`, no cierra el diseño completo del episodio ni reabre arquitectura/lifecycle/lógica clínica; se registra como frente estabilizado/pausado para uso actual, con posible evolución futura a `episode detail` sin tratarla como deuda urgente.

### 11. Linkage clínico en lectura (`encounterId`)

**Estado:** Parcialmente válido

La lectura de vitales y EVA ya conserva `encounterId` cuando FHIR trae `Observation.encounter.reference` (incluyendo referencias ausentes, relativas y absolutas en tests). Esto mejora consistencia del read model encounter-centric, pero no resuelve automáticamente históricos sin vínculo explícito.

### 12. In-progress continuity (bounded scope)

**Estado:** validado (alcance acotado)

Para el alcance acotado validado, aplica únicamente a:

- **encounter detail** (lectura encounter-centric por `encounterId`);
- **patient detail** (source selection clínico `inProgressEncounter ?? lastFinishedEncounter`).

Evidencia validada:

- loop integrado `planned -> start -> in-progress -> save -> reload/remount -> rehydrate`;
- loop integrado `in-progress -> finalize -> finished -> patient detail source switch`;
- en continuidad post-finalize para el seed validado, `patient detail` queda en empty-state compatible con contrato vigente (no requiere tarjeta `ÚLTIMA VISITA` en ese escenario);
- guardas negativas contra fallback temporal/sibling y mezcla cross-encounter en estas surfaces.

Límites explícitos:

- ya existe cobertura browser E2E suficiente para el perímetro auditado; no se declara cobertura universal de todo caso posible;
- no hay validación montada de RHF `reset(...)`;
- no hay validación longitudinal/charts;
- la garantía se limita al perímetro de surfaces indicadas y al criterio T2 vigente;
- este bloque acotado no reemplaza otros frentes arquitectónicos fuera del perímetro auditado.

### 13. Test stack hardening (estado operativo)

**Estado:** Válido hoy (operativo, alcance acotado)

El stack de testing quedó más estable para operación diaria: Vitest con discovery en `__tests__` para `.test.ts/.test.tsx`, scripts explícitos, setup mínimo, alias runtime activo, Playwright con `reuseExistingServer: false` y seed loaders E2E con contrato/verificación mínima post-seed.

Este estado no equivale a cierre arquitectónico global del sistema.

### 14. Browser E2E (dos flujos cerrados en alcance acotado, sin charts)

**Estado:** validado (alcance acotado)

Se dispone de cobertura browser E2E útil para:

- finalize cross-surface/no-mix (sin charts);
- start + save-progress + reload/rehydrate (sin finalize ni charts).

En el segundo flujo se corrigieron dos problemas reales:

- observabilidad/timing de save-progress antes del reload;
- lectura encounter-scoped de FC/EVA con `cache: "no-store"` en repositorios de rehidratación.

Límite explícito: por sí sola, esta cobertura browser acotada no cerraba continuidad system-wide ni read longitudinal/histórico; ese cierre se consolida recién en el ensamblado global de evidencia del frente.

Actualización de cierre bounded (2026-04-06): se cerró el sprint de cobertura browser faltante en continuidad clínica con T1/T2/T4. La cobertura browser bounded quedó cerrada en los dos huecos definidos, con sin bug runtime nuevo verificable, no fue necesario abrir T3 y sin cambios productivos. Este resultado no implica cierre global/system-wide.

Actualización documental acotada G2 (2026-04-06): quedó cubierto el **hueco principal de evidencia browser de G2** en alcance acotado, incluyendo roundtrip cross-surface pre-finalize (`encounter detail -> patient detail -> history -> encounter detail`) con corrida verde del spec `e2e/flows/encounter-cross-surface-no-mix.spec.ts`; resultado con **sin bug runtime nuevo verificable** y **sin cambios productivos adicionales**. Este resultado **no implica cierre global/system-wide absoluto**, **no reabre G1–G4**, **no reabre canonical read `finished`** y **no sustituye G3/G4**.

## Pendientes del ADR / tickets siguientes

1. Mantener cerrado y protegido por tests el canonical read de `finished encounter detail`, sin extrapolar ese cierre a otras surfaces/estados.
2. Extender el tipado por capa de `ActionError.details` a otros frentes, manteniendo `ActionResult` estable, **solo si aparece perímetro operativo real fuera de encounter write** (hasta entonces, tratarlo como deuda nominal/documental y no como urgencia técnica).
3. Mantener cerrada la consistencia de practitioner context en el frente encounter write ya alineado (`create`, `save-progress`, `finalize`, `register`) y su exención explícita de `startEncounterAction`.
4. Mantener y proteger el cierre acotado ya logrado del hardening del read global (T1–T5), preservando separación encounter-centric vs longitudinal, fallback temporal controlado y policy de legacy sin `encounterId`, sin sobredeclarar cierre global.
5. Mantener cerrado el frente global de continuidad clínica en el perímetro validado; reabrir solo con evidencia nueva verificable de bug runtime real.

## Checklist vigente para validación de cambios

Usar este checklist en cada cambio de write flow:

- [ ] El dominio no importa FHIR ni devuelve recursos FHIR.
- [ ] Server Action orquesta: Zod -> Domain Rules -> Repository -> ActionResult.
- [ ] Domain Rules Validator no hace IO ni efectos secundarios.
- [x] Inverse mapper es puro y no resuelve practitioner desde config/sesión (frente encounter write cubierto por sprint de practitioner consistency).
- [ ] El error devuelto distingue al menos `layer`, `message` y `code`.
- [ ] Si un flujo depende de `planned -> finished`, está marcado como transición.
- [ ] No se afirma como "resuelto" lo que ADR/write-phase aún marcan como deuda.
- [ ] Los cambios documentales reflejan estado real, no estado aspiracional.

## Veredicto vigente

La arquitectura **no está “todo aprobado”**.

El sistema tiene bases sólidas en boundaries y responsabilidades, mantiene deuda explícita en lifecycle operativo, canonical read global fuera de `finished encounter detail` y cierre del contrato de errores tipados. La validación correcta hoy es: **base válida + transición activa + deuda reconocida + pendientes concretos del ADR**.

Nota: los últimos refactors de la capa `app/` (loaders, contratos y convención de rutas en patients/encounters) están resumidos en `docs/architecture/current/app-architecture-checkpoint-2026-03.md`.
