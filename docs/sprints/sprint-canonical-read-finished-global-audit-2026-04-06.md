# Sprint técnico — Canonical read global de `finished` fuera de `encounter detail` (2026-04-06)

## Objetivo
Responder con evidencia qué brecha real sigue abierta para endurecer el canonical read global de `finished` más allá del closure acotado de `encounter detail`.

## Baseline de autoridad usado
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/backlog.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`

## Diagnóstico ejecutivo
Estado resultante: **mezcla de gap de evidencia + drift documental menor + ambigüedad de navegación puntual**.

- No se detectó contradicción runtime en loaders encounter-centric de `finished` entre detail/patient/history.
- Sí se observó ambigüedad operativa en `patient detail`: la tarjeta clínica resumida de “última visita” mostraba datos clínicos pero no ofrecía acceso directo al detail canónico del mismo `encounterId`; solo ofrecía salto a history.
- Esa ambigüedad no invalida el cierre bounded de `finished encounter detail`, pero sí mantiene deuda global de “señalización canónica” cross-surface.

## Hallazgos por surface

### 1) encounter detail
- Mantiene lectura encounter-centric por `encounterId` para `finished`.
- No depende de fallback temporal para source-of-truth clínico en ese surface.
- Scope sigue siendo bounded/cerrado, sin reapertura.

### 2) patient detail
- Usa fuente clínica única (`inProgressEncounter ?? lastFinishedEncounter`) y datasets por `encounterId` de esa fuente.
- No hay mezcla cross-encounter en el contrato auditado.
- **Gap detectado**: faltaba CTA directo al detail canónico desde la sección de “última visita / visita en curso”.

### 3) encounter history
- Mantiene rol de resumen/navegación + charts longitudinales.
- Fallback por fecha permanece confinado al dominio longitudinal/histórico.
- Maps/cards encounter-centric siguen estrictos por `encounterId`.

## Único siguiente movimiento correcto
**Hacer explícita la preferencia canónica en navegación de `patient detail` agregando CTA directo al `encounter detail` del `lastEncounter` (cuando existe).**

Justificación:
- Es el punto más crítico restante dentro de este frente: reduce ambigüedad cross-surface sin reabrir loaders ni G1–G4.
- Es un cambio mínimo, verificable y de bajo riesgo.
- Mantiene intacta la separación encounter-centric vs longitudinal/histórico.

## Ejecución realizada
- Se agregó en `LastEncounterSection` un enlace directo `Abrir detalle clínico →` hacia `/patients/{patientId}/encounters/{lastEncounter.id}` cuando existe `lastEncounter`.
- Se mantuvo `Ver historial →` como navegación secundaria.
- Se actualizaron tests de render de la sección para validar presencia/ausencia del nuevo CTA según corresponda.

## Resultado del sprint
- **Tipo de resultado**: hardening mínimo de navegación + evidencia de contrato.
- **Cambios productivos**: sí, acotados a navegación/UX de canonical read signaling.
- **Cierre documental posterior de este frente**: se realiza sin cambios productivos adicionales (solo consolidación de wording en backlog/validación arquitectónica).
- **Sin** refactor general, sin cambios de modelo longitudinal, sin migraciones/backfills.

## Constraints verificados
- No se reabrió G1, G2, G3 ni G4.
- No se reabrió bounded closure de `finished encounter detail`.
- No se tocó practitioner consistency ni `ActionError.details`.
- No se sobredeclara cierre global/system-wide: la deuda global longitudinal/histórica sigue explícita.
