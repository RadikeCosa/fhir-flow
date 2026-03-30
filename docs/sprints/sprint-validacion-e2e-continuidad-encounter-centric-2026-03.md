# Sprint — Validación E2E de continuidad encounter-centric (write→read→render)

Fecha: 2026-03  
Estado: Planificado

---

## 1. Objetivo del sprint

Cerrar la incertidumbre operativa de continuidad clínica en flujos ya implementados, sin abrir desarrollo de features nuevas.
Validar de forma fuerte que la persistencia de escritura se refleja correctamente en lectura y render encounter-centric.
Confirmar no-mezcla entre encounters en superficies activas y preservar intacto el cierre previo de `finished encounter detail`.

---

## 2. Problema que resuelve este sprint

Aunque ya se cerró el hardening canónico de `finished encounter detail`, sigue abierta la validación integral de continuidad clínica en el circuito real (`write -> read -> render`), especialmente en superficies encounter-centric activas y en el comportamiento mínimo de `in-progress`.
Este sprint cierra esa brecha de evidencia mediante validación fuerte de integración, sin convertir el alcance en refactor de arquitectura ni en rediseño de producto.

---

## 3. Alcance

### Entra en este sprint

- definir una matriz explícita de validación para continuidad `write -> read -> render` en flujos ya implementados;
- auditar superficies encounter-centric activas para verificar aislamiento por `encounterId` (no-mezcla);
- ejecutar validación fuerte (integración server + render, no browser E2E) de:
  - persistencia de `saveEncounterProgressAction`;
  - recarga posterior del formulario con exactamente los datos persistidos;
  - ausencia de contaminación con otro encounter;
- verificar preservación del cierre de `finished encounter detail` como path ya cerrado;
- aplicar hardening mínimo y puntual solo si la validación detecta un bug concreto.

### No entra en este sprint

- nuevas features clínicas o de UX;
- optimización de interrupción/reanudación y rediseño del flujo de practitioner;
- cierre total de deuda histórica/longitudinal (incluyendo migración de datos sin `encounterId`);
- refactor de charts/history/lifecycle o rediseño de arquitectura de write/read;
- reapertura del sprint ya cerrado de canonical read en `finished encounter detail`;
- E2E browser completo (Playwright/Cypress u otro equivalente).

---

## 4. Riesgos principales

### Riesgo 1 — Validación convertida en refactor encubierto
Existe riesgo de ampliar el sprint hacia cambios estructurales fuera del objetivo de validación.

### Riesgo 2 — Sobrealcance en `in-progress`
Existe riesgo de confundir continuidad mínima de `in-progress` con cierre total de deuda de producto/lifecycle.

### Riesgo 3 — Cierre declarado sin evidencia suficiente
Existe riesgo de declarar “E2E cerrado” con evidencia débil, manual o no reproducible.

---

## 5. Definición de done

Este sprint se considera cerrado solo si se cumple todo lo siguiente:

- existe al menos una validación real o de integración fuerte de `write -> read -> render` en un flujo clínico ya implementado;
- queda evidenciado que `finished encounter detail` permanece cerrado y fuera de reapertura de alcance;
- `in-progress` queda validado solo en el nivel mínimo acordado:
  - rehidratación técnica mínima;
  - no-mezcla entre encounters;
  - `save/reload` consistente (`saveEncounterProgressAction` persiste y una recarga muestra exactamente ese dato);
- cualquier ajuste de código realizado durante el sprint corresponde a hardening mínimo y trazable a bug concreto detectado en validación;
- el cierre documental deja explícitos los límites de alcance y lo que permanece fuera de cierre.

---

## 6. Orden de ejecución

1. consolidar criterios verificables y matriz de validación (`write -> read -> render` + no-mezcla);
2. auditar superficies encounter-centric activas para mapear puntos de riesgo;
3. ejecutar validaciones de integración fuerte sobre continuidad real y `save/reload` consistente;
4. aplicar hardening mínimo solo en presencia de bug concreto evidenciado;
5. cerrar documentación del sprint con evidencia y límites explícitos.

---

## 7. Tickets del sprint

### T1 — Criterios y matriz de validación

Definir criterios verificables de continuidad `write -> read -> render` y de no-mezcla encounter-centric.
Incluir casos mínimos de `in-progress` (rehidratación, no-mezcla, save/reload consistente).

### T2 — Auditoría de superficies encounter-centric activas

Revisar patient/encounter surfaces activas para detectar puntos de mezcla o fallback indebido.
Entregar mapa de riesgos y casos a validar sin proponer refactor amplio.

### T3 — Validación E2E / integración fuerte

Ejecutar validaciones de punta a punta en modalidad de integración fuerte (server + render) sobre flujos ya implementados.
Probar persistencia real de progreso + recarga fiel por `encounterId`, sin contaminación cruzada.

### T4 — Hardening mínimo por bug concreto

Aplicar fixes puntuales solo cuando validación demuestre fallo específico.
Excluir mejoras cosméticas, rediseños o cambios de arquitectura.

### T5 — Cierre documental de sprint

Documentar evidencia, resultados por criterio y límites de lo no cerrado.
Registrar explícitamente que `finished detail` sigue preservado como cierre previo.

---

## 8. Criterios de aceptación del sprint

- la validación demuestra continuidad efectiva `write -> read -> render` en al menos un circuito clínico implementado;
- la validación confirma no-mezcla encounter-centric en superficies activas auditadas;
- el comportamiento mínimo de `in-progress` queda verificado (rehidratación técnica mínima, no-mezcla y `save/reload` consistente);
- `finished encounter detail` se mantiene explícitamente como cierre ya logrado y no reabierto;
- la evidencia de cierre se basa en integración fuerte reproducible (server + render), no en browser E2E completo ni en verificación solo manual.

---

## 9. Notas finales

Este sprint es de validación operativa de flujos ya implementados.
No introduce nuevas features ni cierra deuda histórica/longitudinal completa.

La decisión de alcance queda cerrada: para este sprint, la suficiencia de validación es integración fuerte (server + render), y el browser E2E completo permanece fuera de alcance.

El cierre del sprint anterior de canonical read en `finished encounter detail` se preserva como deuda ya cerrada en su path específico, sin extender ese cierre a otras deudas longitudinales o de continuidad total de producto.
