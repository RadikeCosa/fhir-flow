# Sprint — Redefinición del flujo register a single-surface clínico (`/encounters/register`)

Fecha: 2026-04-08  
Estado: Implementado (pendiente solo cierre documental post-auditoría)

## 1) Objetivo

Alinear el runtime real con el target de producto: `register` debe comportarse como **único formulario clínico** de la visita, sin percepción de pre-formulario + segundo formulario en `encounter detail`.

## 2) Hallazgos de auditoría (resumen)

1. El entry actual en `/encounters/register` ya es directo al formulario, sin gate inicial.
2. Sin embargo, ese formulario captura solo un subconjunto (tipo, fecha, hora inicio, hora fin, nota).
3. Al accionar `Guardar progreso`, el usuario es redirigido inmediatamente a `/encounters/[encounterId]`, donde vuelve a editar timing + nota y recién allí accede al resto clínico (motivo, vitales, EVA, procedimientos).
4. Aunque el redirect es correcto encounter-centric, la UX se percibe como dos etapas/superficies.

## 3) Decisión propuesta

Adoptar **single-surface real en `/encounters/register`** para todo el flujo inicial de carga clínica:

- misma pantalla para alta inicial y continuidad in-progress;
- mismos bloques clínicos desde el inicio (tipo, motivo, fecha, hora inicio, hora fin, nota, vitales, EVA, procedimientos);
- acciones al pie:
  - `Guardado parcial`
  - `Registrar`
  - opcional `Cancelar y salir`.

`/encounters/[encounterId]` se mantiene como detalle canónico (lectura y continuidad secundaria), pero deja de ser el paso obligatorio inmediato tras el primer guardado parcial en register.

## 4) Semántica operativa requerida

### 4.1 `Guardado parcial`

- Debe crear (si no existe) o actualizar (si ya existe) un encounter `in-progress`.
- Requisito mínimo: **hora de entrada**.
- Criterio explícito sobre fecha: en esta fase se propone exigir también fecha por coherencia temporal del input actual; si se decide flexibilizar, debe definirse default server-side estable.

### 4.2 `Registrar`

- Debe finalizar la visita (`finished`) con validaciones de cierre:
  - hora de entrada;
  - hora de salida;
  - nota clínica.

## 5) Diseño técnico mínimo (sin reabrir arquitectura)

1. Mantener contratos write/lifecycle vigentes (`registerEncounterAction`, `saveEncounterProgressAction`, `finalizeEncounterAction`).
2. Reusar esquema/validaciones por intención de submit (`partial` vs `register`).
3. Evitar redirect obligatorio a detail en el primer `Guardado parcial`; continuar en la misma ruta de register.
4. Mantener `encounterId` estable en estado de formulario una vez creado el encounter.
5. Preservar separación planning (`/encounters/new`) vs register (`/encounters/register`).

## 6) No alcance

- No reabrir ADR-001 lifecycle.
- No reabrir practitioner model.
- No fusionar planning y register.
- No rediseñar el read model global.

## 7) Criterios de aceptación

1. Desde `/encounters/register` se puede completar toda la carga clínica sin salto obligatorio a otra surface.
2. Los bloques clínicos requeridos por producto están disponibles en la misma pantalla desde el inicio.
3. `Guardado parcial` aplica regla mínima explícita y continuidad sobre `in-progress`.
4. `Registrar` aplica validaciones de cierre explícitas y finaliza encounter.
5. La UX deja de percibirse como dos formularios consecutivos.

## 8) Riesgos y mitigaciones

- **Riesgo:** desalinear semantics entre submit inicial y posteriores.  
  **Mitigación:** intención explícita por acción + contrato uniforme por estado (`sin encounterId` vs `con encounterId`).

- **Riesgo:** duplicar validación front/server.  
  **Mitigación:** server schemas como source-of-truth y form schema como feedback temprano.

- **Riesgo:** confusión entre register y detail canónico.  
  **Mitigación:** definir role claro de detail como lectura/cierre posterior no obligatorio para continuidad inmediata.

## 9) Resultado de implementación (runtime verificado)

- `/encounters/register` ahora expone desde el inicio los bloques clínicos completos en una sola surface.
- `Guardado parcial` inicial puede continuar en la misma route (sin redirect obligatorio a detail) y estabiliza continuidad con `encounterId`.
- `Registrar` mantiene cierre clínico explícito compatible con write flow vigente.
- `encounter detail` se mantiene como surface canónica secundaria.
