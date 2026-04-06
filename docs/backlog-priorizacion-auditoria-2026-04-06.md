# Auditoría documental y priorización de backlog (2026-04-06)

## 1. Executive summary

- El backlog está **útil pero contaminado por ruido acumulado**: mezcla cierres bounded, cierres por evidencia y deudas globales en una misma capa narrativa.
- Estado general: la arquitectura base está estabilizada en frentes encounter-centric y write-flow operativo; la deuda abierta dominante es **global/system-wide longitudinal** y de **taxonomía documental**.
- Frentes realmente abiertos detectados: **3**.
  1. Continuidad/consistencia clínica **system-wide** fuera de superficies acotadas.
  2. Read model longitudinal/histórico global (más allá de closures bounded).
  3. Gobernanza documental/taxonómica del backlog (drift y sobrerrepresentación de temas cerrados).
- Próximo foco recomendado: sprint de **normalización de backlog + definición verificable de frontera global de continuidad** (sin reabrir bounded closures).

## 2. Mapa de estado real

### 2.1 Cerrado real

1. **Lifecycle operativo planned -> in-progress -> finished**
   - Estado: cerrado real en runtime operativo de write.
   - Alcance: transición explícita en encounters planificados + finalize estricto.
   - Evidencia: ADR y write-phase fijan transición y restricción de finalize; validación lo marca “Válido hoy”.
   - Observación: cierre real en perímetro write actual, no extrapolable a continuidad global.

2. **Register flow separado y modos de creación explícitos**
   - Estado: cerrado real.
   - Alcance: separación `/new` vs `/register`; creación start/complete.
   - Evidencia: backlog y validación lo marcan como válido.
   - Observación: deuda residual no está en entry points sino en lectura global longitudinal.

3. **Save progress como operación independiente**
   - Estado: cerrado real (operativo).
   - Alcance: in-progress encounter-centric en front write.
   - Evidencia: backlog + validación + write-phase.
   - Observación: no implica por sí solo garantía system-wide de continuidad.

### 2.2 Cerrado bounded / acotado

1. **Canonical read de finished encounter detail**
   - Qué sí quedó cerrado: detail por `encounterId`, sin fallback temporal en ese surface.
   - Qué no quedó cerrado: read model global fuera de ese detail.
   - Riesgo: leerlo como “canonical read global cerrado”.

2. **Continuidad in-progress encounter-centric (encounter detail + patient detail source switching)**
   - Qué sí: loop save/reload/rehydrate validado en surfaces acotadas.
   - Qué no: continuidad browser global longitudinal/charts y garantías system-wide.
   - Riesgo: tomar “sin bug runtime en matriz bounded” como cierre total.

3. **Cobertura browser E2E de 2 huecos puntuales**
   - Qué sí: coexistencia in-progress+finished y contraste post-finalize en escenarios definidos.
   - Qué no: cobertura browser system-wide.
   - Riesgo: confundir “cierre de huecos acotados” con “E2E completo”.

### 2.3 Abierto real

1. **Continuidad clínica system-wide fuera de surfaces acotadas**
   - Tipo de gap: arquitectura + cobertura.
   - Por qué sigue abierto: todos los cierres recientes reiteran límite bounded/no global.
   - Impacto: riesgo de sobreconfianza y regresiones fuera de perímetro auditado.
   - Dependencias: definición de frontera global y criterio de aceptación operacional.

2. **Longitudinal/histórico global (read model cross-surface)**
   - Tipo de gap: arquitectura + cobertura.
   - Por qué sigue abierto: validación y backlog mantienen deuda global abierta, aunque TG1 no detectó bug nuevo.
   - Impacto: deuda estratégica de coherencia inter-superficie.
   - Dependencias: policy explícita para legacy `derived-by-date` sin `encounterId`.

3. **Validation layers / inverse mapper purity fuera de zonas ya estabilizadas**
   - Tipo de gap: arquitectura/documental de enforcement.
   - Por qué sigue abierto: validación lo mantiene parcialmente válido (disciplina por PR).
   - Impacto: drift gradual de capas y responsabilidades.
   - Dependencias: checklist operativo y gobernanza de revisión.

### 2.4 Abierto nominal / deuda documental

