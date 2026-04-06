# Recomendación de próximo sprint (baseline real al 2026-04-06)

## Diagnóstico breve

- Se confirma cierre acotado en practitioner consistency, ActionError fase 2 (encounter write), auditorías bounded de continuidad y cobertura browser faltante.
- Persisten deudas abiertas amplias en continuidad full-system y contrato longitudinal/histórico global, pero los últimos sprints cerraron sin bug runtime nuevo verificable en los perímetros auditados.
- ActionError fase 3 fuera de encounter write queda como deuda nominal/documental: no hay server actions fuera de encounter write sobre las que implementar.

## Recomendación principal

## Sprint sugerido

**Validación focalizada de continuidad clínica system-wide (sin hardening por defecto).**

### Por qué

- Es la deuda abierta con mejor relación costo/valor que todavía tiene landing zone técnica real en loaders/tests/e2e.
- Evita reabrir frentes ya cerrados por evidencia.
- Permite decidir con datos si hay bug runtime real o si el remanente es mayormente documental.

### Landing zone propuesta

- `app/patients/[id]/data.ts`
- `app/patients/[id]/encounters/[encounterId]/data.ts`
- `app/patients/[id]/encounters/data.ts` (solo diagnóstico; no tocar salvo falla verificable)
- `app/patients/[id]/__tests__/cross-surface.contract.test.ts`
- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts`
- `e2e/flows/encounter-continuity.spec.ts`
- `e2e/flows/encounter-finalize.seeded.spec.ts`

### Guardrails

- No reabrir practitioner consistency.
- No reabrir ActionError.details fuera de encounter write.
- No convertir continuidad en rediseño longitudinal/charts.
- No abrir hardening productivo sin gap runtime reproducible.

## Frentes descartados para próximo sprint

- **ActionError fase 3 fuera de encounter write:** sin perímetro operativo actual.
- **Practitioner consistency:** frente cerrado en alcance definido.
- **Cobertura browser faltante de continuidad:** cerrada en alcance bounded.
- **Hardening longitudinal global inmediato:** último ciclo TG1 cerró sin gap verificable; abrir implementación ahora sería por hipótesis.
