# Sprint — Hardening acotado de ActionError.details fuera de encounter write (fase 3)

- Status: proposed
- Fecha: 2026-04-05

## 1. Objetivo

Cerrar o endurecer de forma acotada la extensión de `ActionError.details` fuera del frente encounter write, manteniendo estable el contrato de `ActionResult` y evitando cualquier rediseño global del subsistema de errores.

Este sprint es de hardening bounded: busca convergencia contractual verificable por perímetro, no una reingeniería transversal.

## 2. Problema a resolver

El estado documental vigente ya confirma un cierre acotado en encounter write:

- fase 1 cerró helper central + normalización base de variantes;
- fase 2 cerró `fhir.details` tipado/normalizado y adopción en las cinco Server Actions del frente encounter write.

Ese cierre no es global.

Fuera de encounter write, la extensión del tipado por capa de `ActionError.details` sigue abierta como deuda concreta por tres motivos:

1. falta de inventario explícito de adopción en otros frentes;
2. riesgo de drift contractual entre acciones/perímetros no cubiertos por fase 2;
3. validación arquitectónica y backlog aún lo dejan como pendiente fuera del frente encounter.

Ambigüedad documental a resolver en este sprint:

- `backlog` y `validación arquitectónica` reportan cierre bounded en encounter write + deuda abierta fuera de ese frente;
- `write-phase` todavía conserva wording transicional amplio para `ActionError.details`.

El sprint debe cerrar esta ambigüedad con evidencia de implementación por perímetro y actualización documental mínima, sin extrapolar cierre global.

## 3. Por qué ahora

Este sprint tiene mejor relación costo/valor ahora porque:

- toma una deuda técnica concreta, acotable y directamente alineada con ADR + validación vigente;
- evita reabrir frentes recientemente cerrados por evidencia (continuidad clínica bounded, browser E2E bounded, practitioner consistency encounter write, canonical finished detail acotado);
- evita retrabajo en longitudinal/histórico global donde no surgió bug runtime nuevo verificable en las surfaces auditadas.

Regla de prioridad de este sprint:

- priorizar convergencia contractual acotada donde hay gap real documentado;
- evitar sprints de revalidación sin evidencia nueva.

## 4. Autoridad y límites

### Autoridad

Este sprint se apoya en:

- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `docs/sprints/sprint-hardening-contrato-errores-actions-fase1.md`
- `docs/sprints/sprint—hardening-final-action-errordetails-fase2.md`
- `docs/sprints/sprint—practitioner-consistency-encounter-write-flows.md`
- `docs/sprints/sprint-continuidad-clinica-full-system.md`

### Límites no negociables

- no tocar continuidad clínica/read model como objetivo de sprint;
- no reabrir practitioner consistency en encounter write;
- no reabrir lifecycle ni canonical finished detail acotado;
- no reabrir longitudinal/histórico global sin evidencia nueva;
- no rediseñar `ActionResult`;
- no convertir este sprint en refactor de UX/render de errores.

## 5. Alcance incluido

Incluye:

1. **Baseline de adopción fuera de encounter write**
   - inventariar Server Actions/frentes fuera del perímetro encounter write;
   - registrar shape de `ActionError` que emite cada flujo en `validation`, `domain`, `fhir`.

2. **Matriz de adopción contractual actual**
   - matriz acción/frente -> helper usado, shape de `details`, nivel de tipado actual, gap detectado;
   - criterio uniforme para clasificar: `alineado`, `parcial`, `gap real`.

3. **Identificación de gaps reales (no nominales)**
   - distinguir drift documental vs gap de implementación verificable;
   - priorizar solo gaps con impacto contractual real.

4. **Hardening mínimo por perímetro**
   - ajustar tipos/helper/adopción solo en frentes con gap real confirmado;
   - mantener cambios pequeños, locales y compatibles.

5. **Cierre documental mínimo**
   - actualizar backlog/validación/sprint doc con el resultado real;
   - dejar explícito qué quedó cerrado en este sprint y qué no.

## 6. Alcance excluido

No incluye:

- rediseño global de `ActionResult` o de la taxonomía total de errores;
- refactor de UX de errores (banners, render de formularios, copy);
- cambios de lifecycle o write-flow clínico;
- hardening del read global/continuidad clínica/browser E2E;
- reapertura de practitioner consistency en encounter write;
- expansión a trabajo transversal indefinido fuera de acciones con gap confirmado.

## 7. Riesgos

