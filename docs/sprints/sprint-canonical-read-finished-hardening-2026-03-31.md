# Sprint — Canonical read hardening de encounters finished

Fecha: 2026-03-31  
Estado: Propuesto

## 1. Diagnóstico breve

El sprint recién cerrado validó continuidad E2E encounter-centric en alcance acotado y confirmó no-mezcla en patient/encounter detail, pero no cerró canonical read completo de `finished encounter detail`. Priorizar ahora `in-progress` completo desviaría foco hacia continuidad clínica + persistencia parcial (deuda explícitamente abierta) y abriría features fuera de alcance. El próximo paso técnicamente honesto es endurecer el path canónico de lectura en `finished`, que ya está definido arquitectónicamente como target de lectura clínica.

## 2. Sprint propuesto completo

### Título
Sprint — Canonical read hardening de encounters finished

### Objetivo
Consolidar `encounter detail` en estado `finished` como surface canónica de lectura clínica encounter-centric, con render read-only respaldado por evidencia reproducible.

### Problema que resuelve
Hoy existe riesgo de cierre falso: hay avances encounter-centric, pero falta cerrar de forma verificable que `finished encounter detail`:
- usa lectura rehidratada por `encounterId` como source-of-truth;
- evita fallback longitudinal/temporal como verdad clínica del detail;
- renderiza clínica read-only sobre ese path canónico.

### Alcance

**Entra**
- hardening del read-path de `finished encounter detail` (loader/composition boundary/render read-only, según gap real);
- validación explícita de ausencia de fallback longitudinal como source-of-truth en ese detail;
- tests de integración livianos para cierre de canonical read en `finished`.

**No entra**
- features nuevas;
- continuidad clínica completa de `in-progress`;
- save-progress/reanudación;
- refactor grande de `encounters/`;
- cambios de lifecycle/write flow salvo hardening mínimo imprescindible;
- charts/history fuera de boundaries directamente afectados por canonical read de `finished`.

### Riesgos principales
1. **Sobrealcance por arrastre de deuda** (`in-progress`, lifecycle, UX).
2. **Falso positivo de cierre** por validar solo render superficial sin verificar source-of-truth.
3. **Regresión por fallback silencioso** (reintroducción de composición longitudinal por fecha en detail `finished`).

### Definición de done
Se considera cerrado solo si:
- `finished encounter detail` obtiene datasets clínicos desde read encounter-centric rehidratado por `encounterId`;
- no hay fallback temporal/longitudinal como source-of-truth en ese path;
- el render read-only clínico consume el path canónico (sin dependencia de estado efímero de formulario);
- existe cobertura automatizada mínima que falle ante mezcla/fallback;
- el cierre documental explicita límites y deudas no resueltas.

### Orden de ejecución
1. fijar contrato de canonical read `finished` (qué valida y qué excluye);
2. auditar gap real en loader vs composition vs render;
3. aplicar hardening mínimo solo en boundary afectado;
4. reforzar tests de integración del path canónico;
5. cerrar documentación con evidencia y límites explícitos.

## 3. Tickets T1–T5

### T1 — Contrato de canonical read `finished`
**Criterio de aceptación:** existe contrato verificable (source-of-truth, no fallback, render read-only, exclusiones de alcance) aprobado en documentación.

### T2 — Auditoría técnica de `finished encounter detail`
**Criterio de aceptación:** se identifica y documenta el gap exacto (loader/composition/render) sin abrir refactor amplio.

### T3 — Hardening mínimo del boundary canónico
**Criterio de aceptación:** el detail `finished` lee datasets clínicos por `encounterId` rehidratado y elimina fallback longitudinal como verdad clínica en ese path.

### T4 — Validación de render read-only clínico
**Criterio de aceptación:** secciones clínicas de `finished` renderizan desde datos persistidos rehidratados y cubren estado vacío sin depender de estado de edición.

### T5 — Tests de cierre canonical read `finished`
**Criterio de aceptación:** tests de integración livianos cubren path canónico + guardas contra mezcla/fallback; el suite falla si reaparece path longitudinal como source-of-truth del detail.

## 4. Criterios de aceptación

1. Abrir un `finished encounter detail` muestra clínica de la visita objetivo (mismo `encounterId`).
2. El dato visible proviene de lectura rehidratada encounter-centric, no de fallback por fecha.
3. El render clínico read-only de `finished` queda anclado al path canónico y no a estado previo de UI.
4. Existen tests automáticos para:
   - aislamiento por `encounterId`;
   - ausencia de fallback longitudinal como truth source en detail `finished`;
   - render clínico mínimo esperado (incluyendo casos vacíos controlados).
5. El cierre del sprint documenta explícitamente qué se validó y qué deuda sigue abierta.

## 5. Evidencia esperada

### Validación manual esperable
- Navegar a al menos dos encounters `finished` del mismo paciente y comprobar que cada detail renderiza su propio dataset clínico (sin contaminación cruzada).
- Verificar que un caso con datos clínicos ausentes muestra empty states controlados, no datos de otro encounter.

### Tests mínimos
- Integración de data layer/detail route para `finished` con assert de `encounterId`.
- Integración/render read-only para secciones clínicas principales en `finished`.
- Prueba negativa que falle si se usa fallback longitudinal por fecha como source-of-truth.

### Qué no alcanza como evidencia
- Demo manual aislada sin test reproducible.
- Test que valida solo presencia de componentes sin verificar origen de datos.
- “Pasa en patient detail” como proxy de cierre de `finished encounter detail`.

## 6. Deuda abierta que queda fuera de cierre

- Continuidad clínica completa de `in-progress`.
- Persistencia parcial operativa y reanudación del formulario (save-progress UX completo).
- Deuda longitudinal/histórica (incluyendo estrategias fallback para datos legacy sin `encounterId`).
- Hardening E2E global del sistema más allá del path `finished encounter detail`.
- Refactor estructural amplio de `encounters/`, lifecycle o write flow.
