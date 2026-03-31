# Sprint — Canonical read hardening de encounters finished

Fecha: 2026-03  
Estado: Cerrado

---

## 1. Objetivo del sprint

Consolidar `encounter detail` en estado `finished` como surface canónica de lectura clínica, asegurando que los datos visibles provengan de lectura rehidratada, encounter-centric y consistente, sin mezclar fallback longitudinal ni declarar cerrada la deuda más allá de lo efectivamente validado.

---

## 2. Problema que resuelve este sprint

El sprint previo cerró la continuidad clínica editable de `in-progress`.  
El problema pendiente ahora está en el estado `finished`:

- `encounter detail` debe comportarse como fuente canónica de lectura para una visita finalizada;
- la información clínica visible debe venir de source of truth rehidratada;
- no debe haber contaminación desde estrategias longitudinales o fallback temporal;
- la deuda de canonical read de `finished` solo puede considerarse cerrada con criterios verificables.

Además, existe un hallazgo ya conocido: el encounter detail de visitas en estado finished no muestra hoy de forma completa los datos clínicos persistidos (signos vitales, EVA y procedimientos), aunque ese detail es la surface que por arquitectura debe comportarse como lectura canónica. Este sprint no parte de cero: parte de esa evidencia ya documentada y busca cerrarla de forma verificable.

---

## 3. Alcance

### Entra en este sprint

- definir criterios explícitos de canonical read para `finished`;
- auditar el path actual de `encounter detail` en estado `finished`;
- endurecer el loader y/o boundary de composición necesario para lectura clínica encounter-centric;
- validar que el render read-only clínico use ese path canónico;
- agregar tests de integración liviana para el canonical read de `finished`.

### No entra en este sprint

- refactor general de charts o history list;
- cambios de write flow;
- rediseño del lifecycle;
- migración histórica de datos legacy sin `encounterId`;
- hardening E2E completo del sistema;
- refactor amplio del área `encounters/`.

---

## 4. Riesgos principales

### Riesgo 1 — sobredeclarar cierre
Parte del path de `finished` ya existe. El riesgo principal no es ausencia total de implementación, sino declarar “resuelta” una deuda que todavía no fue cerrada con evidencia suficiente.

### Riesgo 2 — mezclar detail con longitudinal
Si aparece cualquier fallback por fecha o composición longitudinal dentro de `finished encounter detail`, el detail deja de ser una surface encounter-centric canónica.

### Riesgo 3 — abrir demasiado scope
No conviene convertir este sprint en una limpieza general de rutas, loaders o componentes. El foco debe mantenerse en canonical read hardening de `finished`.

---

## 5. Definición de done

Este sprint solo se considera cerrado si se cumple todo lo siguiente:

- `finished encounter detail` muestra datos clínicos rehidratados desde source of truth;
- no depende de submit state ni navegación previa;
- no usa fallback por fecha como source-of-truth encounter-centric;
- el path canónico de `finished` queda cubierto por tests;
- la documentación final solo marca como resuelto lo efectivamente validado.

---

## 6. Orden de ejecución

1. definir criterios de canonical read para `finished`;
2. auditar encounter detail actual en estado finished, tomando como punto de partida el hallazgo ya conocido de render clínico incompleto;
3. confirmar con esa auditoría si el gap real está en loader, render o boundary de composición;
4. ajustar loader o composition boundary solo donde haga falta;
5. validar render read-only clínico;
6. agregar tests de canonical read para `finished`.


---

## 7. Tickets del sprint

### T1 — Criterios de canonical read para `finished`

Definir un contrato de cierre verificable para considerar endurecido el detail canónico de encounters finalizados.

**Criterios**
- queda explícito qué significa “canonical read cerrado”;
- se distinguen claramente source-of-truth, render read-only y exclusiones de scope;
- no se mezcla este criterio con deuda longitudinal o histórica fuera de alcance.
- queda explícito que canonical read implica lectura encounter-centric, rehidratada desde source of truth, sin depender de composición longitudinal ni fallback temporal;
Por qué

---

### T2 — Auditoría de `finished encounter detail`

