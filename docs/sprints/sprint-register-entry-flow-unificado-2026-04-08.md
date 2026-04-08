# Sprint — Register entry flow unificado (`/encounters/register`)

Fecha: 2026-04-08  
Estado: Propuesto (documental, sin implementación en esta etapa)

## 1) Título

Unificación de entrada a register: formulario clínico directo + decisión operativa en submit.

## 2) Objetivo

Reducir fricción de entrada en `/encounters/register` eliminando el gate inicial de decisión, preservando intención explícita del usuario en acciones finales (`Guardar progreso` / `Finalizar visita`) y manteniendo consistencia con ADR-001, write-phase vigente y separación planning-vs-register.

## 3) Diagnóstico

Situación actual (A):

1. El flujo abre con una decisión operativa inicial (`Iniciar visita` / `Finalizar directamente`).
2. Luego se ingresa al formulario clínico.
3. Al final reaparece una decisión operativa equivalente (`guardar progreso` / `finalizar visita`).

Fricciones detectadas:

- **Duplicación de intención operativa** (entrada y cierre).
- **Orden poco natural** para el usuario clínico: primero “modo operativo”, después “contenido clínico”.
- **Costo cognitivo inicial** mayor para tareas de registro rápido.

## 4) Evaluación de alternativas

### Opción A — Mantener flujo actual

**Pros**

- Mantiene semántica ya conocida.
- Intención explícita desde el primer paso.
- Riesgo técnico bajo (sin cambios de contrato inmediato).

**Contras**

- Mantiene fricción UX por decisión temprana.
- Repite intención al final del formulario.
- Menor progresividad para carga clínica parcial.

### Opción B — Entrada directa + creación al primer submit

**Pros**

- Flujo más natural: primero contenido clínico, luego decisión operativa explícita.
- Evita creación prematura de encounter sin intención efectiva de guardado/finalización.
- Preserva separación planning (`/encounters/new`) vs register (`/encounters/register`).
- Compatible con lifecycle vigente sin reabrir ADR-001.

**Contras / trade-offs**

- Requiere semántica clara del **primer submit** (sin `encounterId`).
- Introduce coordinación explícita entre create inicial y save/finalize posterior.

### Opción C — Entrada directa + creación inmediata al entrar

**Pros**

- Simplifica algunos paths técnicos posteriores (siempre existe `encounterId`).

**Contras (motivo de descarte)**

- Genera encuentros huérfanos ante abandono temprano.
- Aumenta ruido operativo/audit trail.
- Exige políticas de limpieza/cancelación adicionales no justificadas por valor UX.

## 5) Opción elegida y por qué

**Elegida: Opción B.**

Razón: ofrece la mejor relación entre claridad UX y disciplina operativa. Mantiene intención explícita por acción del usuario (sin inferencia implícita por campos), evita encounters huérfanos y no contradice separación planning/register ni la arquitectura de write vigente.

## 6) Alcance

- Rediseño acotado del entry flow de `/encounters/register`.
- Definir semántica operativa del primer submit y continuidad posterior.
- Documentar impactos en acciones y estados de formulario.

## 7) No alcance

- No reabrir lifecycle ni redefinir estados de encounter.
- No cambiar practitioner model ni responsabilidad server-side vigente.
- No fusionar planning y register.
- No cambiar arquitectura global de write/read.

## 8) Decisiones de flujo

1. El usuario entra directo al formulario clínico unificado (sin gate inicial).
2. La intención operativa queda explícita en el submit:
   - `Guardar progreso`
   - `Finalizar visita`
3. Primer submit:
   - Guardar progreso ⇒ crea encounter en `in-progress`.
   - Finalizar visita ⇒ crea encounter en `finished`.
4. Submits posteriores (con `encounterId`):
   - Guardar progreso ⇒ usa operación de progreso sobre `in-progress`.
   - Finalizar visita ⇒ usa operación de cierre sobre `in-progress` según contrato vigente.

## 9) Criterios de aceptación

1. Existe decisión documental explícita de adoptar opción B y descartar C.
2. La intención del usuario permanece explícita en el submit, no inferida por campos.
3. Se preserva separación planning-vs-register en copy, navegación y reglas operativas.
4. Se documenta semántica del primer submit y continuidad para encounters `in-progress`.
5. No se presentan estos cambios como rediseño global de arquitectura.

## 10) Riesgos / límites

- Riesgo de ambigüedad si no se explicita claramente la semántica del primer submit.
- Riesgo de regresión UX si las acciones finales no distinguen correctamente guardado parcial vs cierre.
- Límite: cualquier implementación futura debe respetar contratos actuales de `ActionResult`, validación por capas y ownership clínico.

## 11) Impactos en operaciones existentes

- **`registerEncounterAction`**: migra de “decisión inicial de entry” a “resolución explícita del primer submit”.
- **`saveEncounterProgressAction`**: mantiene rol en continuidad de encuentros ya creados (`encounterId` existente).
- **Semántica del primer submit**: se vuelve punto de creación del encounter en register.
- **Estados de formulario**: distingue estado pre-creación (sin `encounterId`) y post-creación (con `encounterId`).
- **Redirect / revalidate**: tras creación inicial, estabilizar estado/URL para rehidratación coherente encounter-centric.
- **Continuidad posterior (`in-progress`)**: guardar progreso y finalizar permanecen como operaciones separadas y explícitas.
