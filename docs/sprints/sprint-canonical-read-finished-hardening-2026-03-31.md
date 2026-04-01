# Sprint — Canonical read hardening de encounters finished

Fecha: 2026-03-31  
Estado: Cerrado (diagnóstico documental)

## 1. Diagnóstico breve

La auditoría de cierre confirmó que el path canónico de `finished encounter detail` ya estaba correctamente implementado en alcance acotado (lectura por `encounterId`, sin fallback temporal como source of truth, con no-mezcla y ownership fail-closed). En este sprint no se detectó gap runtime para hardening productivo y el cierre es documental/contractual.

## 2. Sprint propuesto completo

### Título
Sprint — Canonical read hardening de encounters finished

### Objetivo
Confirmar y dejar explícito que `encounter detail` en estado `finished` es la surface canónica acotada de lectura clínica encounter-centric, y que otras surfaces (`patient detail`/history/charts) cumplen roles válidos de summary o longitudinal.

### Problema que resuelve
El riesgo activo en este punto era documental: evitar reabrir como “deuda global rota” un tema que en runtime ya quedó cerrado en alcance acotado. La necesidad del sprint fue dejar esa frontera explícita y consistente en documentación.

### Alcance

**Entra**
- diagnóstico de estado runtime/documentación para canonical read de `finished`;
- corrección mínima de wording y contradicciones documentales;
- cierre explícito de alcance (detail canónico acotado vs surfaces summary/longitudinal).

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
3. clasificar surfaces no canónicas por rol válido (summary/longitudinal);
4. ajustar documentación para evitar deuda global falsa;
5. cerrar con evidencia y límites explícitos.

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
