# Sprint — Validación browser E2E del circuito clínico completo in-progress -> save -> reload -> finalize (alcance acotado)

- Status: closed
- Fecha: 2026-04-04

## 0. Cierre ejecutado (2026-04-04)

- Gate previo: resuelto.
- Drift del test EVA: corregido como drift de expectativa, sin bug runtime clínico.
- Spec browser integrado endurecido en `e2e/flows/encounter-continuity.spec.ts`.
- Ejecución final: `npm run test:e2e -- e2e/flows/encounter-continuity.spec.ts` -> **2 passed**.
- Outcome post-finalize en `patient detail` para este seed/estado: contrato vigente de empty-state (`Sin episodio activo` + `No hay visitas registradas en el episodio activo`).
- Se descartó ajuste productivo: no apareció bug runtime verificable del flujo clínico en este alcance.

## 1. Objetivo

Validar con evidencia browser E2E reproducible que el circuito clínico principal encounter-centric se sostiene de punta a punta en alcance acotado:

- planned -> start -> in-progress
- save-progress
- reload/remount
- rehydrate
- finalize -> finished
- patient detail source switch

Este sprint no introduce features nuevas ni reabre frentes ya cerrados. Busca transformar la base actual de cierres encounter-centric y E2E parciales en una validación browser integrada del loop operativo principal. La ejecución asume como precondición una base de tests estable en los repositorios encounter-scoped usados por la rehidratación del flujo objetivo.

## 2. Problema a resolver

El sistema ya tiene:

- transición planned -> in-progress operativa;
- saveEncounterProgressAction como operación separada;
- rehidratación loader-based por encounterId en encounter detail para in-progress;
- finished encounter detail validado como canonical read en alcance acotado;
- dos flujos browser E2E cerrados por separado:
- finalize cross-surface/no-mix;
- start + save-progress + reload/rehydrate.

El gap actual es de evidencia integrada: todavía no existe una validación browser E2E única y determinística del circuito completo que conecte start, save, reload, finalize y el comportamiento post-finalize en patient detail dentro del mismo recorrido controlado.

## 3. Por qué este sprint tiene sentido ahora

Este sprint:

- reutiliza contratos ya consolidados, sin abrir rediseño de lifecycle ni del read model global;
- aprovecha el cierre acotado ya logrado en patient detail y encounter detail;
- evita reabrir practitioner consistency, ya cerrada en encounter write;
- evita reabrir longitudinal/histórico global, que cerró por evidencia sin gap nuevo verificable en las surfaces auditadas.

Antes de abrir otra ronda estructural, conviene validar fuerte el camino clínico principal que el runtime ya declara soportar.

## 4. Autoridad y límites

Este sprint se apoya en:

- ADR-001, como autoridad de lifecycle y canonical read;
- write-phase-architecture.md, como referencia operativa del write flow;
- app-architecture-checkpoint-2026-03.md, como estado actual de loaders y surfaces;
- validacion-arquitectonica.md, como estado real del cierre acotado y deuda browser/global aún abierta;
- backlog.md, como referencia de prioridad actual.

Límites:

- no redefine lifecycle;
- no introduce nuevas operaciones de write;
- no toca charts longitudinales;
- no reabre practitioner consistency;
- no reabre hardening longitudinal/histórico fuera del alcance ya auditado;
- no implica cierre system-wide automático aunque el circuito acotado quede validado.

## 5. Alcance incluido

Incluye:

- validación browser del loop clínico completo de una visita planificada;
- cobertura negativa contra mezcla o fallback indebido en surfaces encounter-centric auditadas;
- seed y contrato E2E determinísticos para el flujo;
- cierre documental mínimo en sprint doc, backlog y validación arquitectónica.

## 6. Alcance excluido

No incluye:

- charts longitudinales;
- hardening de history loader fuera del contrato ya cerrado;
- backfill de históricos sin encounterId;
- rediseño global de continuidad full-system;
- ActionError.details;
- cambios amplios de UI;
- soporte multi-practitioner;
- cambios de arquitectura clínica o del subsistema de charts.

## 7. Riesgos principales

### 7.1 Confundir falta de evidencia integrada con bug de runtime

Mitigación: validación fuerte primero; hardening runtime solo si aparece un gap real.

