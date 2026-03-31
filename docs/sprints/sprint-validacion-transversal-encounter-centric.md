# Sprint — Validación transversal encounter-centric del circuito clínico

- Fecha: 2026-03
- Estado: Propuesto

## 1. Objetivo del sprint

Validar de forma fuerte y acotada que el circuito encounter-centric ya endurecido en detalle finished e in-progress se sostiene de punta a punta entre surfaces críticas, sin mezcla entre encounters y sin fallback temporal como source of truth fuera del modo longitudinal.

El objetivo no es construir nuevas features, sino cerrar incertidumbre operativa sobre el comportamiento real del sistema cuando los flujos ya implementados se usan de manera encadenada.

## 2. Problema que resuelve

Los sprints previos cerraron slices acotados:

- finished encounter detail validado como path canónico (bounded);
- in-progress encounter detail validado en continuidad (save → reload → rehydrate).

La incertidumbre actual es transversal:

¿estas garantías se sostienen cuando el usuario recorre múltiples surfaces del sistema?

Falta evidencia fuerte de que:

- no hay mezcla entre encounters al navegar;
- los loaders mantienen consistencia encounter-centric;
- los paths ya validados no se contradicen entre sí en flujo real.

## 3. Alcance

### Entra en este sprint

- validación transversal del circuito encounter-centric ya implementado;

- evidencia reproducible del flujo:

  - planned
    → startEncounterAction
    → encounter detail (in-progress)
    → saveEncounterProgressAction
    → reload / rehydrate
    → finalizeEncounterAction
    → encounter detail (finished)
- validación de no-mezcla entre encounters;
- consistencia entre patient detail y encounter detail;
- tests de integración acotados sobre surfaces críticas.

### No entra en este sprint

- features nuevas;
- refactor amplio de loaders/componentes;
- browser E2E completo (Playwright, etc.);
- hardening longitudinal/histórico global;
- tipado de ActionError.details;
- rediseño del lifecycle.

## 4. Hipótesis de trabajo

La base encounter-centric está endurecida a nivel de detalle.

El riesgo remanente es de integración entre surfaces, no de modelado local.

Este sprint busca validar comportamiento sistémico sin expandir scope funcional.

## 5. Nivel de evidencia esperado (definido upfront)

### Evidencia aceptada

- tests de integración route/data/render;
- validación de continuidad entre surfaces críticas;
- tests que validen comportamiento encounter-centric en flujo completo;
- mocks controlados de repositorios cuando sea necesario.

### Evidencia no requerida

- browser E2E full-stack;
- infraestructura nueva de testing;
- tests puramente visuales o snapshots;
- coverage total del sistema.

## 6. Riesgos principales

### Riesgo 1 — sobrealcance

Convertir el sprint en “E2E del sistema completo”.

### Riesgo 2 — reabrir deuda cerrada

No reabrir finished detail o in-progress detail sin evidencia de regresión real.

### Riesgo 3 — mezclar con longitudinal

No usar fallback temporal como criterio de validación encounter-centric.

### Riesgo 4 — ambigüedad en evidencia

Evitado definiendo upfront el nivel de integración aceptado.

## 7. Definición de done

El sprint se considera cerrado si:

- existe evidencia reproducible del circuito completo encounter-centric;
- no hay mezcla entre encounters en navegación y rehidratación;
- patient detail y encounter detail permanecen alineados por encounterId;
- los tests fallan si aparece fallback temporal en surfaces críticas;
- los límites del alcance quedan explícitamente documentados.

## 8. Orden de ejecución

1. definir contrato de validación transversal (T1);
2. auditar circuito crítico (T2);
3. construir evidencia positiva del flujo (T3);
4. agregar guardas negativas (T4);
5. cerrar documentación (T5).

## 9. Tickets del sprint

### T1 — Contrato de validación transversal encounter-centric

Definir:

- qué surfaces entran en validación;
- qué flujos se consideran críticos;
- qué queda explícitamente fuera;
- nivel de evidencia aceptado.

### Criterios

- definición explícita de “validación transversal”;
- separación clara entre encounter-centric vs longitudinal;
- encounterId como source of truth;
- nivel de integración de tests definido upfront.

### T2 — Auditoría cross-surface del circuito crítico

Revisar flujo:

- patient detail
- startEncounterAction
- encounter detail (in-progress)
- save-progress
- encounter detail (finished)

### Criterios

- identificación de puntos de posible ruptura;
- documentación de surfaces/loaders involucrados;
- no implementar correcciones salvo que sean mínimas y necesarias;
- gaps mayores → quedan como deuda o siguiente sprint.

### T3 — Validación positiva del circuito crítico

Construir tests que validen que el flujo funciona correctamente:

- start → in-progress → save → reload → finalize → read;
- continuidad de datos en el mismo encounter;
- consistencia entre surfaces.

### Criterios

- cobertura del flujo completo;
- evidencia de rehidratación correcta;
- evidencia de alineación entre patient detail y encounter detail.

### T4 — Guardas negativas contra fallback y mezcla

Agregar tests que fallen si:

- aparece fallback temporal como source of truth en surfaces encounter-centric;
- hay mezcla entre encounters del mismo paciente;
- se rompe aislamiento por encounterId.

### Criterios

- tests negativos claros;
- protección contra regresión;
- sin duplicar cobertura de T3.

### T5 — Cierre documental

Actualizar:

- sprint doc
- backlog
- validación arquitectónica
- checkpoint

### Criterios

- cierre evidence-based y acotado;
- no declarar E2E global;
- no cerrar deuda longitudinal;
- no sobredeclarar continuidad system-wide.

## 10. Criterios de aceptación

- el flujo encounter-centric puede recorrerse sin contaminación;
- la rehidratación se mantiene consistente entre surfaces;
- no hay fallback temporal en surfaces críticas;
- la evidencia es automatizada y reproducible;
- los límites están explícitos.

## 11. Evidencia mínima esperada

### Validación manual

- flujo completo in-progress con save-progress;
- flujo de cierre y lectura en finished;
- validación de dos encounters sin mezcla.

### Tests mínimos

- integración route/data entre patient y encounter detail;
- continuidad save → reload → render;
- no-mezcla entre encounters;
- prueba negativa ante fallback temporal.

## 12. Límites explícitos del cierre

Este sprint NO implica:

- browser E2E completo;
- continuidad system-wide total;
- cierre de deuda longitudinal/histórica;
- ausencia de problemas en datos legacy;
- refactor global del read model.

## 13. Resultado esperado

Al cerrar el sprint:

- las garantías encounter-centric dejan de ser locales;
- pasan a estar validadas como flujo clínico transversal;
- con evidencia fuerte, acotada y honesta.