1. **Scope creep a rediseño global**
   - riesgo: convertir un hardening acotado en una “fase total” de arquitectura de errores.
   - mitigación: perímetro explícito + matriz de gaps como gate de cambios.

2. **Tocar UX innecesariamente**
   - riesgo: mezclar tipado de contrato con rediseño de cómo UI muestra errores.
   - mitigación: UX fuera de alcance salvo ajuste mecánico imprescindible por tipo.

3. **Romper consumers actuales**
   - riesgo: cambios incompatibles en shapes consumidas por acciones existentes.
   - mitigación: preservar `layer/message/code`, mantener compatibilidad hacia atrás y adopción incremental.

4. **Confundir drift documental con gap de implementación**
   - riesgo: abrir cambios de código donde solo hay desalineación de wording.
   - mitigación: T1/T2 separan explícitamente “drift doc” de “gap runtime/contrato”.

## 8. Regla de implementación

Mantener como invariantes:

- `ActionResult` permanece contrato estable de Server Action;
- `layer`, `message`, `code` se preservan como top-level estables;
- la extensión de `details` se hace por adopción incremental y bounded;
- compatibilidad razonable con consumidores actuales;
- cualquier endurecimiento nuevo debe justificarse con gap real por perímetro.

Regla adicional de salida:

- si T2 no detecta gap real fuera de encounter write en un perímetro, ese perímetro no se toca en T3;
- un cierre con evidencia + documentación también es resultado válido.

## 9. Landing zone inicial

### Primaria

- tipos/helpers compartidos de `ActionResult`/`ActionError`;
- Server Actions fuera de encounter write que hoy devuelven `ActionResult`;
- tests de contrato de acciones impactadas.

### Secundaria

- documentación de validación y backlog para sincronizar estado final;
- tests existentes que ya validen shape de error en acciones no encounter.

### No primaria

- loaders/read model;
- continuidad clínica/browser E2E;
- practitioner/lifecycle;
- componentes visuales de UX de errores.

## 10. Ejecución propuesta

### T1 — Baseline de adopción fuera de encounter write

Entregable obligatorio:

- inventario de acciones/perímetros fuera de encounter write;
- para cada acción: helper usado, variantes de error emitidas, shape actual de `details`, estado de tipado.

### T2 — Matriz de gaps

Entregable obligatorio:

- matriz con clasificación por acción/perímetro:
  - `alineado`;
  - `parcial`;
  - `gap real`.
- separación explícita entre:
  - drift documental;
  - gap verificable de implementación/contrato.

### T3 — Hardening mínimo por perímetro

Regla de ejecución:

- intervenir solo en filas `gap real` de T2;
- aplicar cambios mínimos en tipos/helper/adopción;
- mantener compatibilidad top-level y evitar rediseño transversal.

Entregable obligatorio:

- cambios acotados por perímetro con justificación directa al gap;
- evidencia de no-regresión contractual en acciones tocadas.

### T4 — Regresión + documentación mínima

Entregable obligatorio:

- pruebas/guards de contrato en acciones impactadas;
- actualización de:
  - `docs/backlog.md`
  - `docs/validation/validacion-arquitectonica.md`
  - este sprint doc
- wording final alineado: cierre bounded real, sin claims globales.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

1. existe baseline explícito de adopción de `ActionError.details` fuera de encounter write;
2. existe matriz de gaps con clasificación verificable por acción/perímetro;
3. cualquier cambio de código se limita a gaps reales confirmados;
4. `ActionResult` se mantiene estable y `layer/message/code` no se rompe;
5. no se reabren continuidad/read/practitioner/lifecycle ni longitudinal global;
6. la documentación final refleja cierre acotado real y deuda remanente sin sobredeclaración.

## 12. Definición de done

- T1 cerrado con inventario completo del perímetro objetivo;
- T2 cerrado con matriz de gaps y separación doc-drift vs gap real;
- T3 ejecutado solo donde hubo `gap real`;
- T4 cerrado con evidencia de regresión mínima + docs sincronizadas;
- sin scope creep a frentes ya cerrados;
- sin rediseño global de contrato ni UX.

---

### Nota de alcance final

Este sprint no reemplaza ni invalida cierres previos en alcance acotado.

Su éxito depende de mantener una frontera clara: extender hardening contractual de `ActionError.details` fuera de encounter write con costo controlado y evidencia verificable, sin convertir el frente en trabajo transversal infinito.
