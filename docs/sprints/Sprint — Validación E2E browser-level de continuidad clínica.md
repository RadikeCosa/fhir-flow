# Sprint — Validación E2E browser-level de continuidad clínica

## 1. Objetivo

Validar en entorno browser real que los flujos clínicos encounter-centric funcionan correctamente end-to-end, incluyendo:

- SSR (loaders)
- Server Actions
- navegación real
- estado de UI
- rehidratación

Este sprint busca confirmar que el sistema funciona como el usuario lo experimenta, no solo a nivel de tests de integración.

👉 E2E es clave porque permite testear el stack completo (server + client + navegación) tal como corre en producción

## 2. Problema a resolver

Hasta ahora el sistema tiene:

- arquitectura validada ✅
- contratos explícitos (finished + in-progress) ✅
- tests unitarios e integración sólidos ✅

Pero falta:

👉 evidencia reproducible en browser real

Riesgo actual:

- divergencias entre:
	- SSR vs hydration
	- server actions vs UI state
	- navegación vs revalidación
	- bugs que no aparecen en tests de integración

## 3. Alcance

### Incluye

Validación E2E de estos flujos:

### Flujo A — inicio y continuidad in-progress

- planned → start → in-progress
- → save progress → reload
- → rehydrate

### Flujo B — cierre de visita

- in-progress → finalize → finished
- → encounter detail read-only
- → patient detail source switch

### Flujo C — invariantes críticos

- no mezcla entre encounters
- identity por encounterId
- datasets correctos en UI
- navegación correcta entre routes

### No incluye

- cobertura completa de toda la app
- tests de charts longitudinales
- refactor de código
- cambios de arquitectura
- performance testing

## 4. Estrategia

Orden:

1. T1 — diagnóstico de E2E readiness
2. T2 — definición de escenarios E2E
3. T3 — implementación mínima (Playwright)
4. T4 — documentación / resultados

## 5. Riesgos

- tests frágiles (selectors, timing)
- testear contra entorno no representativo (dev vs prod)
- sobrecobertura innecesaria

👉 buena práctica: correr contra build de producción

## 6. Tareas

### T1 — Diagnóstico de E2E readiness

Auditar si el sistema está listo para E2E:

- ¿Playwright ya está instalado?
- ¿hay config existente?
- ¿cómo levantar la app para tests? (dev vs start)
- ¿hay data reproducible (mocks/seeds)?
- ¿selectors UI son estables?
- ¿hay dependencias externas que rompan determinismo?

### T2 — Definición de escenarios

Definir escenarios mínimos y suficientes:

- start encounter
- save progress
- reload
- finalize
- navegación patient/detail

### T3 — Implementación

- tests mínimos (2–4)
- no sobre-testear
- usar helpers reutilizables

### T4 — Documentación

- qué se validó
- qué falló (si algo)
- qué quedó fuera

## 7. Criterios de aceptación

El sprint está bien cerrado si:

- los flujos críticos funcionan en browser real
- no hay mezcla entre encounters
- el ciclo save → reload → rehydrate funciona
- finalize → read-only → switch funciona
- no se introducen tests frágiles

## 8. Resultado esperado

- confianza real en runtime
- evidencia reproducible de UX real
- base para CI/CD futuro