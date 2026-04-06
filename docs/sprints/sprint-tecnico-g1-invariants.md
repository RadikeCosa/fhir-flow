# Sprint técnico G1 — Invariants críticos encounter-centric / cross-surface — 2026-04-06

- Status: Cerrado por evidencia (alcance G1 / acotado)
- Tipo: Sprint técnico acotado
- Frente: Continuidad clínica global / system-wide
- Origen: Handoff operativo T5 del backlog vigente


## 0. Estado de ejecución

- T1 (matriz `surface × invariant × evidencia`) ejecutado en modo diagnóstico: `docs/sprints/g1-t1-matriz-auditoria-2026-04-06.md`.
- T2 (hardening mínimo de evidencia negativa ownership/cross-patient) ejecutado: `docs/sprints/g1-t2-hardening-evidence-2026-04-06.md`.
- T3/T4: absorbidos por evidencia suficiente para el alcance G1 (no requieren ticket técnico adicional en este sprint).
- T5: aplicado (cierre documental honesto).

### Cierre explícito del sprint G1

- **cerrado por evidencia (alcance G1 / acotado)** en las surfaces auditadas:
  - `patient detail`
  - `encounter detail`
  - `encounter history` (contrato observable)
- **sin bug runtime nuevo verificable** durante T1 + T2.
- Los 2 ámbar de T1 (invariant 2 en `patient detail` y `encounter history`) quedaron en verde por evidencia negativa explícita agregada en T2.
- **sin cambios productivos** en G1.
- Este cierre **no implica cierre global/system-wide**.
- Este cierre **no sustituye G2/G3/G4**.
- Este cierre **no reabre bounded closures previas**.

## 1. Objetivo

Ejecutar el subticket G1 del frente global de continuidad clínica system-wide para validar y endurecer los invariants críticos de las surfaces encounter-centric y cross-surface priorizadas.

El objetivo de este sprint no es cerrar todo el frente global, sino dejar evidencia verificable de que las surfaces incluidas sostienen correctamente:

- no-mezcla cross-encounter;
- no-mezcla cross-patient;
- source-of-truth correcto por encounterId donde corresponda;
- consistencia cross-surface entre patient detail, encounter detail y encounter history.

## 2. Justificación

El backlog vigente ya marca como cerrados en alcance acotado varios frentes bounded relevantes: canonical read bounded de finished detail, practitioner consistency en encounter write, cobertura browser bounded y auditorías bounded de continuidad. Reabrir esos frentes sin evidencia nueva verificable sería incorrecto.

Lo que permanece abierto como deuda real es el frente global/system-wide de continuidad clínica. Dentro de ese frente, el backlog define como primer subticket a ejecutar:

G1 — Invariants críticos encounter-centric/cross-surface.

Este orden también es coherente con la validación arquitectónica vigente: hoy existen cierres bounded sólidos, pero la separación encounter-centric vs longitudinal y la continuidad clínica global siguen siendo solo parcialmente válidas fuera de esos cierres acotados.

## 3. Alcance

### Surfaces incluidas

- patient detail
- encounter detail
- encounter history:
	- lista
	- navegación por encounterId
	- consistencia cross-surface con patient detail y encounter detail

### Invariants incluidos

- No-mezcla cross-encounter en surfaces encounter-centric.
- No-mezcla cross-patient / fail-closed por ownership y route consistency.
- Source-of-truth correcto por surface:
	- encounter-centric por encounterId donde corresponda;
	- sin filtración de fallback temporal a surfaces encounter-centric.
- Consistencia cross-surface:
	- patient detail no debe exponer como fuente clínica un encounter distinto del que luego se abre o representa en encounter detail, cuando la interacción del usuario implica continuidad sobre la misma visita;
	- encounter history no debe navegar a un encounterId que contradiga la identidad clínica mostrada por la surface de origen;
	- diferencias de orden visual o priorización entre surfaces no constituyen violación por sí mismas;
	- sí constituye violación cualquier caso donde dos surfaces aparenten referirse a “la misma visita” pero consuman o expongan identidad clínica distinta.

### Ejemplo explícito de violación del invariant 4

Se considera fila roja si ocurre un caso como este:

- patient detail muestra datos clínicos provenientes de Encounter A;
- el usuario navega por CTA o por lista creyendo continuar o ver esa misma visita;
- la navegación lleva a Encounter B;
- encounter detail abre Encounter B;
- y no existe cambio explícito de contexto que justifique esa diferencia.

