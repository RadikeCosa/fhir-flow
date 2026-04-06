# Sprint — Auditoría bounded v2 de continuidad clínica transversal

- Status: proposed
- Fecha: 2026-04-06
- Tipo: validación bounded (test-first)

## 1. Objetivo

Ejecutar una validación bounded, test-first, para determinar con evidencia si existe un gap runtime real de continuidad clínica fuera del cierre encounter-centric ya validado en alcance acotado.

Este sprint:

- no parte de un bug confirmado;
- no habilita implementación expansiva;
- no habilita hardening productivo salvo que aparezca un gap runtime reproducible.

## 2. Problema a resolver

El repositorio ya cerró, en alcance acotado y por evidencia, frentes relevantes:

- practitioner consistency en encounter write;
- ActionError fase 2 en encounter write;
- ActionError fase 3 fuera de encounter write (cierre por evidencia diagnóstica/documental, sin perímetro operativo actual);
- continuidad clínica bounded;
- cobertura browser bounded faltante en continuidad;
- canonical read de finished encounter detail (alcance acotado);
- hardening longitudinal/histórico TG1 en surfaces auditadas (sin gap runtime nuevo verificable).

Lo que sigue abierto no es un bug confirmado, sino una deuda amplia: validar continuidad clínica más allá del slice encounter-centric ya cerrado, manteniendo alcance bounded y evitando tratar la deuda abierta como hardening por defecto.

Ambigüedad documental a resolver en este sprint:

- conviven cierres acotados correctos con deuda amplia abierta;
- existe riesgo de interpretar deuda amplia como obligación inmediata de implementación;
- existe riesgo opuesto de interpretar cierres bounded como cierre total.

Este sprint busca resolver esa ambigüedad con matriz de evidencia y decisión explícita por invariant.

## 3. Por qué ahora

Este sprint tiene mejor relación costo/valor que abrir otros frentes porque:

- reutiliza landing zones reales ya existentes (loaders, tests integrados y specs browser);
- evita reabrir practitioner consistency, que está cerrado en su perímetro;
- evita reabrir ActionError fuera de encounter write, donde hoy no hay perímetro operativo real;
- evita reabrir longitudinal/histórico por hipótesis, dado que TG1 cerró por evidencia en surfaces auditadas;
- reduce incertidumbre operativa donde todavía existe deuda abierta con superficie técnica verificable.

## 4. Autoridad y límites

### Autoridad

Este sprint se redacta y ejecuta contra:

- `docs/backlog.md`
- `docs/validation/validacion-arquitectonica.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`
- `docs/write-phase-architecture.md`
- `docs/architecture/current/app-architecture-checkpoint-2026-03.md`
- `docs/guia-rapida.md`

Y contrasta explícitamente con:

- `docs/sprints/sprint-continuidad-clinica-full-system.md`
- `docs/sprints/sprint-validacion-bounded-cobertura-browser-faltante-continuidad-clinica-2026-04-05.md`
- `docs/sprints/sprint—hardening-global-contrato-longitudinal-histórico-fuera-cierre-acotado.md`
- `docs/sprints/sprint—practitioner-consistency-encounter-write-flows.md`
- `docs/sprints/sprint-hardening-acotado-actionerror-details-fuera-encounter-write-fase3-2026-04-05.md`

### Límites explícitos (no negociables)

- no reabrir practitioner consistency;
- no reabrir ActionError fuera de encounter write;
- no reabrir cobertura browser bounded ya cerrada;
- no convertir este sprint en rediseño longitudinal/charts;
- no tocar runtime productivo sin bug reproducible.

## 5. Alcance incluido

El sprint parte de una **matriz bounded de surfaces e invariantes**.

La lista inicial propuesta es concreta y acotada; T1 puede validarla o ajustarla mínimamente, pero no reinventarla desde cero.

### Surfaces candidatas iniciales

1. **Patient detail** (`app/patients/[id]/data.ts`)
   - Invariante base:
     - source selection consistente (`inProgressEncounter ?? lastFinishedEncounter`);
     - datasets clínicos del mismo `encounterId` seleccionado;
     - no-mezcla con sibling encounter.

2. **Encounter detail** (`app/patients/[id]/encounters/[encounterId]/data.ts`)
   - Invariante base:
     - lectura por `encounterId` y guardas de pertenencia paciente/encounter;
     - rehidratación coherente para `in-progress`;
     - sin fallback temporal como source-of-truth encounter-centric.

3. **History / resumen asociado** (`app/patients/[id]/encounters/data.ts`)
   - Invariante base:
     - separación explícita entre composición longitudinal y maps encounter-centric;
     - fallback por fecha acotado a longitudinal;
     - no filtración a cards/maps encounter-centric.

4. **Contrato cross-surface existente**
   - `app/patients/[id]/__tests__/cross-surface.contract.test.ts`
   - Invariante base:
     - coherencia entre selección clínica de patient detail y membresía/semántica de history.

5. **Specs browser existentes (sin ampliar scope funcional)**
   - `e2e/flows/encounter-continuity.spec.ts`
   - `e2e/flows/encounter-finalize.seeded.spec.ts`
   - Invariante base:
     - continuidad en los escenarios ya definidos;
     - contraste de outcomes post-finalize contractuales ya vigentes.

## 6. Alcance excluido

Queda explícitamente fuera de este sprint:

- features nuevas;
- rediseño de read model global;
- rediseño de charts o del modelo longitudinal;
- cambios de lifecycle;
- cambios de practitioner/identity;
- extensión de ActionError a frentes inexistentes fuera de encounter write;
- refactor amplio de repositorios/loaders;
- hardening productivo preventivo sin gap reproducible;
- reabrir cierres bounded previos por sospecha abstracta.

