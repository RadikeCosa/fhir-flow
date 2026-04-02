---
title: Sprint — Cierre del submit de save-progress en encounter detail editable
date: 2026-04-02
---

# Sprint — Cierre del submit de save-progress en encounter detail editable

## 1. Objetivo

Cerrar las incidencias de submit en el surface editable `in-progress` del encounter detail: hardening del ciclo de guardado, feedback explícito de éxito y corrección del contrato de la Server Action para `save-progress`.

## 2. Problema real abordado

El problema no era una restricción real de validación ni de reglas de dominio. La percepción de que “todos los signos vitales eran obligatorios” venía del submit anterior, que dependía de redirect y dejaba el feedback del guardado parcial poco claro.

En runtime eso se traducía en dos síntomas concretos:

- el UI podía quedar en estado pendiente después de guardar progreso;
- los errores inesperados del guardado no siempre quedaban visibles en el mismo surface.

## 3. Alcance ejecutado

Se ejecutó un cierre acotado sobre el flujo de `save-progress` en el encounter detail editable.

Incluye:

- hardening del ciclo de submit en el cliente;
- feedback inline de éxito para `save-progress`;
- corrección del contrato de éxito de la Server Action;
- sincronización documental mínima para reflejar el estado real.

No incluye:

- cambios en `finalize`;
- cambios en schemas o domain rules;
- cambios en charts;
- cierre del bug nuevo de duplicación de datos parciales después de finalizar.

## 4. Cambios implementados

### Cliente

En `app/patients/[id]/encounters/[encounterId]/components/FinalizeEncounterForm/index.tsx` se endureció el flujo de `save-progress` para que:

- no deje el botón en estado pendiente al resolver;
- limpie el estado activo del intento al terminar;
- muestre un mensaje inline de éxito sobre el mismo surface editable;
- exponga un error visible cuando el guardado falla de forma inesperada.

### Server Action

En `app/patients/[id]/encounters/[encounterId]/actions/save-encounter-progress.action.ts` se corrigió el contrato de éxito:

- ya no redirige en éxito;
- revalida las rutas necesarias;
- retorna `{ success: true }` al cliente.

### Documentación

- `docs/ADR-003.md` ya había sido ajustado para dejar explícito que `save-progress` permanece en el surface editable y devuelve éxito al cliente.
- Este sprint cierre documenta el estado final de ese cambio.

## 5. Evidencia / cobertura

La cobertura ya incorporada para este cierre incluye:

- pruebas unitarias de `save-encounter-progress.action` que validan retorno exitoso y revalidación de rutas;
- pruebas de render de `FinalizeEncounterForm` que validan el mensaje inline de éxito y el banner de error visible.

## 6. Límites explícitos del cierre

- `finalize` permanece terminal y sin cambio en su semántica central.
- `save-progress` queda confirmado como flujo que permanece en el surface editable y devuelve éxito al cliente.
- Este cierre no resuelve el bug nuevo de duplicación de snapshot parcial que aparece como valores extra en charts/detail después de finalizar.

## 7. Impacto en UX

El usuario obtiene confirmación visible e inmediata al guardar progreso en el encounter detail editable.

El surface deja de depender de un redirect para comunicar éxito y deja de fallar de forma silenciosa cuando ocurre una excepción inesperada.

## 8. Impacto en arquitectura

No se cambió ninguna decisión arquitectónica.

El cambio alinea el comportamiento real de `save-progress` con el contrato ya establecido de `ActionResult` en Server Actions. La validación de dominio, el inverse mapper y el cliente FHIR quedan fuera de este cierre.

## 9. Backlog / deuda después del cierre

- El issue de submit/UX de `save-progress` queda cerrado.
- La falsa deuda de “todos los signos vitales obligatorios” no debe seguir apareciendo como restricción de validación.
- Sigue abierta, fuera de este cierre, la deuda nueva de duplicación de datos parciales después de finalize.
- También sigue abierta la validación browser-level más amplia del circuito completo.

## 10. Próximo paso

Separar y documentar el bug de duplicación post-finalize en un ticket propio, sin mezclarlo con este cierre.