Ese caso constituye inconsistencia cross-surface verificable.

## 4. No alcance

Este sprint no incluye:

- G2 — continuidad browser system-wide;
- G3 — longitudinal/histórico y frontera completa de fallback;
- G4 — policy final de legacy sin encounterId;
- reapertura de canonical read bounded de finished encounter detail;
- reapertura de practitioner consistency en encounter write;
- reapertura de cobertura browser bounded ya cerrada;
- trabajo de ActionError.details fuera de encounter write como urgencia técnica;
- refactors UI/UX de polish sin impacto en invariants.

## 5. Hipótesis de trabajo

La hipótesis inicial del sprint es:

- las surfaces encounter-centric principales ya tienen una base correcta por los cierres bounded previos;
- el gap, si existe, probablemente esté en la consistencia entre surfaces o en guardas insuficientes contra mezcla o fallback indebido;
- este sprint debe confirmar o refutar esos gaps con evidencia, antes de abrir frentes más amplios como G2 o G3.

## 6. Definición operativa de “verde” en G1

G1 se considera cerrado solo si queda una matriz explícita surface × invariant × evidencia con cobertura suficiente sobre las 3 surfaces incluidas y con evidencia trazable por fila.

### Mínimo exigido

- al menos una prueba integrada o E2E por surface incluida;
- al menos una guarda negativa relevante para mezcla, fallback indebido u ownership;
- evidencia explícita de consistencia cross-surface entre selector o fuente, navegación y detalle.

### Importante

Un verde parcial en algunas filas no habilita inferir cierre global/system-wide.
Este sprint ejecuta G1 solamente. No cierra automáticamente el frente global ni sustituye G2, G3 o G4.

## 7. Criterio de interpretación de filas ámbar

Una fila ámbar permite cierre del sprint solo si:

- no revela bug runtime verificable;
- el invariant crítico no queda contradicho, sino solo cubierto de forma indirecta o incompleta;
- existe evidencia suficiente para afirmar que el riesgo remanente pertenece a G2, G3 o G4 y no a G1;
- el remanente queda documentado como límite explícito y no como silencio interpretativo.

Una fila ámbar bloquea cierre si:

- deja duda sobre identidad clínica encounter-centric;
- deja duda sobre mezcla cross-encounter o cross-patient;
- o hace imposible decidir si el source-of-truth correcto se sostiene en la surface auditada.

En otras palabras: ámbar metodológico puede ser aceptable; ámbar sobre identidad clínica no.

## 8. Plan de ejecución

### T1 — Construir matriz obligatoria surface × invariant × evidencia

Armar una matriz explícita para estas surfaces:

- patient detail
- encounter detail
- encounter history

Y estos invariants:

- no-mezcla cross-encounter
- no-mezcla cross-patient
- source-of-truth correcto
- consistencia cross-surface

### Resultado esperado

Documento o bloque del sprint con estado por fila:

- verde
- ámbar
- rojo

Más referencia concreta a test, spec o evidencia existente o nueva.

### T2 — Auditar patient detail

Validar que:

- el selector clínico siga siendo consistente con el contrato vigente;
- los datasets clínicos provengan del mismo encounterId fuente;
- no exista mezcla con encounters hermanos;
- no exista contaminación cross-patient;
- la surface no dependa de fallback temporal como source-of-truth encounter-centric.

### Evidencia mínima

- prueba integrada o existente endurecida;
- al menos una guarda negativa para mezcla o ownership.

### T3 — Auditar encounter detail

Validar que:

- la lectura permanezca encounter-centric por encounterId;
- el loader falle en cerrado ante mismatch patient/encounter;
- no haya mezcla con datasets de otros encounters;
- la navegación desde history o patient detail preserve identidad consistente.

### Evidencia mínima

- prueba integrada o existente endurecida;
- al menos una guarda negativa de no-mezcla o fail-closed.

### T4 — Auditar encounter history como surface cross-surface (sin reabrir internals bounded-closed)

Validar el contrato observable de encounter history desde la surface:

- qué navegación expone;
- qué encounterId usa para navegar;
- qué colección o cards muestra como surface encounter-centric;
- que no haya evidencia observable de filtración de datasets longitudinales hacia lista o cards encounter-centric;
- que la consistencia con patient detail y encounter detail sea verificable sin exigir orden visual idéntico entre surfaces.

### Límite explícito

Este task no reabre app/patients/[id]/encounters/data.ts en su boundary local ya bounded-closed, salvo evidencia nueva verificable de bug runtime.