1. **Extensión global de `ActionError.details` fuera de encounter write**
   - Por qué no parece deuda técnica prioritaria: validación/write-phase dicen que no hay perímetro operativo activo para extender implementación.
   - Por qué sigue apareciendo abierta: arrastre de backlog histórico como deuda “global” genérica.
   - Recomendación: reclasificar como “deuda nominal condicionada por aparición de nuevo perímetro”.

2. **Reapertura discursiva de practitioner consistency fuera de encounter write**
   - Por qué no es prioridad técnica: frente encounter write está declarado válido hoy en alcance operativo.
   - Por qué sigue apareciendo: mezcla entre prudencia arquitectónica y tickets ya cerrados.
   - Recomendación: mover a “guardrail de regresión”, no a backlog de implementación inmediata.

3. **Ítems de UI/estructura (EncounterList/FinalizeForm) sobrerrepresentados**
   - Por qué no son deuda urgente: checkpoint los clasifica como imperfección aceptable y candidato futuro.
   - Por qué siguen abiertos: listado de “still open” sin peso estratégico.
   - Recomendación: bajar a P3/P4 y marcar explícitamente “no bloqueante”.

## 3. Priorización recomendada

### P1

1. **Definir y cerrar taxonomía operativa de backlog (global vs bounded vs nominal)**
   - Por qué P1: hoy el principal riesgo es de decisión equivocada por ruido, no de bug confirmado.
   - Riesgo que evita: reabrir frentes cerrados bounded o declarar cierres globales falsos.
   - Valor: mejora inmediata de priorización de sprint.
   - Desbloquea: planificación de continuidad system-wide con alcance verificable.
   - Confianza: **alto**.

2. **Ticket de continuidad clínica system-wide: definición de alcance verificable (sin implementación todavía)**
   - Por qué P1: es la deuda técnica real más relevante que queda abierta por documentos.
   - Riesgo que evita: deuda amplia sin criterio de cierre ni evidencia comparable.
   - Valor: convierte “deuda global” en backlog accionable.
   - Desbloquea: sprint técnico posterior focalizado.
   - Confianza: **alto**.

### P2

1. **Longitudinal/histórico global: policy explícita para legacy sin `encounterId`**
   - Por qué P2: abierto real, pero TG1 no mostró bug nuevo inmediato.
   - Riesgo que evita: inconsistencia futura en integración de históricos.
   - Valor: clarifica contrato de convivencia encounter-centric vs longitudinal.
   - Desbloquea: cierre progresivo de deuda global.
   - Confianza: **medio**.

2. **Enforcement sostenido de validation layers / mapper purity (checklist PR)**
   - Por qué P2: riesgo de deriva acumulativa, no incidente urgente.
   - Riesgo que evita: contaminación de capas.
   - Valor: mantiene salud arquitectónica.
   - Desbloquea: menor costo de hardening futuro.
   - Confianza: **medio-alto**.

### P3

1. **Rediseño potencial de `encounters/data.ts`**
2. **Slimming de `EncounterList`**
3. **Partición de `FinalizeEncounterForm`**

Todos con mismo criterio:
- importante pero no inmediato;
- impacto más de mantenibilidad que de riesgo funcional urgente;
- confianza **medio**.

### P4

1. **Deuda nominal de ActionError global sin perímetro operativo**
2. **Reapertura genérica de practitioner fuera de encounter write**
3. **Cualquier ítem histórico que replantee cierres bounded sin evidencia nueva**

- valor inmediato bajo;
- riesgo principal: distracción y churn documental;
- confianza **alto**.

## 4. Limpieza sugerida del backlog (mínima y quirúrgica)

1. **Fusionar** los tres bloques de auditoría bounded de continuidad clínica (2026-04-05/06) en un único bloque “Cierre bounded consolidado + límites”.
2. **Pasar a histórico** los sprints 2026-03 completamente cerrados que ya tienen evidencia estable y no compiten por prioridad.
3. **Reetiquetar explícitamente como bounded** todo cierre de canonical read finished detail e in-progress continuity encounter-centric.
4. **Reetiquetar como deuda nominal/documental** `ActionError.details` global hasta que exista nuevo frente server-action real.
5. **Reducir sobrerrepresentación** de “still open” no bloqueantes (EncounterList/FinalizeForm) moviéndolos a bloque “Mejoras diferibles”.

## 5. Riesgos de interpretación

