# Sprint — Audit técnico-funcional del flujo real `register -> guardar progreso -> detail`

Fecha: 2026-04-08  
Estado: Auditoría documental (sin implementación)

## 1) Objetivo del audit

Verificar en runtime/código el comportamiento end-to-end de `/patients/[id]/encounters/register` cuando el usuario completa el formulario y acciona **Guardar progreso**, para determinar si la continuidad posterior es natural o si se percibe como una segunda etapa redundante.

## 2) Superficies auditadas

- `app/patients/[id]/encounters/register/page.tsx`
- `app/patients/[id]/encounters/new/components/RegisterEncounterForm/index.tsx`
- `app/patients/[id]/encounters/new/actions/register-encounter.action.ts`
- `app/patients/[id]/encounters/new/actions/register-encounter.schema.ts`
- `app/patients/[id]/encounters/[encounterId]/page.tsx`
- `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx`
- `app/patients/[id]/encounters/[encounterId]/actions/save-encounter-progress.action.ts`
- `app/patients/[id]/encounters/[encounterId]/actions/finalize-encounter.action.ts`
- `app/patients/[id]/encounters/[encounterId]/data.ts`

Cobertura de tests revisada:

- register entry/form/action:
  - `app/patients/[id]/encounters/register/__tests__/page.entry-flow.test.tsx`
  - `app/patients/[id]/encounters/new/components/RegisterEncounterForm/__tests__/register-encounter-form.render.test.ts`
  - `app/patients/[id]/encounters/new/actions/__tests__/register-encounter.action.test.ts`
- continuity/detail/save/finalize:
  - `app/patients/[id]/encounters/[encounterId]/__tests__/page.rehydration-wiring.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/__tests__/finalize-encounter-form.save-progress.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/actions/__tests__/save-encounter-progress.action.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/actions/__tests__/finalize-encounter.action.test.ts`
  - `app/patients/[id]/encounters/[encounterId]/__tests__/critical-flow.integration.test.ts`

## 3) Flujo real verificado (paso a paso)

### Paso A — Entrada a `/encounters/register`

- El usuario entra directo al formulario `RegisterEncounterForm` (no hay pre-gate `Iniciar visita / Finalizar directamente`).
- Campos visibles del surface register:
  - tipo de visita
  - fecha
  - hora de inicio
  - hora de fin (opcional según intención)
  - nota clínica (expandible)
- Acciones visibles:
  - `Guardar progreso` (`completionMode: "start"`)
  - `Finalizar visita` (`completionMode: "complete"`)

### Paso B — Submit `Guardar progreso` desde register

- El submit de register invoca `registerEncounterAction` con `completionMode: "start"`.
- Se valida con `registerEncounterSchema`.
- Se crea encounter vía `repo.register(input)` en modo de inicio (`in-progress`) y se ejecuta:
  - `revalidatePath(/patients/[id])`
  - `revalidatePath(/patients/[id]/encounters)`
  - `revalidatePath(/patients/[id]/encounters/[encounterId])`
  - `redirect(/patients/[id]/encounters/[encounterId])`

### Paso C — Surface posterior al redirect

- El usuario aterriza en **encounter detail** (`/encounters/[encounterId]`), status editable `in-progress`.
- En esa ruta se renderiza `FinalizeEncounterForm` bajo header **Finalizar visita**.
- Ese formulario incluye:
  - fecha real
  - hora real de inicio
  - hora real de fin
  - nota clínica
  - motivo
  - signos vitales
  - EVA
  - procedimientos
  - botones `Guardar progreso` y `Finalizar visita`

### Paso D — Continuidad en detail

- `Guardar progreso` ya no redirige: usa `saveEncounterProgressAction`, persiste snapshot y muestra feedback inline.
- `Finalizar visita` usa `finalizeEncounterAction` y redirige al mismo detail ya en modo `finished` (read-only).

## 4) Hallazgo principal de fricción

