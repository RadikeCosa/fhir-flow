# Sprint — Hardening final de ActionError.details por capa (fase 2)

- Status: proposed
- Fecha: 2026-04-04

## 1. Objetivo

Cerrar la transición restante del contrato de errores del write flow, consolidando ActionError.details como shape tipado por capa sin romper el contrato estable de ActionResult.

El foco del sprint es completar el tramo que hoy sigue abierto en fhir, manteniendo como invariantes estables:

- layer
- message
- code

y evitando que la UI tenga que consumir details como unknown en los flujos de escritura incluidos en este sprint.

## 2. Problema a resolver

La arquitectura ya dejó cerrada la dirección correcta del contrato de errores:

- ActionResult sigue siendo el contrato estable de Server Action;
- layer/message/code son estables;
- details debe evolucionar hacia variantes tipadas por capa.

Hoy ese camino está cerrado solo en forma parcial:

- validation y domain ya cuentan con hardening fase 1;
- fhir sigue transicional con details opcional / unknown.

Eso deja tres problemas concretos:

- la UI no puede consumir de forma totalmente segura los errores FHIR;
- el contrato global de errores sigue mezclando variantes tipadas con una rama todavía transicional;
- la implementación real todavía no alcanza el nivel de cierre que ya definen ADR y write-phase como dirección del sistema.

## 3. Por qué este sprint tiene sentido ahora

Es el próximo paso más quirúrgico y mejor justificado por el estado actual del repo:

- el backlog lo deja como fase siguiente junto con practitioner consistency;
- la validación arquitectónica lo reporta como parcial, con fase 1 ya cerrada y fase siguiente pendiente;
- no requiere reabrir el frente longitudinal/histórico, que fue auditado sin gap técnico nuevo verificable fuera del closure acotado;
- está directamente alineado con la autoridad documental del write flow y del ADR.

## 4. Alcance incluido

Incluye:

### Cierre tipado de la variante fhir

- definir shape estable para details en errores FHIR;
- dejar de tratar esa rama como unknown en los flujos cubiertos.

### Consolidación del contrato global de ActionError

- mantener ActionResult como contrato estable;
- consolidar discriminación por layer.

### Alineación de helpers y tipos shared

- endurecer domain/shared/action-error.helpers.ts y tipos asociados;
- asegurar consistencia entre acciones incluidas en el sprint.

### Adopción explícita en Server Actions incluidas

este sprint incluye únicamente las acciones de write del frente encounter:

- createEncounterAction
- startEncounterAction
- saveEncounterProgressAction
- finalizeEncounterAction
- registerEncounterAction

cualquier otra acción queda fuera de alcance en este sprint.

### Blindaje por tests

- tests unitarios del helper central;
- tests del contrato de error en las Server Actions incluidas;
- evidencia suficiente para validar que la rama fhir deja de depender de unknown en este frente.

## 5. Alcance excluido

No incluye:

- reabrir hardening longitudinal/histórico;
- reabrir app/patients/[id]/encounters/data.ts;
- browser E2E global;
- refactor amplio de loaders/read model;
- cambios de lifecycle;
- practitioner consistency como objetivo principal;
- rediseño de UX de errores;
- extensión del nuevo contrato a flujos no pertenecientes al frente encounter.

## 6. Riesgos principales

### 6.1 Riesgo de romper compatibilidad

Si el shape final cambia demasiado, puede romper consumidores existentes del helper o de las Server Actions.

Mitigación: mantener layer/message/code intactos y acotar la adopción al frente encounter.

### 6.2 Riesgo de sobrediseño

Intentar cerrar “el contrato perfecto” en una sola pasada puede inflar innecesariamente el scope.

Mitigación: T2 debe cerrar un shape mínimo, pequeño y suficiente para el estado real actual.

### 6.3 Riesgo de mezclar capa de error con UX

Al tocar el contrato tipado, puede aparecer la tentación de rediseñar cómo la UI muestra errores.

Mitigación: en este sprint la UI solo recibe un contrato más seguro; no se reescribe lógica de render ni comportamiento visual salvo ajuste mecánico imprescindible de tipado.