## 7. Riesgos

1. **Scope creep hacia read model global**
   - Riesgo: transformar auditoría bounded en rediseño estructural.
   - Mitigación: matrix-first + guardrails + cambios solo ante falla reproducible.

2. **Reabrir longitudinal por hipótesis**
   - Riesgo: tocar composición longitudinal sin evidencia nueva.
   - Mitigación: mantener entrada test-first y regla de no reapertura por intuición.

3. **Confundir deuda amplia con bug reproducible**
   - Riesgo: tratar “deuda abierta” como “incidente confirmado”.
   - Mitigación: clasificación obligatoria por invariant en T3.

4. **Convertir validación en implementación**
   - Riesgo: empezar a corregir antes de cerrar baseline de evidencia.
   - Mitigación: T1/T2 bloqueantes; T4 condicionado por evidencia.

5. **Ambigüedad documental residual**
   - Riesgo: cerrar wording sin distinguir alcance real.
   - Mitigación: T5 obliga cierre documental con límites explícitos.

## 8. Regla de implementación

Reglas operativas del sprint:

- si no hay bug reproducible, no hay hardening;
- si aparece gap real, el hardening posterior debe ser mínimo y localizado;
- `app/patients/[id]/encounters/data.ts` entra como referencia diagnóstica por defecto;
- `app/patients/[id]/encounters/data.ts` solo puede tocarse si hay falla verificable y localizada en esa capa;
- ninguna corrección productiva se inicia antes de completar T1 + T2 + clasificación T3.

## 9. Landing zone inicial

### Primaria

- `app/patients/[id]/data.ts`
- `app/patients/[id]/encounters/[encounterId]/data.ts`
- `app/patients/[id]/__tests__/cross-surface.contract.test.ts`
- `app/patients/[id]/__tests__/data.test.ts`
- `app/patients/[id]/encounters/__tests__/data.test.ts`
- `e2e/flows/encounter-continuity.spec.ts`
- `e2e/flows/encounter-finalize.seeded.spec.ts`

### Secundaria

- `app/patients/[id]/encounters/data.ts` (diagnóstico, lectura de límites y confirmación de contrato)
- documentación de cierre de sprints recientes para trazabilidad de invariantes

### No primaria

- charts/formatters como punto de entrada del análisis;
- acciones/repositories de encounter write ya cerradas en practitioner/ActionError;
- cualquier área fuera del frente de continuidad clínica bounded.

## 10. Ejecución propuesta

### T1 — Matriz bounded de surfaces e invariantes

Construir matriz inicial (surface, invariant, evidencia disponible, hueco pendiente, prioridad), validando o ajustando mínimamente la lista del punto 5.

Entregables:

- matriz completa y comparable;
- lista explícita de surfaces fuera de alcance;
- confirmación de que no se reabre ningún frente cerrado.

### T2 — Baseline de evidencia existente

Cruzar la matriz con evidencia ya disponible (integración/browser/docs de cierre), sin producir todavía cambios productivos.

Entregables:

- baseline por invariant: cubierto / parcialmente cubierto / no cubierto;
- registro de evidencia faltante mínima para decidir cada invariant.

### T3 — Resolución de gaps

Clasificar cada hueco detectado en una de estas salidas válidas:

1. **Refutado por evidencia** (no gap runtime).
2. **Deuda tolerable** (gap real o fricción real, pero aceptado como deuda conocida en este sprint).
3. **Gap real reproducible** (habilita T4).
4. **Requiere evidencia mínima adicional** (agregar prueba acotada antes de decidir).

Importante: T3 no es binario bug/no bug. Debe permitir explícitamente “gap real pero aceptado como deuda conocida” cuando corresponda.

### T4 — Hardening mínimo condicionado

Solo se ejecuta para ítems T3 clasificados como “gap real reproducible”.

Reglas:

- cambio mínimo, localizado y justificado por falla previa;
- sin refactor amplio;
- sin expansión de scope;
- mantener guardrails de este sprint.

Si T3 no detecta gap reproducible, T4 puede cerrarse sin cambios productivos.

### T5 — Cierre documental

Actualizar de forma acotada:

- resultado por invariant;
- qué quedó refutado;
- qué quedó como deuda tolerable;
- qué requirió hardening mínimo (si aplica);
- límites explícitos para evitar lectura de cierre global.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

- existe matriz bounded de surfaces e invariantes con estado por fila;
- se ejecuta baseline de evidencia sin saltar a implementación;
- T3 clasifica todos los huecos con una de las 4 salidas definidas;
- cualquier cambio productivo (si existiera) está precedido por falla reproducible;
- no se reabren practitioner, ActionError fuera de encounter write ni cobertura browser bounded ya cerrada;
- el cierre documental diferencia deuda real, deuda tolerable y deuda nominal/documental;
- no se declara cierre global del frente.

## 12. Definición de done

- T1 cerrado con matriz bounded validada.
- T2 cerrado con baseline de evidencia consolidado.
- T3 cerrado con clasificación completa por invariant.
- T4 cerrado (con fix mínimo justificado o explícitamente sin cambios).
- T5 cerrado con documentación alineada y límites explícitos.
- Sin desvíos de scope ni reapertura de frentes cerrados.

## 13. Impacto esperado

Al cerrar este sprint se espera:

- reducir incertidumbre real en continuidad clínica transversal dentro de un perímetro bounded;
- mejorar la separación entre:
  - deuda real con landing zone,
  - deuda tolerable,
  - deuda nominal/documental sin perímetro operativo actual;
- sostener decisiones cerradas sin sobredeclarar cierre global;
- dejar una base de decisión más precisa para un eventual hardening posterior, solo donde la evidencia lo justifique.
