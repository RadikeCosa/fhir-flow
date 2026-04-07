# Sprint UX acotado — Register form (`/encounters/register`)

Fecha: 2026-04-07  
Estado: Propuesto (frente documental preparado; sin implementación productiva)

## 1) Título

Refinamiento UX/semántico del formulario de registrar visita (`/encounters/register`) — alcance acotado.

## 2) Objetivo

Mejorar claridad semántica y señal operativa del formulario de register sin introducir cambios arquitectónicos ni de runtime en esta etapa.

## 3) Alcance

Este sprint cubre únicamente el surface de formulario de register y su contrato UX/documental:

1. **Fecha / hora de inicio / hora de fin:** revisar copy y decidir si mantener o retirar la palabra “real”.
2. **Bloque “Profesional”:** evaluar valor operativo de mostrar nombre visible dentro del formulario.
3. **Visitas futuras:** reforzar semántica de producto para que register opere sobre visitas ocurridas/en curso; las futuras se gestionan en planning (`/encounters/new`).
4. **Nota clínica opcional al inicio de interacción:** definir patrón colapsable/expandible para mostrar la nota clínica solo cuando el usuario decide agregarla.

## 4) No alcance

- No cambiar lifecycle de encounters ni estados (`planned`, `in-progress`, `finished`).
- No reabrir practitioner model ni write architecture.
- No alterar separación planning vs register ya cerrada.
- No implementar código productivo, tests o cambios de comportamiento runtime en este sprint.
- No debilitar reglas clínicas vigentes de finalización/completitud.

## 5) Decisiones UX propuestas

### D1. Copy temporal sin “real” por defecto

Propuesta base: en register usar etiquetas neutrales y operativas (`Fecha`, `Hora de inicio`, `Hora de fin`) y dejar “real” fuera del label principal salvo necesidad de desambiguación explícita en contenido de ayuda.

Racional: en el contexto register la visita ya ocurrió o está en curso; “real” tiende a ser redundante y puede aumentar carga cognitiva.

### D2. Bloque “Profesional” con criterio de mínima interferencia

Propuesta base: mantener atribución de profesional como metadato de sistema (trazabilidad) sin presentarlo como bloque prominente del formulario, salvo que exista acción del usuario que dependa de esa información.

Racional: si no habilita decisión ni edición en ese punto, su presencia visible compite con campos clínicos primarios.

### D3. Guardrail semántico de no-futuro en register

Propuesta base: explicitar en UX y validación de intención que register no es canal para visitas futuras. Si la fecha/hora ingresada cae en futuro respecto del momento de registro, orientar a planning.

Racional: consolida separación de entry points ya definida por arquitectura de app y reduce ambigüedad operativa.

### D4. Nota clínica progresiva (colapsable) con regla de cierre intacta

Propuesta base: iniciar la sección de nota clínica colapsada con CTA “Agregar nota clínica”, expandiéndola bajo demanda.

Regla inalterable: al intentar completar/finalizar, la nota clínica sigue siendo requerida según contrato vigente de cierre.

Racional: disminuye ruido inicial en carga parcial sin degradar seguridad/consistencia clínica al cerrar.

## 6) Criterios de aceptación del sprint

1. Existe definición documental explícita de que `/encounters/register` corresponde a visitas **ocurridas o en curso**; las visitas futuras corresponden a `/encounters/new`.
2. Queda documentada decisión de copy para campos temporales (con o sin “real”) y su racional UX.
3. Queda documentado el tratamiento del bloque “Profesional” (mantener visible, reducir prominencia o mover a capa secundaria) con criterio operativo.
4. Queda documentado patrón de nota clínica colapsable/expandible con cláusula explícita: **la nota sigue siendo obligatoria al completar/finalizar**.
5. El sprint se declara como **refinamiento UX/operativo**, no como cambio arquitectónico.
6. No se introducen cambios de código productivo en esta etapa.

## 7) Riesgos y límites

- **Riesgo de deriva semántica:** si el copy no diferencia register vs planning, puede reaparecer confusión de entry point.
- **Riesgo de interpretación de “opcional”:** nota clínica colapsable podría entenderse como “no requerida”; se mitiga con regla explícita al finalizar.
- **Límite de alcance:** este sprint no resuelve rediseños amplios de encounter detail ni modelado clínico.
- **Dependencia futura:** la implementación UI deberá respetar estrictamente ADR-001/ADR-003 y write-phase vigente.

## 8) Diagnóstico ejecutivo (baseline UX actual)

El formulario de register es funcional y consistente con la arquitectura vigente, pero presenta fricciones semánticas de bajo nivel:

- sobre-etiquetado temporal (“real”) potencialmente redundante en el contexto register;
- exposición de “Profesional” sin evidencia de aporte decisional inmediato;
- expectativa de guardrail más explícito para evitar uso de register en visitas futuras;
- oportunidad de reducir carga inicial con nota clínica bajo demanda, manteniendo obligatoriedad al cierre.

Estas fricciones no constituyen bug arquitectónico ni requieren reapertura de decisiones cerradas; se tratan como refinamiento UX acotado del surface register.