### Evidencia mínima

- prueba integrada, E2E o guarda negativa desde contrato observable;
- referencia explícita al contrato cross-surface vigente.

### T5 — Cierre documental honesto

Actualizar:

- sprint doc;
- backlog;
- validación arquitectónica;

solo si la evidencia realmente lo justifica.

El cierre debe usar wording explícito de alcance:

- cerrado en alcance G1, o
- cerrado por evidencia en perímetro auditado,

y debe dejar textual que:

- no implica cierre global/system-wide;
- no reabre bounded closures previas;
- no sustituye G2, G3 ni G4.

## 9. Estrategia de evidencia

### Prioridad 1

Reusar evidencia existente donde ya haya cobertura sólida y solo endurecer donde falte precisión contractual.

### Prioridad 2

Agregar pruebas nuevas únicamente si aparece una fila roja o ámbar no resolvible por evidencia existente.

### Prioridad 3

No introducir cambios productivos salvo que aparezca un bug runtime nuevo, verificable y estrictamente dentro del alcance G1.

### Regla de prudencia

Si la auditoría refuta el gap con evidencia existente, el cierre válido es por evidencia, no por implementación nueva.

### Regla anti-redundancia

Si T2 o T3 no encuentran contradicción nueva y una fila ya queda suficientemente sostenida por bounded closures previas, el cierre válido es declarar la evidencia existente como suficiente para esa fila, sin exigir prueba nueva ni hardening artificial.

## 10. Riesgos principales

### Riesgo 1 — Sobredeclarar cierre

Tomar un verde parcial como si cerrara continuidad clínica system-wide.

Mitigación: mantener la matriz completa y repetir el límite de alcance en el cierre.

### Riesgo 2 — Reabrir bounded closures sin motivo

Volver a discutir canonical read bounded, practitioner consistency o browser bounded ya cerrados.

Mitigación: declararlos fuera de alcance desde el inicio.

### Riesgo 3 — Mezclar G1 con longitudinal/histórico

Intentar resolver en el mismo sprint la deuda global de fallback temporal o legacy sin encounterId.

Mitigación: dejar longitudinal/histórico y legacy para G3 o G4.

### Riesgo 4 — Redundancia con bounded closures previas

T2 o T3 pueden terminar reejecutando auditorías ya suficientemente cubiertas por evidencia existente.

Mitigación: si una fila queda satisfecha por evidencia bounded previa y no aparece contradicción nueva, la evidencia existente se considera suficiente para esa fila, sin exigir test nuevo ni hardening artificial.

## 11. Criterios de cierre

Este sprint puede cerrarse como cerrado en alcance acotado (G1) si se cumplen todos estos puntos:

- existe matriz surface × invariant × evidencia;
- patient detail, encounter detail y encounter history tienen al menos una evidencia trazable por surface;
- existe al menos una guarda negativa relevante;
- no queda fila crítica sin diagnóstico explícito;
- cualquier fila ámbar remanente cumple el criterio de aceptabilidad definido en este documento;
- el cierre documental deja textual que:
	- no implica cierre global/system-wide;
	- no reemplaza G2, G3 ni G4;
	- no reabre bounded closures previas.

Si aparecen filas rojas con bug runtime nuevo verificable dentro del alcance, el sprint puede mutar a:

- hardening acotado con fix mínimo, o
- cierre parcial con remanente explícito,

pero sin abrir frentes laterales.

## 12. Resultado esperado del sprint

El mejor resultado posible de G1 es uno de estos dos:

### Escenario A — Cierre por evidencia

No aparece bug runtime nuevo; la matriz queda verde o verde/ámbar no crítico; el sprint cierra por evidencia en el perímetro auditado.

### Escenario B — Hardening acotado

Aparece un gap real en invariants encounter-centric o cross-surface; se corrige con cambio mínimo, test dirigido y cierre documental acotado.

En ambos casos, el resultado correcto sigue siendo:

- avance del frente global, no cierre system-wide.

## 13. Referencias de autoridad

- docs/backlog.md — handoff operativo T5 y definición del frente global / G1–G4.
- docs/validation/validacion-arquitectonica.md — estado real vigente y límites de alcance.
- docs/architecture/current/app-architecture-checkpoint-2026-03.md — contrato actual de surfaces y límites encounter-centric vs longitudinal.
- docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md — autoridad de lifecycle y canonical read.
- docs/write-phase-architecture.md — referencia operativa complementaria para límites del sistema.
