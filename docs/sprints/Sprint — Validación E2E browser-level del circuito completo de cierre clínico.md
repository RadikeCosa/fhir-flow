# Sprint — Validación E2E browser-level del circuito completo de cierre clínico

## 1. Objetivo

Validar en browser real el flujo clínico principal encounter-centric:

in-progress -> finalize -> finished -> encounter detail read-only -> patient detail source switch

incluyendo:

- lectura SSR real
- navegación real
- submit real de Server Action
- persistencia real contra FHIR
- revalidación entre routes
- consistencia de datasets por encounterId

## 2. Problema a resolver

Ya existe evidencia fuerte en integración y en E2E acotado de continuidad save -> reload -> rehydrate, pero todavía falta validar en runtime real el circuito completo de cierre clínico.

La brecha principal no es solo UI: también falta asegurar que el entorno E2E sea determinístico frente a un servidor HAPI FHIR real.

Riesgos actuales:

- estado contaminado en FHIR
- finalize correcto en backend pero inconsistente en UI
- redirect/revalidate no determinísticos
- source switch incorrecto en patient detail
- mezcla de datos post-finalize

## 3. Decisión previa obligatoria

Antes de ejecutar el sprint debe quedar cerrada esta decisión:

¿Cómo se controla el estado del servidor FHIR para E2E?

Opciones posibles:

- HAPI FHIR local dedicado para tests
- recomendado si querés validar stack real end-to-end
- requiere setup/cleanup explícito de recursos
- Ambiente dedicado persistente
- más frágil
- alto riesgo de contaminación de datos
- Mock de capa FHIR
- reduce realismo
- deja de ser E2E real del stack

### Decisión recomendada

Usar HAPI FHIR local dedicado para tests, levantado específicamente para el suite E2E, con dataset reproducible sembrado para cada corrida o para cada bloque de tests.

👉 Sin esta decisión cerrada, el sprint no tiene base determinística.

## 4. Alcance

### Incluye

- Flujo principal
- partir de un encounter en in-progress
- completar finalización con payload clínico mínimo válido
- ejecutar finalize
- validar redirect
- validar finished encounter detail
- validar modo read-only con criterio observable
- navegar a patient detail
- validar source switch correcto
- validar consistencia clínica por encounterId

### Invariantes críticos

- identidad por encounterId
- no mezcla entre encounters
- revalidación efectiva entre routes
- datasets consistentes en surfaces activas

### No incluye

- charts longitudinales
- cobertura completa de toda la app
- refactor de arquitectura
- performance testing
- hardening global del read model

## 5. Estrategia

### T0 — Definir estrategia de entorno FHIR para E2E

Cerrar explícitamente:

- cómo se levanta HAPI FHIR para tests
- cómo se limpia/siembra el dataset
- si el seed corre por suite, por archivo o por test
- qué recursos mínimos requiere el escenario

Este paso es bloqueante para todo lo demás.

### T1 — E2E readiness real

Auditar:

- Playwright instalado y operativo
- configuración contra next build && next start
- disponibilidad del backend FHIR para el runner
- existencia o ausencia de selectors estables
- necesidad de agregar data-testid

Nota: si data-testid no existe hoy, eso pasa a ser trabajo explícito de este ticket, no una simple recomendación.

### T2 — Escenario determinístico mínimo

Definir un escenario único y controlado con:

- 1 paciente
- 1 episode activo
- 1 encounter in-progress
- sin encounters hermanos ambiguos para ese flujo
- datos iniciales conocidos y verificables

Esta restricción no puede quedar como supuesto; debe venir garantizada por el seed.

### T3 — Definir payload clínico mínimo válido para finalize

Antes de escribir el test, dejar explícito cuál es el mínimo real aceptado por el flujo de finalización considerando:

- validación Zod
- reglas de dominio
- restricciones del formulario

Por ejemplo, si el mínimo efectivo es:

- clinicalNote
- eva
- determinado set de vitales

eso debe quedar escrito y reutilizable.

👉 El test no debería “descubrir” el mínimo por prueba y error.

### T4 — Implementar test E2E principal

Archivo sugerido:

- e2e/flows/encounter-finalize.spec.ts

Flujo:

- abrir encounter detail in-progress
- completar payload clínico mínimo válido
- ejecutar finalize
- esperar evidencia observable de navegación/rehidratación correcta
- validar surface finished
- navegar a patient detail
- validar source switch y consistencia

### T5 — Guardas de regresión

Agregar assertions específicas para:

- no presencia de datos de otros encounters
- no fallback temporal usado como source-of-truth en detail
- consistencia del mismo encounterId entre surfaces validadas

### T6 — Documentación de cierre

Registrar:

- entorno usado
- estrategia de seed
- qué se validó
- evidencia mínima reproducible
- qué quedó fuera del sprint

## 6. Riesgos reales

- servidor FHIR contaminado o no determinístico
- flakiness por revalidación/cache en App Router
- selectores inestables
- payload clínico mal definido
- tests que validan demasiado markup y poca semántica

### Mitigaciones concretas

- levantar backend FHIR dedicado para E2E
- seed controlado y reproducible
- assertions sobre señales estables de estado
- esperar elementos canónicos visibles post-redirect antes de afirmar
- no depender de waits fijos
- introducir data-testid solo donde realmente haga falta

## 7. Criterios de aceptación

El sprint está bien cerrado si:

- existe una estrategia determinística de backend FHIR para E2E
- finalize funciona en browser real contra entorno reproducible
- el redirect post-finalize es verificable
- finished encounter detail queda validado con criterio observable de read-only
- patient detail hace source switch correcto
- no hay mezcla entre encounters
- el test corre de forma estable

## 8. Definiciones que deben quedar explícitas

### Qué significa “read-only”

Debe validarse con criterio concreto, por ejemplo:

- ausencia del formulario editable, o
- ausencia del submit de finalize/save, o
- presencia exclusiva del bloque clínico de lectura

No alcanza con una noción vaga de “parece read-only”.

### Qué significa “esperar revalidación correcta”

No usar espera arbitraria.
La aserción debe esperar una evidencia observable, por ejemplo:

- heading/label del encounter finalizado
- bloque clínico persistido visible
- ausencia del formulario editable anterior

### Qué significa “mínimo clínico válido”

Debe quedar especificado antes del test, no inferido durante el debug.

## 9. Resultado esperado

- evidencia E2E real del circuito de cierre clínico
- entorno reproducible para futuras validaciones
- confianza más fuerte en persistencia + navegación + revalidación + consistencia cross-surface

## 10. Nota de priorización

Este sprint sigue siendo el próximo paso correcto, pero con una reformulación importante:

el primer entregable no es el test, es el control determinístico del backend FHIR para el test.

Ese ajuste baja muchísimo el riesgo de gastar tiempo depurando falsos negativos de infraestructura.

Si querés, ahora te lo convierto en una versión más operativa tipo “documento de sprint final” con tickets T0–T6 listos para copiar.