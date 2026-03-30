# Sprint — Rehidratación clínica de encounters in-progress

Fecha: 2026-03  
Estado: Planificado

---

## 1. Objetivo del sprint

Implementar la rehidratación clínica de encounters en estado `in-progress` usando como fuente de verdad los datos persistidos y leídos por repositorio mediante `encounterId`, de modo que la visita en curso pueda reabrirse con continuidad editable real, sin mezclar datos longitudinales ni declarar cerrada la deuda completa de canonical read de `finished`.

---

## 2. Alcance

### Entra en este sprint

- definir el contrato entre loader y formulario para rehidratar `in-progress`;
- implementar lectura encounter-centric de datos clínicos persistidos para `in-progress`;
- precargar el formulario con esos datos como valores editables;
- asegurar que encounter detail no use fallback temporal por fecha cuando exista linkage por `encounterId`;
- agregar tests de rehidratación y no-mezcla entre encounters.

### No entra en este sprint

- cierre total del canonical read de `finished`;
- refactor general del read model longitudinal;
- rediseño del write flow;
- migración histórica de datos sin `encounterId`;
- cambios grandes de charts o history list.

---

## 3. Decisiones cerradas para este sprint

- los datos parciales persistidos de un encounter `in-progress` se muestran precargados en el formulario como valores editables;
- la fuente de verdad para esa precarga es la lectura por repositorio y `encounterId`, no snapshot efímero de UI;
- este sprint no declara resuelta la deuda completa de canonical read de `finished`.

---

## 4. Riesgo técnico principal

La traducción de lectura clínica parcial a un estado inicial consistente del formulario, especialmente en el mapping desde agregados clínicos y recursos parciales hacia initial values del form.

---

## 5. Criterios de aceptación

- un encounter `in-progress` con progreso previamente persistido se abre con el formulario precargado;
- la precarga proviene de lectura rehidratada por repositorio y `encounterId`;
- encounter detail no mezcla datos de otro encounter por fecha;
- si existen datos históricos sin linkage, ese fallback no contamina surfaces encounter-centric;
- la documentación del sprint no afirma que quedó cerrado el canonical read completo de `finished`.

---

## 6. Orden de ejecución

1. cerrar el contrato loader → initial values;
2. implementar o ajustar loader encounter-centric para `in-progress`;
3. mapear lectura clínica a valores iniciales del formulario;
4. conectar el formulario a esos valores iniciales;
5. validar save + reload + rehidratación;
6. agregar tests de no-mezcla y continuidad.

---

## 7. Tickets del sprint

### T1 — Contrato loader → initial values

Definir un contrato explícito para que el encounter detail de `in-progress` pueda entregar datos iniciales consistentes al formulario.

**Criterios**
- existe un contrato claro y acotado para initial values;
- no mezcla surfaces longitudinales con encounter-centric;
- define comportamiento frente a datos parciales.

---

### T2 — Loader encounter detail `in-progress`

Ajustar `getEncounterDetailData()` para devolver datos clínicos del encounter usando `encounterId`.

**Criterios**
- carga datos del encounter correcto;
- no usa fallback por fecha cuando hay linkage;
- mantiene separación encounter-centric.

---

### T3 — Mapper lectura clínica → initial values

Traducir datos clínicos persistidos a valores iniciales del formulario.

**Criterios**
- soporta datos parciales sin inventar defaults;
- campos ausentes permanecen undefined;
- no depende directamente del schema del formulario.

---

### T4 — Formulario editable con rehidratación

Conectar el formulario para que use initial values y permita edición continua.

**Criterios**
- el form se abre precargado si hubo progreso previo;
- los valores son editables;
- el flujo abrir → guardar → reabrir mantiene consistencia.

---

### T5 — Tests de rehidratación y no-mezcla

Agregar tests que validen la coherencia del comportamiento.

**Criterios**
- no mezcla datos entre encounters;
- rehidrata correctamente desde `encounterId`;
- fallback histórico no contamina encounter detail.

---

## 8. Notas finales

Este sprint fortalece la continuidad clínica de `in-progress` y la consistencia encounter-centric del read model.

No implica el cierre total de la deuda de canonical read de `finished`, que permanece como trabajo posterior.