### 7.2 Scope creep hacia continuidad global/system-wide

Mitigación: mantener el alcance en surfaces encounter-centric del camino crítico; longitudinal/charts quedan fuera.

### 7.3 Seed frágil o demasiado acoplado

Mitigación: T2 define un seed mínimo, determinístico y con contrato explícito antes de T3.

### 7.4 Sobredeclarar cierre global

Mitigación: T5 deja wording acotado y no extrapola evidencia local a cierre system-wide.

### 7.5 Contaminar la evidencia con una base de tests inestable

Mitigación: gate previo para revisar y resolver o aislar el fallo conocido del test de EVA repository antes de la validación integrada.

## 8. Regla de implementación

Se mantiene como regla central:

- las surfaces encounter-centric auditadas sostienen identidad por encounterId;
- patient detail sigue resolviendo una única fuente clínica (inProgressEncounter ?? lastFinishedEncounter);
- encounter detail sigue operando como canonical read/follow-up surface del encounter individual;
- cualquier fallback temporal pertenece al modo longitudinal, no al source-of-truth encounter-centric.

Regla adicional:

- este sprint es de validación fuerte primero;
- solo si la evidencia revela una brecha real se permite hardening runtime mínimo y localizado.

## 9. Landing zone inicial

### Primaria

- e2e/flows/encounter-continuity.spec.ts
- e2e/flows/encounter-finalize.seeded.spec.ts
- seed loaders de continuity/finalize
- app/patients/[id]/encounters/[encounterId]/data.ts
- app/patients/[id]/data.ts

### Secundaria

- repositorios encounter-scoped usados por la rehidratación;
- helpers de seeding;
- tests de repositorio implicados en el circuito, en particular EVA si participa de la rehidratación validada;
- docs de backlog / validación / sprint.

### No primaria

- encounters/data.ts longitudinal;
- charts;
- practitioner resolution;
- identity/session;
- read global fuera del circuito objetivo.

## 10. Ejecución propuesta

### 0. Gate previo — estabilidad mínima del baseline de tests

Antes de ejecutar la validación browser integrada, revisar el fallo conocido del test de EVA repository asociado al path encounter-scoped y diagnosticar si corresponde a:

- drift de expectativa del test;
- drift del contrato real del repositorio;
- o bug efectivo que impacta lectura/re-hidratación encounter-scoped.

#### Regla de decisión del gate

- si es drift del test y no afecta runtime ni el circuito objetivo: corregir el test y continuar;
- si revela bug real que afecta lectura/re-hidratación encounter-scoped: aplicar fix mínimo localizado antes de T1/T3;
- si no afecta el circuito objetivo pero genera ruido en la suite: aislar/documentar explícitamente la exclusión para no contaminar la evidencia del sprint.

#### Entregable obligatorio del gate

- diagnóstico breve del fallo;
- decisión explícita: fix, ajuste de expectativa o exclusión justificada.

### T1 — Baseline de cobertura browser actual vs circuito objetivo

Auditar qué cubren exactamente hoy los specs browser cerrados y qué tramo del circuito completo sigue sin validación integrada.

#### Entregable obligatorio

- matriz cobertura actual vs circuito objetivo;
- decisión explícita de ejecución con uno de estos tres ramales:

##### Ramal A — cobertura casi completa

La cobertura existente ya valida sustancialmente el circuito objetivo y el sprint se orienta a composición/endurecimiento menor de specs existentes y cierre documental mínimo.

##### Ramal B — gap real de seed/state/spec

La cobertura actual no alcanza y se requiere avanzar con T2 completo, T3 integrado y guardas negativas específicas en T4.

##### Ramal C — gap bloqueado por bug real de runtime

T1 detecta que el bloqueo principal no es de spec sino de comportamiento real. En ese caso se registra el bug, se aplica fix mínimo localizado y recién después se continúa con T3.

### T2 — Seed determinístico del circuito completo

Definir un seed único que permita recorrer de forma estable:

- patient con episodio activo;
- encounter inicial en planned;
- navegación determinística al detail correcto;
- estado inicial apto para start;
- ausencia de datos clínicos previos conflictivos;
- posibilidad de persistir y luego rehidratar, como mínimo:
- nota clínica,
- EVA,
- frecuencia cardíaca,
- frecuencia respiratoria.

