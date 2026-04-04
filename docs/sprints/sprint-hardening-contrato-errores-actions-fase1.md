# Sprint propuesto — Hardening del contrato de errores de Server Actions (fase 1)

- Fecha: 2026-04
- Estado: proposed

## 1. Objetivo

Endurecer el contrato de errores de Server Actions sin romper compatibilidad con los consumidores actuales, introduciendo una normalización central de ActionError y cerrando una fase 1 de tipado útil para validation y domain, mientras fhir queda formalizado como variante transicional explícita, todavía no definitiva.

La dirección de este cambio ya está aceptada por la arquitectura vigente: ActionResult sigue siendo el contrato estable en Server Actions, mientras ActionError.details debe evolucionar desde unknown hacia variantes tipadas por capa sin romper layer/message/code.

## 2. Problema a resolver

El sistema ya tiene un contrato top-level razonablemente estable para errores en Server Actions, pero details sigue transicional y la construcción de errores está dispersa entre acciones.

Hoy la deuda no es solamente de tipos. El problema estructural es que no existe un punto único de construcción/normalización del contrato de error. Eso aumenta riesgo de drift entre acciones, hace más difícil endurecer variantes por capa y deja a fhir mezclado con productores heterogéneos.

La validación arquitectónica vigente ya marca este frente como parcialmente válido: el contrato base existe, pero ActionError.details sigue abierto como deuda.

## 3. Por qué este sprint tiene sentido

Este sprint no abre un frente inventado ni redefine arquitectura. Toma una dirección ya aceptada por la documentación de autoridad y la convierte en un cierre acotado, verificable y útil.

Además, es un buen candidato de fase 1 porque:

- la UI actual depende principalmente de error.layer, error.message y error.code;
- validation y domain son capas más estables y predecibles que fhir;
- permite invertir en una base reusable antes de endurecer la rama más heterogénea.

## 4. Alcance incluido

Incluye:

- definición explícita del contrato fase 1 para validation, domain y fhir;
- creación de un helper central de construcción/normalización de ActionError;
- migración progresiva de las Server Actions principales a ese helper;
- blindaje mínimo del contrato mediante tests concretos;
- actualización documental obligatoria para dejar explícito qué quedó cerrado y qué no.

## 5. Alcance excluido

No incluye:

- cierre fuerte del modelado final de fhir;
- cambios de UI para explotar details enriquecido;
- cambios de lifecycle;
- cambios de canonical read;
- practitioner consistency;
- refactor funcional amplio de repositorios o producto.

## 6. Decisiones de diseño que este sprint debe fijar

### 6.1 Ubicación del helper

El helper central debe vivir junto al contrato compartido de errores, en domain/shared/, salvo que aparezca una restricción fuerte que obligue a justificar otra ubicación.

La presunción arquitectónica del sprint es que la normalización del contrato de error debe quedar cerca de ActionResult / ActionError, no dispersa en app/ ni mezclada con infraestructura.

### 6.2 Estado de DomainRuleError

La fase 1 asume sin rediseño obligatorio de DomainRuleError.

El helper debe poder envolver el shape existente. Solo si durante la ejecución aparece una carencia concreta para sostener el contrato de domain, se permite una ampliación mínima y explícita. No forma parte del sprint rediseñar en abierto esta clase/error.

### 6.3 Contrato transicional explícito para fhir

Este sprint debe cerrar con precisión una variante transicional para fhir, para evitar reinterpretaciones posteriores.

En fase 1, la rama fhir debe garantizar:

- layer: "fhir"
- message: string
- code?: string
- details?: unknown

Regla operativa adicional:

- el helper debe aceptar payloads FHIR heterogéneos existentes (OperationOutcome, outcome, data, etc.) y encapsularlos sin prometer todavía un shape final fuerte;
- la rama fhir queda centralizada y controlada por el helper;
- queda explícitamente fuera de alcance presentar esta fase como cierre del modelado final de fhir.

## 7. Riesgos principales

### 7.1 Scope creep hacia fhir fuerte

El mayor riesgo es intentar cerrar el tipado fuerte completo de fhir en el mismo sprint. Eso ampliaría el alcance y aumentaría la imprevisibilidad del refactor.

### 7.2 Quedarse solo en “tipos”

Si el sprint endurece interfaces pero no centraliza la construcción de errores, mejora el tipado pero no corrige la fuente estructural del drift.

