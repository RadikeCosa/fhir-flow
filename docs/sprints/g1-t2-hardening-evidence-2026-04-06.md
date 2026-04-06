# G1 T2 — Hardening mínimo de evidencia negativa ownership/cross-patient

- Fecha: 2026-04-06
- Alcance: `patient detail` + `encounter history` (invariant 2)
- Resultado: **cerrado por evidencia**
- Cambios productivos: **ninguno**

## Evidencia agregada

1. `patient detail`
   - Test negativo explícito: cuando el `patientId` de ruta no existe, `getPatientDetailData` falla cerrado con `PatientNotFoundError`.
   - Además verifica que no se disparan cargas clínicas encounter-scoped ni composición de encounters.

2. `encounter history`
   - Test negativo explícito: cuando el `patientId` de ruta no existe, `getEncountersPageData` falla cerrado con `PatientNotFoundError`.
   - Además verifica que no se dispara composición de history (`findAllByEpisodeOfCareId`) ni lecturas longitudinales de paciente.

## Conclusión G1/T2

Los 2 ámbar de G1/T1 para invariant 2 (ownership/cross-patient) pasan a **verde por evidencia explícita**, sin refactor ni expansión de alcance.

## Límites respetados

- no G2/G3/G4
- sin refactor de `app/patients/[id]/encounters/data.ts`
- sin cambios productivos