Revisar qué partes del detail actual ya son canónicas y qué gaps siguen abiertos.

**Criterios**
- se documenta qué ya está alineado;
- se identifican gaps reales de loader, render o boundary;
- no se proponen cambios fuera de foco.
- se contrasta explícitamente el hallazgo conocido de render incompleto contra el path real de loader/render actual;

Nota de partida conocida: la auditoría no parte de cero. Debe verificar específicamente el hallazgo ya documentado de render clínico incompleto en finished encounter detail, distinguiendo si el gap está en hidratación de datos, boundary de composición o render UI.
---

### T3 — Hardening del loader/detail para `finished`

Ajustar el path encounter-centric de lectura clínica de `finished` sin introducir lógica longitudinal.

**Criterios**
- el detail obtiene sus datos clínicos desde lectura encounter-centric;
- no hay fallback temporal por fecha como source-of-truth;
- el ajuste es mínimo y revisable.

---

### T4 — Validación del render read-only clínico

Confirmar que las secciones clínicas visibles en `finished` usan datos rehidratados correctos y completos.

**Criterios**
- vitales, EVA, procedimientos y nota clínica se renderizan desde lectura persistida;
- no se depende de estado efímero;
- el comportamiento queda claro por estado.

---

### T5 — Tests de canonical read `finished`

Agregar tests que den confianza suficiente sobre el path canónico de lectura de `finished`.

**Criterios**
- hay cobertura de integración liviana del path canónico;
- queda protegida la exclusión de fallback longitudinal;
- la evidencia de cierre no depende solo de inspección manual.

---

## 8. Criterios de aceptación del sprint

- abrir un encounter `finished` muestra su dato clínico persistido real;
- `encounter detail` funciona como lectura canónica de esa visita;
- no hay contaminación desde fallback longitudinal;
- el comportamiento queda cubierto por tests;
- backlog y documentación solo pueden marcar esta deuda como cerrada si esos criterios se cumplen.

---

## 9. Notas finales

Este sprint no busca “mejorar un poco el detail”.  
Busca cerrar de forma verificable una deuda arquitectónica específica: que `finished encounter detail` pueda sostenerse como canonical read real de una visita finalizada.

La deuda histórica y longitudinal que exceda ese path debe permanecer explícitamente fuera de alcance para evitar cierre falso.

---

## 10. Ejecución y resultado del sprint

### Resumen de ejecución

Se cerró este sprint con validación del path canónico de lectura para **`finished encounter detail`**.
La auditoría confirmó que el comportamiento productivo ya estaba alineado y que el cierre se sostiene con evidencia de validación + tests.

### Hallazgos confirmados (sin cambios productivos)

- No se requirieron cambios en producción para este sprint (`data.ts` / `page.tsx` ya estaban alineados al objetivo).
- `getEncounterDetailData(patientId, encounterId)` ya carga la lectura clínica de forma estrictamente encounter-centric por `encounterId`.
- En el path canónico de `finished` no existe fallback temporal/longitudinal como source of truth.
- El render en `finished` usa datos rehidratados del loader, no estado de formulario.
- Se verifica aislamiento de ownership encounter → patient (fail-closed): si no pertenece al paciente de la ruta, retorna `encounter: null` y se omiten loaders clínicos.

### Evidencia automatizada agregada

Se agregaron y ejecutaron exitosamente los siguientes tests:

1. `"does not mix clinical data when two encounters share the same date"`
   - Protege contra mezcla de datasets por colisión temporal.
   - Refuerza que la lectura canónica usa `encounterId`, no fecha.

2. `"returns null encounter when encounter does not belong to route patient"`
   - Protege aislamiento de paciente en el read path.
   - Refuerza comportamiento fail-closed ante mismatch de ownership.

### Cierre acotado (límites explícitos)

Este cierre aplica **solo** a `finished encounter detail`.
No declara cierre de:

- continuidad clínica completa de `in-progress` en UI;
- deuda longitudinal/histórica (incluyendo casos sin `encounterId`);
- validación E2E completa del sistema;
- cierre global del read model fuera de esta surface.