#### Entregable obligatorio

- seed reproducible y acotado;
- contrato explícito de datos mínimos expuestos por el seed al spec;
- verificación mínima post-seed.

### T3 — Spec browser E2E del loop completo

Implementar o endurecer el spec browser que valide, en una sola narrativa controlada:

- inicio desde visita planificada;
- start;
- carga parcial;
- save-progress;
- reload/remount;
- rehydrate de los campos clave;
- finalize;
- read-only detail;
- navegación o retorno a patient detail;
- source switch correcto post-finalize.

#### Campos clínicos no negociables a validar

- nota clínica
- EVA
- frecuencia cardíaca
- frecuencia respiratoria

No corresponde ampliar este subconjunto salvo necesidad estrictamente técnica detectada en T1/T2.

#### Entregable obligatorio

- spec reproducible en browser;
- assertions positivas del circuito completo sobre esos campos mínimos.

### T4 — Guardas negativas del circuito

Agregar asserts explícitos para prevenir regresiones de:

- mezcla con otro encounter del mismo paciente;
- pérdida de datos tras reload;
- fallback indebido en surfaces encounter-centric;
- conservación accidental de estado client-only no rehidratado desde loader.

#### Entregable obligatorio

- guardas negativas integradas al spec o a specs complementarios de bajo costo.

### T5 — Cierre documental mínimo

Actualizar:

- sprint doc;
- backlog;
- validación arquitectónica.

El cierre debe distinguir explícitamente entre estos dos resultados posibles:

#### Resultado A — no se detectó bug runtime

Cierre por evidencia browser integrada satisfactoria, sin cambios productivos o solo con ajustes menores de test/spec/seed. La deuda global/system-wide no se declara cerrada automáticamente.

**Resultado aplicado en este sprint:** Resultado A.

#### Resultado B — se detectó bug runtime y se cerró

Cierre por validación + fix mínimo localizado, con documentación del gap real encontrado y actualización explícita del backlog sin extrapolar a cierre global.

## 11. Criterios de aceptación

El sprint se considera cumplido si:

- el gate previo deja estable o explícitamente aislado el fallo conocido que podría contaminar la evidencia;
- existe una matriz baseline real de cobertura browser actual vs circuito objetivo;
- existe un seed determinístico único o claramente consolidado para el flujo;
- existe evidencia browser reproducible del circuito:
- planned -> start -> in-progress -> save -> reload/remount -> rehydrate -> finalize -> finished;
- se valida el source switch post-finalize en patient detail dentro del alcance definido;
- existen guardas explícitas contra mezcla/fallback indebido en las surfaces auditadas;
- backlog y validación arquitectónica reflejan el resultado sin sobredeclarar cierre global;
- no se reabren practitioner consistency ni longitudinal/histórico fuera del alcance.

## 12. Definición de done

- gate previo + T1–T5 cerrados;
- seed y spec reproducibles;
- pruebas browser verdes en el flujo objetivo;
- docs actualizadas;
- sin scope creep a charts/read global/identity;
- sin claims system-wide que excedan la evidencia obtenida.

## 13. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- evidencia browser más fuerte del circuito clínico principal;
- menor incertidumbre sobre continuidad encounter-centric real en runtime;
- mejor base para decidir si queda trabajo productivo de continuidad global o si la deuda remanente es de perímetro/documentación;
- más confianza para no reabrir frentes estructurales innecesarios.

## 13.1 Resultado observado

- El loop browser integrado quedó validado en alcance acotado.
- El contrato final de `patient detail` post-finalize para el seed validado corresponde a empty-state; no se exige tarjeta `ÚLTIMA VISITA` para declarar éxito en este escenario.
- El cierre permanece acotado al flujo y seed validados, sin extrapolación a cierre global/system-wide.

## 14. Próximo paso después de este sprint

Una vez ejecutado este sprint:

- si aparece un bug runtime verificable, abrir un sprint de hardening mínimo sobre ese gap concreto;
- si no aparece bug y el circuito queda validado, reevaluar si conviene avanzar sobre continuidad global/system-wide, browser E2E ampliado, o deuda longitudinal/histórica todavía abierta como categoría más amplia
