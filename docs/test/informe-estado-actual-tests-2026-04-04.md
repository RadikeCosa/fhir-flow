# Estado de testing — ejecución del 2026-04-04

## 1) Objetivo y alcance

Este documento consolida, para revisión de PR, el estado observado de testing en una ejecución puntual del **2026-04-04**.

Alcance de esta evidencia:
- Estado de la suite **Vitest**.
- Estado de ejecución **Playwright/E2E en runner Codex**.
- Separación explícita entre:
  - estado del repositorio,
  - limitaciones del entorno donde se corrió,
  - deuda real de testing/infra.

No pretende afirmar comportamiento universal en todos los entornos.

## 2) Contexto de ejecución

- Commit evaluado: `4e7d3a2`.
- Branch: `work`.
- Timestamp de contexto (UTC): `2026-04-04T22:10:41Z`.
- Entorno: Linux x86_64, Node `v22.21.1`, npm `11.4.2`.
- Restricción observada del runner: salida bloqueada hacia Google Fonts (`CONNECT tunnel failed, response 403`).

## 3) Estado de Vitest

Resultado de `npm test` en esta ejecución:
- **315 tests** totales.
- **314 passing**.
- **1 failing**.

Fallo detectado:
- `infrastructure/fhir/repositories/__tests__/eva-assessment.fhir-repository.test.ts`
- Caso: `calls search with encounter parameter when finding by encounter id`.

Lectura operativa:
- La falla observada corresponde a desalineación de expectativa del test frente a la firma real invocada (`search(..., params, { cache: 'no-store' })`).
- Impacto: deja Vitest en rojo en esta corrida; no evidencia por sí sola regresión clínica/runtime.

## 4) Estado de Playwright / E2E

Resultado de `npm run test:e2e` en esta ejecución:
- Los escenarios E2E **no llegaron a correr en Codex**.
- Causa inmediata: `webServer` no inició porque `npm run build` falló en `next/font/google` al intentar obtener `Geist` y `Geist Mono`.

Importante:
- Esta evidencia demuestra bloqueo **en este runner**.
- No demuestra por sí misma que Playwright falle en todo entorno del proyecto.

## 5) Diferencia entre entorno Codex y entorno normal del proyecto

- **Verificado en Codex:** restricción de salida hacia `fonts.googleapis.com` y fallo de build asociado.
- **Estado en entorno normal (con salida externa habilitada):** probable ejecución correcta de build/E2E, pero **no verificada en esta corrida**.

## 6) Deuda real identificada

1. **Deuda de suite Vitest:** 1 test desalineado con contrato de llamada observado.
2. **Deuda de robustez de testing/infra:** pipeline E2E depende de `npm run build`; el build depende de fetch externo por fonts (`next/font/google`) en la configuración actual.

## 7) Recomendaciones

1. Corregir el test fallido de EVA para alinear expectativa con la firma real (incluyendo options de request).
2. Reducir fragilidad de E2E en entornos restringidos:
   - fuentes locales / estrategia offline, o
   - fallback controlado para CI,
   - y documentar precondiciones de red para `build` + `test:e2e`.
3. Mantener esta distinción en PRs futuros: “falla del repo” vs “limitación del runner”.

## 8) Evidencia asociada

- `docs/test/evidence/2026-04-04_npm-test.txt`
- `docs/test/evidence/2026-04-04_npm-run-build.txt`
- `docs/test/evidence/2026-04-04_npm-run-test-e2e.txt`
- `docs/test/evidence/2026-04-04_curl-fonts.txt`
