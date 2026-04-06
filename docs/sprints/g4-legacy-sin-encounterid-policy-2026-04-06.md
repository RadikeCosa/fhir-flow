# G4 — Legacy sin `encounterId`: policy operativa mínima (2026-04-06)

## Objetivo acotado

Definir una policy verificable para datos legacy sin `encounterId` que:

1. permita continuidad en lectura longitudinal/histórica;
2. prohíba su uso como source-of-truth encounter-centric;
3. deje guardrails explícitos por surface, sin reabrir G1/G2/G3.

## Policy operativa mínima por surface

### 1) `patient detail` (encounter-centric)

- **Permitido:** cargar datasets clínicos solo por `findAllByEncounterId(clinicalEncounterSource.id)`.
- **Prohibido:** fallback temporal (`date-derived`) como fuente clínica.
- **Guardrail:** `clinicalEncounterSource = inProgressEncounter ?? lastFinishedEncounter`; no hay lectura clínica por paciente/fecha en esta surface.

### 2) `encounter detail` (encounter-centric)

- **Permitido:** cargar datasets clínicos del `encounterId` de ruta cuando el encounter existe y corresponde al paciente.
- **Prohibido:** reconstrucción por fecha o mezcla con encounters hermanos del mismo día.
- **Guardrail:** read canónico por `findAllByEncounterId(encounterId)` + fail-closed si el encounter no pertenece al paciente de la ruta.

### 3) `encounter history` y charts longitudinales

- **Permitido:** fallback `derived-by-date` **solo** para registros legacy sin `encounterId`.
- **Prohibido:** aplicar fallback por fecha a registros que sí traen `encounterId` pero no pertenecen al set de encounters del episodio.
- **Guardrail:** en `resolveLongitudinalLinkageOrigin`, si el registro trae `encounterId` externo al episodio, se rechaza (`null`) y no entra por fecha.

### 4) Maps/cards encounter-centric (`vitalsByEncounterId`, `evaByEncounterId`, `proceduresByEncounterId`)

- **Permitido:** poblar mapas únicamente con linkage explícito por `encounterId`.
- **Prohibido:** poblar maps/cards desde registros `date-derived` sin `encounterId`.
- **Guardrail:** early return al construir maps (`if (!record.encounterId) return`).

## Evidencia mínima en código/tests

- `app/patients/[id]/encounters/data.ts`
  - fallback longitudinal limitado a legacy sin `encounterId`;
  - guardrail para rechazar `encounterId` externo, incluso si la fecha coincide.
- `app/patients/[id]/encounters/__tests__/data.test.ts`
  - test unitario de `resolveLongitudinalLinkageOrigin` para `encounterId` externo + fecha coincidente => `null`.

## Resultado de G4 en este ticket

- Se explicita la policy mínima en este documento.
- Se registra el guardrail técnico puntual aplicado en loader longitudinal para eliminar la ambigüedad detectada.
- No se detecta bug runtime nuevo verificable fuera del caso corregido.
- Sin refactor general ni migración/backfill masivo.
- No se declara cierre global/system-wide ni reapertura de G1/G2/G3.
