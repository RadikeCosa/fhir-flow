# Auditoría/implementación mínima UX: referencias visibles por campo (2026-04-09)

## Objetivo cubierto
1. Identificar metadata/rangos existentes por campo clínico.
2. Explicar por qué register no mostraba referencias extendidas.
3. Implementar ayudas visibles compartidas sin hardcode repetido.
4. Mantener fuente de verdad compartida para register + continuidad.

## Diagnóstico breve
- El formulario compartido ya tenía `min/max/step` técnicos en cada input.
- Faltaba renderizar una ayuda visible consistente por campo (captura + referencia normal cuando existe en metadata).
- Register y continuidad no diferían por datos, sino por ausencia de esos helpers extendidos en la superficie común.

## Implementación aplicada
- Nuevo renderer reutilizable: `ClinicalFieldReferenceHint`.
- `ClinicalMeasurementsSections` ahora muestra por campo:
  - rango técnico de captura (desde `VITAL_SIGN_CAPTURE_RANGES`),
  - referencia normal visible cuando existe en `CLINICAL_RANGES`/`getEvaClinicalRanges`,
  - helper adicional cuando corresponde (EVA y aclaración diastólica).

## Campos con referencia visible
- Frecuencia cardíaca
- Frecuencia respiratoria
- Saturación O2
- Temperatura corporal
- Presión sistólica
- Presión diastólica (captura técnica + aclaración de metadata)
- EVA (captura técnica + zonas ordinales + helper EVA)

## Deliberadamente afuera
- Sin cambios de dominio, lifecycle, actions ni schemas.
- Sin cambios de layout general ni refactor amplio.
