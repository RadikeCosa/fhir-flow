# Sprint — Hardening de persistencia parcial clínica en `in-progress`

**Fecha:** 2026-04  
**Estado:** Propuesto

## 1. Objetivo del sprint

Alinear el comportamiento real del formulario y de las validaciones con el modelo arquitectónico vigente para encounters en estado `in-progress`, permitiendo persistencia clínica parcial sin exigir completitud artificial del set de signos vitales. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## 2. Problema a resolver

En el estado actual se observa un bug de comportamiento: el usuario no puede guardar progreso clínico parcial, y en algunos casos tampoco puede completar el flujo sin registrar todos los signos vitales requeridos por la UI/validación actual.

Ese comportamiento no resulta deseable para el modelo operativo del sistema porque:

- un encounter en `in-progress` debe admitir datos clínicos parciales;
- `saveEncounterProgressAction` existe justamente para persistir progreso sin requerir completitud clínica total;
- la semántica de continuidad clínica en visitas en curso ya fue aceptada e implementada como dirección operativa del sistema. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}

En otras palabras, si hoy el sistema bloquea guardados parciales por exigir todos los signos vitales, el problema probablemente no está en la arquitectura aceptada sino en el endurecimiento actual de schema, wiring de formulario, validación o reglas compartidas entre acciones con distinta intención.

---

## 3. Diagnóstico de producto y arquitectura

La arquitectura vigente ya establece que:

- `planned -> in-progress -> finished` es el lifecycle oficial para encounters ya planificados; :contentReference[oaicite:6]{index=6}
- el estado `in-progress` puede contener datos clínicos parciales; :contentReference[oaicite:7]{index=7}
- `saveEncounterProgressAction` debe recibir payload clínico parcial, actualizar el encounter existente y dejarlo en `in-progress`, sin requerir completitud clínica; :contentReference[oaicite:8]{index=8}
- la persistencia parcial en `in-progress` ya forma parte de la realidad operativa documentada del write flow. :contentReference[oaicite:9]{index=9}

Por lo tanto, este sprint no introduce una dirección nueva: corrige una desalineación entre comportamiento runtime y arquitectura vigente.

---

## 4. Decisión de alcance para este sprint

### Se decide priorizar

**Permitir persistencia parcial real en `in-progress`** sin exigir que todos los signos vitales estén completos para guardar progreso.

### No se decide cerrar en este sprint

La incorporación de semántica explícita del tipo:

- “no se registró frecuencia cardíaca”
- “no se registró frecuencia respiratoria”
- etc.

Esa alternativa puede ser clínicamente útil, pero agrega complejidad de formulario, persistencia y lectura. Se considera una posible mejora futura, no la respuesta más ágil ni más apropiada para corregir el bug actual.

---

## 5. Alcance

### Incluido

- auditar el contrato actual entre formulario, schema, action y domain rules para `saveEncounterProgressAction`;
- detectar dónde se está exigiendo completitud artificial de signos vitales;
- permitir guardar progreso con subset clínico real;
- diferenciar explícitamente validaciones de:
  - guardar progreso;
  - finalizar visita;
- revisar si la exigencia actual de signos vitales completos en `finalize` responde a una regla clínica real o a una herencia accidental de implementación;
- agregar cobertura de regresión para guardado parcial y rehidratación posterior.

### Excluido

- rediseño clínico del concepto “medición omitida” o “no registrada”;
- cambios de modelo para persistir motivos explícitos de ausencia de una medición;
- rediseño global del formulario;
- redefinición completa de reglas clínicas de cierre más allá de corregir validaciones evidentemente desalineadas;
- cambios en charts longitudinales o interpretación clínica de datos faltantes.

---

## 6. Riesgos y cuidados

### Riesgo 1 — Aflojar demasiado la finalización

Corregir el guardado parcial no debe implicar que `finalize` acepte cualquier payload clínico incompleto sin criterio.

**Mitigación:** separar claramente reglas de `save progress` vs reglas de `finished`, manteniendo cierre clínico donde realmente corresponda.

### Riesgo 2 — Drift entre register / save progress / finalize

Si las reglas quedan distintas por accidente entre acciones, puede reaparecer inconsistencia operativa.

**Mitigación:** revisar puntos shared de validación y endurecer sólo donde la intención de negocio realmente cambie.

### Riesgo 3 — Rehidratación parcial defectuosa

Permitir payloads parciales puede exponer bugs donde el form reinventa defaults o pierde datos al recargar.

**Mitigación:** reforzar tests de `save -> reload/remount -> rehydrate` con datasets parciales reales.

---

## 7. Orden de ejecución sugerido

### T1 — Auditoría de validación y wiring actual
Revisar schema, action, domain rules y mapper/wiring del formulario para identificar exactamente dónde se está imponiendo completitud artificial de signos vitales en `save progress` y/o `finalize`.

### T2 — Hardening de `saveEncounterProgressAction`
Ajustar el flujo para aceptar persistencia parcial real en `in-progress`, sin requerir set completo de signos vitales.

### T3 — Separación explícita de intención
Asegurar que “guardar progreso” y “finalizar visita” no compartan por accidente las mismas restricciones de completitud si la intención de negocio no es la misma.

### T4 — Revisión de reglas de cierre
Verificar si la exigencia actual de signos vitales completos para `finalize` está realmente respaldada por una regla clínica vigente del sistema o si debe relajarse parcialmente.

### T5 — Tests de regresión
Agregar cobertura mínima para:

- guardar progreso con subset clínico real;
- rehidratación correcta de ese subset;
- ausencia de defaults inventados;
- no regresión en finalize;
- no mezcla entre encounters.

---

## 8. Criterios de aceptación

El sprint se considera cerrado cuando:

1. Es posible guardar progreso en encounters `in-progress` con datos clínicos parciales reales. :contentReference[oaicite:10]{index=10} :contentReference[oaicite:11]{index=11}
2. El sistema no exige completar todos los signos vitales para persistir progreso si la intención es guardar y continuar luego.
3. La rehidratación posterior conserva exactamente lo guardado, sin inventar valores por defecto.
4. El flujo de finalize conserva únicamente las reglas clínicas realmente válidas para producir estado `finished`.
5. No se introducen regresiones en:
   - register flow,
   - start flow,
   - save progress,
   - finalize,
   - encounter detail encounter-centric.
6. La documentación y el backlog reflejan explícitamente la distinción entre:
   - parcialidad aceptada en `in-progress`;
   - requisitos reales de cierre en `finished`.

---

## 9. Resultado esperado

Al cerrar este sprint, el sistema debería comportarse de forma más coherente con el uso real del profesional y con la arquitectura ya aceptada:

- una visita en curso puede persistirse de forma incompleta;
- el sistema deja de forzar una completitud artificial antes de tiempo;
- la lógica de guardado parcial queda claramente separada de la lógica de cierre final. :contentReference[oaicite:12]{index=12} :contentReference[oaicite:13]{index=13}

---

## 10. Nota sobre alternativa descartada en esta fase

Se considera válida, pero fuera de alcance inmediato, una evolución futura donde el sistema permita registrar explícitamente ausencia de mediciones mediante estados como:

- “no se registró FC”
- “no se registró FR”
- etc.

Esa línea podría mejorar semántica clínica y trazabilidad, pero no es necesaria para resolver el bug actual ni para alinear el runtime con el modelo de persistencia parcial ya vigente. :contentReference[oaicite:14]{index=14}

---

## 11. Título corto sugerido para backlog

**Hardening de persistencia parcial clínica en `in-progress`**