### 6.4 Riesgo de scope creep por practitioner context

Durante T4 pueden aparecer inconsistencias reales de practitioner context en acciones de write.

Mitigación: si durante T4 se detecta un problema de practitioner context, se documenta y se abre ticket separado; no se resuelve dentro de este sprint salvo que bloquee de forma directa el contrato de error.

## 7. Regla de implementación

Mantener la dirección ya definida por autoridad:

- ActionResult no se reemplaza;
- layer/message/code siguen siendo top-level estables;
- details se tipa por variante/capa;
- Server Action sigue siendo el boundary que devuelve el contrato;
- repository y mapper no pasan a devolver ActionResult.

Regla adicional de perímetro:

- el sprint solo toca el frente encounter definido en la sección 4;
- si aparece una deuda transversal distinta del contrato de error, se registra fuera de sprint.

## 8. Landing zone inicial

### Primaria

- domain/shared/action-result.types.ts
- domain/shared/action-error.helpers.ts

### Secundaria

- Server Actions incluidas del frente encounter
- tests asociados a tipos, helper y acciones

### No primaria

- UI de formularios
- componentes visuales de error
- read model
- loaders longitudinales
- practitioner context como tema de refactor

## 9. Ejecución propuesta

### T1 — Baseline del contrato actual

Inventariar el shape vigente de ActionError.
Inventariar explícitamente qué devuelve hoy cada Server Action incluida en la rama fhir.
Confirmar qué ramas ya están endurecidas (validation, domain) y qué sigue abierto en fhir.

Entregable obligatorio de T1: matriz mínima por acción con:

- acción,
- variantes de error que devuelve hoy,
- shape actual de details en fhir,
- helper usado,
- gap detectado.

### T2 — Decisión documentada del shape tipado para fhir

Definir una variante concreta, estable y pequeña para details de fhir.
Mantener compatibilidad con layer/message/code.
Cerrar esta decisión antes de pasar a T3.

Entregable obligatorio de T2: decisión documentada del shape final de fhir, incluyendo:

- campos incluidos;
- campos explícitamente no incluidos;
- razón de diseño mínima;
- ejemplo de payload esperado.

#### Decisión T2 — shape tipado para fhir.details

A partir del baseline de T1, se adopta para este sprint una única variante normalizada de fhir.details en el frente encounter write.

#### Decisión

El objetivo de T2 no es modelar exhaustivamente cada causa posible de error FHIR, sino cerrar la heterogeneidad actual con un contrato pequeño, estable y utilizable por las Server Actions incluidas en el sprint.

Se define como dirección de implementación:

```ts
type FhirActionErrorDetails = {
  cause?:
    | "operation_outcome"
    | "http_error"
    | "mapper_error"
    | "not_found"
    | "unexpected_fhir_error";

  operationOutcome?: OperationOutcome;
  statusCode?: number;
  resourceType?: string;
  raw?: unknown;
};
```

#### Alcance de esta decisión

Aplica únicamente al frente de encounter write incluido en este sprint:

- createEncounterAction
- startEncounterAction
- saveEncounterProgressAction
- finalizeEncounterAction
- registerEncounterAction

No redefine el contrato de validation ni domain.
No reemplaza ActionResult.
No introduce rediseño de UX ni cambios de render de errores.

#### Criterios de diseño adoptados

1. Un único shape normalizado

No se introducen en esta fase sub-shapes discriminados por code o por causa específica.
La prioridad del sprint es eliminar la heterogeneidad actual de fhir.details, no diseñar una taxonomía completa de errores FHIR.

2. details permanece opcional

La rama fhir deja de depender de unknown en este frente, pero no se fuerza details como obligatorio en todos los casos.
Esto evita inventar payloads artificiales en errores donde hoy no existe información estructurada útil.

3. cause como clasificación mínima estable

Se agrega cause para expresar de manera uniforme el origen del error FHIR sin obligar a múltiples variantes de contrato.

Los valores adoptados en esta fase son:

- operation_outcome
- http_error
- mapper_error
- not_found
- unexpected_fhir_error

4. operationOutcome como payload estructurado prioritario

Cuando exista información FHIR estructurada del backend, debe priorizarse operationOutcome como campo explícito del contrato.

5. raw como contenedor residual controlado

La heterogeneidad residual que hoy aparece como error.outcome, error.data u otros payloads no normalizados se encapsula temporalmente en raw.

raw no debe convertirse en vía libre para volver a introducir details amorfo; su uso en esta fase es transicional y controlado para absorber diferencias reales del estado actual sin bloquear el cierre del contrato.

#### Regla de construcción

A partir de esta decisión, la construcción de errores de capa fhir en las acciones incluidas del sprint debe pasar por helper central obligatorio.

Consecuencia práctica:

- no se permiten nuevos inline literals para errores fhir;
- T3/T4 deben converger la construcción hacia un único punto shared;
- la estabilidad top-level de layer, message y code permanece intacta.

#### Qué queda explícitamente fuera de T2

Esta decisión no intenta:

- modelar distinto details para cada code;
- cerrar una taxonomía exhaustiva de errores FHIR;
- resolver practitioner consistency;
- tocar validation o domain;
- extender automáticamente este contrato a flujos fuera del frente encounter.

#### Resultado esperado de T2

Con esta decisión cerrada, T3 puede implementar un contrato fhir.details:

- tipado,
- uniforme,
- helper-driven,
- compatible con ActionResult,
- y suficientemente pequeño como para no reabrir scope innecesario.

### T3 — Implementación shared

Aplicar el shape definido en T2 en tipos y helper central.
Evitar duplicación ad hoc entre acciones.
Mantener compatibilidad hacia el boundary de Server Action, según la regla de implementación de la sección 7.
Mantener compatibilidad hacia el boundary de Server Action significa, en este sprint, no reemplazar ActionResult, no alterar la estabilidad de layer/message/code y no mover ese contrato a repository o mapper.

### T4 — Adopción en las Server Actions incluidas

Ajustar únicamente:

- createEncounterAction
- startEncounterAction
- saveEncounterProgressAction
- finalizeEncounterAction
- registerEncounterAction

Mantener la semántica actual de éxito/error.
No expandir el cambio a otros flujos.

Regla explícita: si en T4 aparece un problema de practitioner context, se registra como deuda/ticket aparte y no se absorbe en este sprint.

### T5 — Blindaje y cierre documental mínimo

Agregar tests unitarios del helper central.
Agregar tests del contrato de error en las Server Actions incluidas.
Actualizar backlog / validación arquitectónica / sprint doc solo en el wording mínimo necesario.

## 10. Criterios de aceptación

El sprint se considera cumplido si:

- ActionResult permanece estable como contrato de Server Action;
- ActionError conserva layer/message/code estables;
- la rama fhir deja de depender de details: unknown en las acciones incluidas en este sprint;
- existe helper central consistente para construir errores por capa;
- las cinco Server Actions incluidas usan el contrato consolidado;
- existe evidencia automatizada concreta, compuesta por:
- tests unitarios del helper central, y
- tests del contrato de error en las acciones incluidas;
- el sprint no reabre otros tracks no relacionados.

## 11. Definición de done

- T1–T5 cerrados;
- matriz baseline por acción completada;
- decisión documentada de T2 cerrada antes de T3;
- contrato tipado por capa consolidado al menos para encounter write;
- backlog y validación arquitectónica actualizados en forma mínima;
- sin reabrir read-global ni practitioner consistency;
- sin introducir un contrato alternativo a ActionResult.

## 12. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- mejor seguridad de tipos en errores de escritura;
- menos branching defensivo alrededor de la rama fhir;
- mejor alineación entre ADR, write-phase y runtime real;
- menor ambigüedad para UI y Server Actions al consumir details.

## 13. Próximo paso después de este sprint

Una vez cerrado este frente, el siguiente track lógico sigue siendo:

- practitioner consistency en todos los write inputs/flows,

porque la validación arquitectónica todavía lo reporta como parcialmente válido