1. “Cerrado bounded” leído como “cerrado global”.
2. “Sin bug runtime verificable” leído como “no existe problema”.
3. “Deuda abierta” usada sin ticket/criterio de aceptación.
4. Mezcla entre gap de contrato arquitectónico y gap de cobertura/evidencia.
5. Mezcla entre deuda técnica real y drift documental.

## 6. Próximo sprint recomendado

### Título tentativo

**Sprint: Consolidación de Fronteras Globales y Limpieza Taxonómica del Backlog**

### Objetivo

Cerrar ambigüedad operativa del backlog y dejar definido un único frente técnico global accionable (continuidad system-wide), preservando cierres bounded vigentes.

### Por qué este sprint ahora

Porque el mayor riesgo actual es de priorización errónea por drift documental: el repositorio muestra muchos cierres acotados y pocos gaps técnicos nuevos verificables.

### Alcance sugerido

- Consolidar secciones duplicadas/solapadas del backlog.
- Etiquetar cada frente en una taxonomía única: cerrado real, cerrado bounded, abierto real, abierto nominal.
- Crear 1 épica/ticket global de continuidad system-wide con DoD de evidencia explícita (qué surfaces, qué invariants, qué señales de cierre).
- Definir explícitamente qué no se considera bug (cuando el resultado es contractual y esperado).

### No alcance explícito

- No reabrir practitioner consistency encounter write ya cerrado.
- No reabrir canonical read bounded de finished detail.
- No reabrir cobertura browser bounded ya cerrada.
- No rediseñar `encounters/data.ts` en este sprint.

### Definition of Done mínima

- Backlog con taxonomía normalizada y sin duplicados de cierres acotados.
- Lista de abiertos reales reducida a tickets accionables con owner + evidencia requerida.
- Deudas nominales marcadas explícitamente como “no implementación inmediata”.
- Documento de alcance del próximo sprint técnico global firmado (fuentes: ADR/write-phase/validación).

### Riesgo principal

Que el sprint se convierta en “solo limpieza editorial” y no deje un frente técnico global verdaderamente accionable.

### Opciones

- **Opción conservadora:** solo limpieza taxonómica y reclasificación de backlog.
- **Opción agresiva:** limpieza + ejecución de primer hardening global longitudinal/browser en el mismo sprint.
- **Recomendación:** **intermedia (recomendada)**: limpieza taxonómica + definición verificable del ticket global, sin ejecutar hardening amplio todavía. Maximiza foco y minimiza reaperturas erróneas.

## 7. Tabla final resumen

| Frente | Estado real | Alcance | Tipo de gap | Prioridad | Acción sugerida |
|---|---|---|---|---|---|
| Lifecycle planned->in-progress->finished | Cerrado real | Write flow operativo | - | P3 | Mantener guardrails, sin reapertura |
| Register flow + creation modes | Cerrado real | Entry points y creación | - | P3 | Solo regresión/documentación mínima |
| Save progress separado | Cerrado real | Encounter write in-progress | - | P3 | Mantener cobertura de regresión |
| Canonical read finished detail | Cerrado bounded | Solo detail `finished` | Cobertura global pendiente | P2 | Mantener bounded; no extrapolar |
| In-progress continuity encounter-centric | Cerrado bounded | encounter detail + patient detail seleccionados | Cobertura global pendiente | P2 | No reabrir bounded; definir global scope |
| Browser E2E bounded (2 huecos) | Cerrado bounded | Flujos puntuales sin charts | Cobertura global pendiente | P2 | Sostener tests; no sobredimensionar |
| Continuidad clínica system-wide | Abierto real | Global/cross-surface | Arquitectura + cobertura | P1 | Ticket global con DoD verificable |
| Longitudinal/histórico global | Abierto real | System-wide read model | Arquitectura + cobertura | P2 | Policy explícita legacy + plan incremental |
| ActionError fuera de encounter write | Abierto nominal | Sin perímetro operativo real actual | Documental | P4 | Reclasificar a deuda nominal condicionada |
| Practitioner fuera de encounter write | Histórico / nominal | Frente operativo actual ya cerrado | Documental | P4 | Pasar a guardrail, no backlog activo |
| EncounterList/FinalizeForm tamaño | Abierto no crítico | UI/mantenibilidad | UX/documental | P3 | Mantener como mejora diferible |