La fricción **sí es real**: el usuario percibe que, tras “Guardar progreso” en register, cae en una segunda superficie que vuelve a pedir parte de lo ya cargado y además cambia el framing a “Finalizar visita”.

No hay bug de routing técnico: el redirect es consistente con la arquitectura encounter-centric. La fricción es de continuidad UX/semántica y de composición de formularios.

## 5) Duplicación observada (verificable)

### Duplicación explícita register vs detail

Se repiten editables en ambos surfaces:

- fecha real
- hora de inicio real
- hora de fin real
- nota clínica
- acciones `Guardar progreso` / `Finalizar visita`

### Diferencia de alcance

- register: captura mínima + intención explícita de primer submit
- detail in-progress: captura completa + continuidad clínica

Conclusión: no es duplicación “total” de dominio, pero sí duplicación perceptible de interacción base (timing + nota + acciones).

## 6) Respuestas explícitas a las preguntas del audit

1. **¿Register se siente como pre-formulario y detail como formulario real?**  
   Sí, en runtime actual esa percepción es plausible: register abre “Datos de la visita”, pero luego detail presenta el surface más completo con título “Finalizar visita”, que opera como formulario clínico principal.

2. **¿Qué datos se capturan en register y cuáles reaparecen?**  
   En register se capturan tipo, fecha, inicio, fin opcional y nota opcional. En detail reaparecen fecha/inicio/fin/nota y se amplían campos clínicos (motivo, signos, EVA, procedimientos), todos aún editables en `in-progress`.

3. **¿La continuidad posterior está bien semánticamente o genera segunda carga redundante?**  
   Es técnicamente coherente (encounter-centric + rehidratación), pero semánticamente genera segunda carga redundante para usuario clínico por repetición de base temporal/narrativa y cambio de contexto visual.

4. **¿El redirect después de Guardar progreso es correcto para usuario o solo arquitectura?**  
   Es correcto para arquitectura y trazabilidad de encounter (`encounterId` estable), pero no está optimizado para percepción de continuidad de UX en el primer salto register -> detail.

5. **¿Reparación correcta A/B/C/u otra?**  
   Recomendación principal: **A (mantener surfaces) + ajuste de UX semántico fuerte**, con recorte acotado de fricción sin reabrir lifecycle.  
   Variante adicional viable: **B (reducir register al mínimo real de alta en curso)** si se busca minimizar aún más superposición.

## 7) Diagnóstico causal

### No es principalmente un problema de:

- lifecycle
- practitioner model
- validez de acciones write
- integridad de redirect/revalidate

### Sí es principalmente un problema de:

1. **UX de continuidad entre surfaces**: salto temprano a una pantalla rotulada como cierre.
2. **Composición de formularios**: register incluye un subconjunto que luego se vuelve a editar en detail.
3. **Semántica/naming de superficie detail in-progress**: encabezado “Finalizar visita” durante un estado que aún admite progreso parcial.

## 8) Reparación mínima correcta (sin rediseño mayor)

1. Mantener redirect a detail (encounter-centric) y no cambiar contratos write.
2. En detail `in-progress`, reemplazar framing “Finalizar visita” por framing de continuidad (“Continuar visita en curso”).
3. En register, reforzar copy de transición: “Guardar progreso crea la visita y te lleva al detalle para continuar”.
4. Reducir superposición visual de campos timing/nota entre register y detail (sin romper capacidad de edición en detail).

## 9) Severidad y alcance

- **Severidad**: media (impacta claridad operativa y percepción de flujo continuo).
- **Alcance**: acotado a entry/continuity UX de register-detail; no afecta invariantes clínicos ni contratos core de arquitectura.

## 10) Conclusión ejecutiva

El flujo actual **funciona** y está alineado con arquitectura encounter-centric, pero la experiencia post “Guardar progreso” presenta una fricción de continuidad real por superposición parcial de formularios y framing de cierre demasiado temprano en detail.

La corrección mínima correcta es UX/composición semántica (no arquitectónica), preservando acciones y rutas actuales.
