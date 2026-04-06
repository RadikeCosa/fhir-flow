# Sprint recomendado (único) — Continuidad clínica system-wide (definición verificable)

Fecha: 2026-04-06

## 1) Título final del sprint

**Sprint: Delimitación verificable de continuidad clínica system-wide (sin reapertura de bounded closures)**

## 2) Objetivo

Delimitar y dejar operativo un **único contrato verificable del frente global** de continuidad clínica system-wide (más allá de surfaces encounter-centric ya cerradas en bounded scope), normalizando su criterio de cierre y dejando backlog/tickets/evidencia listos para ejecución posterior. Este sprint **no equivale** a hardening global ejecutado.

## 3) Justificación

- Los cierres recientes son mayoritariamente **bounded** y no globales; están bien cerrados en su perímetro y no deben reabrirse sin evidencia nueva.
- El frente realmente abierto es la **continuidad global/system-wide** fuera de esos perímetros.
- La mayor fricción actual es operativa: deuda global amplia sin delimitación verificable ni criterio de cierre unificado.

## 4) Problema real a resolver

Hoy existe una brecha entre:

- lo que ya está cerrado en alcance acotado (encounter detail/patient detail/browser acotado), y
- lo que sigue abierto como continuidad global longitudinal/system-wide.

La brecha no es “falta de hardening global ya ejecutado”, sino **falta de frontera global verificable** (qué incluye, qué excluye, qué evidencia cierra) para habilitar el sprint técnico siguiente.

## 5) Alcance

Incluye solamente este frente principal:

1. Definir perímetro global de continuidad system-wide (surfaces + invariants + contratos esperados).
2. Convertir el frente global en tickets accionables con evidencia de cierre.
3. Consolidar en backlog la distinción: cerrado real, cerrado bounded, abierto real, deuda nominal.
4. Resolver ambigüedades operativas de wording que hoy generan reaperturas indebidas.

## 6) No alcance explícito

- No reabrir practitioner consistency en encounter write (ya cerrado en su frente).
- No reabrir ActionError fuera de encounter write como deuda técnica urgente (permanece nominal salvo nuevo perímetro operativo).
- No reabrir canonical read bounded de finished encounter detail.
- No reabrir cobertura browser bounded ya cerrada.
- No rediseñar `encounters/data.ts`, `EncounterList` o `FinalizeEncounterForm` en este sprint.

## 7) Definition of Done verificable

Se considera cerrado este sprint (en términos de **delimitación operativa/verificable**, no de hardening global ejecutado) cuando exista evidencia de que:

1. El backlog tiene **un único frente principal abierto** llamado continuidad clínica system-wide, con alcance explícito y sin duplicados.
2. Cada ítem abierto del frente tiene owner, resultado esperado y evidencia exigida.
3. Los cierres bounded vigentes quedan etiquetados como “no reabrir sin evidencia nueva”.
4. Las deudas nominales quedan clasificadas como no urgentes/no bloqueantes.
5. Existe una matriz de verificación (surfaces x invariants x evidencia) aprobada para el siguiente sprint de ejecución técnica.

## 8) Tickets T1–T5

### T1 — Normalizar taxonomía operativa del backlog
- **Objetivo:** unificar estados (`cerrado real`, `cerrado bounded`, `abierto real`, `abierto nominal`).
- **Tipo:** documental operativo.
- **Resultado esperado:** backlog sin estados ambiguos ni duplicados de cierre.
- **Evidencia de cierre:** diff en `docs/backlog.md` con bloque único por frente y etiquetas normalizadas.

### T2 — Definir perímetro global de continuidad system-wide
- **Objetivo:** declarar qué surfaces y contratos entran en la delimitación verificable del frente global.
- **Tipo:** arquitectura (definición de alcance verificable).
- **Resultado esperado:** frontera global explícita y aprobada.
- **Evidencia de cierre:** matriz “surface/invariant/evidencia” vinculada desde backlog y validación.

### T3 — Convertir deuda global en tickets accionables
- **Objetivo:** descomponer el frente global en subtickets ejecutables con dueño y criterio de aceptación.
- **Tipo:** planificación técnica.
- **Resultado esperado:** backlog ejecutable por iteraciones sin deuda vaga.
- **Evidencia de cierre:** sección de backlog con tickets y DoD por ticket.

### T4 — Cerrar ambigüedades documentales que hoy inducen reapertura
- **Objetivo:** alinear wording entre backlog y validación para evitar lectura “bounded = global”.
- **Tipo:** documental de precisión arquitectónica.
- **Resultado esperado:** texto consistente sobre límites y alcances.
- **Evidencia de cierre:** actualización en `docs/validation/validacion-arquitectonica.md` y/o `docs/backlog.md` donde aplique.

### T5 — Preparar handoff al sprint técnico siguiente
- **Objetivo:** dejar lista la apertura del sprint de ejecución (sin ejecutarlo aún).
- **Tipo:** operativo.
- **Resultado esperado:** plan de ejecución técnica global listo para iniciar.
- **Evidencia de cierre:** bloque “Próximo sprint técnico” con objetivo, alcance/no alcance y pruebas objetivo.

## 9) Riesgos del sprint

1. Quedarse en limpieza cosmética sin producir tickets realmente ejecutables.
2. Reabrir cierres bounded por redacción ambigua.
3. Inflar deuda nominal (ActionError/practitioner fuera de perímetro) como urgencia técnica.
4. Mezclar frentes (continuidad global + refactors UI) y perder foco.

## 10) Resultado esperable

Al final del sprint, el proyecto debería tener:

- un backlog legible para decisión ejecutiva inmediata;
- un único frente principal abierto (continuidad system-wide) con subtickets verificables;
- cero reaperturas injustificadas de cierres bounded;
- criterio claro para separar deuda técnica real de drift documental.

## 11) Recomendación final

Aprobar este sprint **tal como está** y usarlo como puente entre:

- cierres bounded ya logrados (que se preservan), y
- próximo sprint técnico de hardening global (que se abre con alcance y evidencia definidos).

Este sprint **no cierra** la continuidad clínica global/system-wide en sí; cierra su delimitación operativa/verificable para ejecutar ese cierre técnico en la siguiente iteración.

La recomendación prioriza foco, evita churn y reduce riesgo de decisiones por interpretación ambigua.
