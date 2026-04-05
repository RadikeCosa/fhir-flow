# Recomendación de próximo sprint (landing zone efectiva)

Fecha: 2026-04-05

## Resumen ejecutivo

- Se confirma cierre **acotado** (no global) en continuidad clínica, browser E2E bounded, practitioner consistency encounter write y ActionError.details fase 3 fuera de encounter write por perímetro vacío.
- Las deudas abiertas con perímetro real hoy se concentran en cobertura bounded del frente continuidad/browser y en hardening global de lectura canonical fuera de detail.
- No se recomienda abrir sprint por deuda nominal sin superficie operativa en código.

## Baseline

### Cerrado efectivamente (bounded)

- Continuidad clínica transversal: cierre por evidencia sin bug runtime nuevo verificable; quedan 2 huecos de cobertura acotados (coexistencia browser `in-progress + finished` y contraste post-finalize en más de un seed).
- Practitioner consistency en encounter write: cerrado para flows attribution-driven; `startEncounterAction` exento por diseño acotado.
- ActionError.details fase 3 fuera de encounter write: cierre por evidencia diagnóstica/documental al no existir server actions no-encounter con `ActionResult`.

### Cerrado solo en alcance acotado

- Canonical read de `finished encounter detail`: validado por `encounterId` con fail-closed de ownership, sin extrapolación global.
- Browser E2E continuity/finalize: cobertura útil en seeds acotados, sin cierre system-wide.
- Longitudinal/histórico global: último sprint cerró TG1 por evidencia y mantuvo `encounters/data.ts` bounded-closed salvo regresión verificable.

### Deuda abierta con landing zone real

1. Cobertura browser de `patient detail` con coexistencia explícita `in-progress + finished`.
   - Landing zone: `e2e/flows/encounter-continuity.spec.ts`, `e2e/support/load-continuity-minimal-seed.ts`, `app/patients/[id]/__tests__/data.test.ts`, `app/patients/[id]/__tests__/cross-surface.contract.test.ts`.
2. Contraste post-finalize con más de un seed válido.
   - Landing zone: `e2e/flows/encounter-finalize.seeded.spec.ts`, `e2e/support/load-finalize-minimal-seed.ts`, seed loaders/support y contratos actuales de patient detail.
3. Hardening global de canonical read fuera de detail acotado (siempre test-first).
   - Landing zone: `app/patients/[id]/encounters/data.ts`, `app/patients/[id]/encounters/__tests__/data.test.ts`, `app/patients/[id]/__tests__/cross-surface.contract.test.ts`.

### Deuda nominal / sin superficie operativa actual

- Extensión de `ActionError.details` fuera de encounter write: no hay acciones candidatas no-encounter; no hay landing zone implementable sin inventar perímetro.

## Candidatos de próximo sprint (priorizados)

1. **Validación bounded de cobertura browser faltante en continuidad clínica**
   - Tipo: validación.
   - Valor: cierra huecos de cobertura ya identificados sin abrir features.
   - Riesgo: scope creep bajo (si se acota a specs/seeds).
2. **Hardening test-first de canonical read global fuera de detail**
   - Tipo: hardening.
   - Valor: reduce riesgo de drift longitudinal/cross-surface en superficies no cubiertas globalmente.
   - Riesgo: medio (puede tentar reapertura de boundaries cerrados).
3. **Auditoría de deuda longitudinal legacy sin `encounterId` (solo evidencia)**
   - Tipo: validación.
   - Valor: clarifica deuda global sin tocar runtime si no hay gap verificable.
   - Riesgo: medio/alto de quedarse en documentación si no hay failing test nuevo.

## Recomendación principal

**Elegir candidato 1: validación bounded de cobertura browser faltante en continuidad clínica.**

Rationale:

- Tiene landing zone técnica efectiva hoy en specs, seed loaders, tests integrados y loaders ya operativos.
- No reabre frentes cerrados (practitioner, ActionError fase 3, continuidad bounded ya cerrada por evidencia).
- Maximiza costo/valor: trabajo acotado, alto retorno en confianza de contrato runtime, sin reingeniería.

## No recomendado ahora

- Reabrir practitioner consistency en encounter write.
- Reabrir ActionError.details fase 3 fuera de encounter write.
- Abrir sprint por deuda nominal/documental sin perímetro de código operativo.