### 7.3 Sobredeclarar impacto

Este sprint mejora contrato, consistencia y mantenibilidad, pero no debe venderse como una mejora UX visible de gran impacto. Su valor principal es arquitectónico y de evolución futura.

## 8. Ejecución propuesta

### T1 — Baseline contractual bloqueante de ActionError fase 1

Definir el contrato exacto de salida del helper para las tres ramas:

- validation
- domain
- fhir

Debe incluir:

- shape exacta de validation.details;
- shape exacta o mínima de domain;
- definición explícita de la rama fhir como transicional controlada;
- ejemplos concretos de salida esperada del helper.

Resultado esperado: T1 deja especificado no solo los tipos, sino también el contrato observable que T2 debe implementar.

Dependencia: T1 es bloqueante para T2.

### T2 — Helper central de construcción/normalización

Implementar el helper compartido en domain/shared/ para producir ActionError homogéneo.

Debe cubrir al menos:

- normalización desde ZodError.flatten();
- normalización desde DomainRuleError;
- normalización transicional desde errores FHIR existentes.

Resultado esperado: punto único de construcción del contrato de error, sin reinterpretación por action.

### T3 — Migración progresiva de Server Actions por orden de riesgo

Migrar en este orden:

- startEncounterAction
- createEncounterAction
- saveEncounterProgressAction
- registerEncounterAction
- finalizeEncounterAction

La lógica es validar el helper primero en flujos más simples y dejar finalizeEncounterAction al final por ser la acción más crítica y heterogénea del sistema.

Resultado esperado: adopción incremental con menor riesgo de regresión.

### T4 — Blindaje de regresión del contrato con escenarios concretos

Agregar tests que cubran, como mínimo:

- error de validación desde ZodError.flatten() produce:
- layer: "validation"
- message estable
- details con shape esperada de fase 1
- error de dominio desde DomainRuleError produce:
- layer: "domain"
- message estable
- code preservado cuando exista
- shape esperada de fase 1
- error FHIR produce:
- layer: "fhir"
- message estable
- code cuando aplique
- details encapsulado por el helper sin requerir shape final cerrada
- los consumidores actuales que dependen de error.layer, error.message o error.code no requieren cambios por esta migración

Resultado esperado: blindaje real del contrato, no tests vagos de “sigue funcionando”.

### T5 — Alineación documental obligatoria

Actualizar obligatoriamente:

- docs/backlog.md
- docs/validation/validacion-arquitectonica.md

Y, si corresponde por claridad de estado, una nota breve en la documentación arquitectónica vigente.

Debe quedar explícito que:

- fase 1 cierra normalización central + hardening de validation/domain;
- fhir sigue abierto como variante transicional;
- no se cerró el modelado final completo de ActionError.details.

## 9. Criterios de aceptación

El sprint se considera cumplido si:

- existe una especificación explícita de fase 1 para las ramas validation, domain y fhir;
- existe un helper central compartido en la ubicación acordada;
- validation queda endurecido con details estable de fase 1;
- domain queda normalizado bajo contrato homogéneo;
- fhir queda centralizado en una rama transicional explícita, sin claims de cierre final;
- startEncounterAction, createEncounterAction, saveEncounterProgressAction, registerEncounterAction y finalizeEncounterAction migran al helper en el orden definido;
- ningún consumidor actual que dependa de error.layer, error.message o error.code requiere cambios como consecuencia de este sprint;
- los escenarios mínimos de T4 quedan cubiertos por tests;
- la documentación deja explícito el cierre parcial y la deuda remanente.

## 10. Definición de done

- T1 cerrado y usado como baseline de implementación;
- helper implementado en ubicación acordada;
- acciones migradas en orden de riesgo;
- tests de contrato pasando;
- documentación actualizada;
- sin mezclar alcance con otros tracks.

## 11. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- ActionResult estable y preservado;
- ActionError más consistente entre acciones;
- validation y domain endurecidos en fase 1;
- fhir centralizado bajo una variante transicional explícita;
- menor riesgo de drift futuro en el boundary de Server Actions.

Esto no cierra el modelado final de details, pero sí deja una base mucho más sólida para una fase 2.

## 12. Próximo paso después del sprint

Con esta fase cerrada, el próximo movimiento natural sería una fase 2 de endurecimiento de fhir, ya sobre una base centralizada y sin drift entre acciones. Ese paso no forma parte de este sprint.