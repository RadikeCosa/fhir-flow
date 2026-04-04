---
title: Sprint — Hardening global del contrato longitudinal/histórico (fuera del cierre acotado)
date: 2026-04
status: proposed
---

# Sprint — Hardening global del contrato longitudinal/histórico (fuera del cierre acotado)

## 1. Objetivo

Endurecer el contrato longitudinal/histórico a nivel global/system-wide fuera de las surfaces ya cerradas en alcance acotado, agregando evidencia de no-regresión cross-surface y una política más explícita para composición histórica/legacy, sin reabrir los boundaries ya protegidos de `encounters/data.ts`, `patient detail` ni `encounter detail`. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

Este sprint no busca revalidar principios ya cerrados ni forzar cambios de código productivo si no aparecen brechas verificables fuera del closure acotado previo. Su foco es transformar el remanente global/system-wide en un frente verificable, con entrada test-first y con límites explícitos para evitar retrabajo. :contentReference[oaicite:2]{index=2}

## 2. Problema a resolver

El cierre acotado anterior ya dejó blindados los límites locales más sensibles del read model global, y no debe reabrirse. Lo que sigue abierto es el frente global/system-wide: cómo sostener el contrato longitudinal/histórico fuera de esos puntos ya endurecidos y testeados. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}

La deuda remanente se concentra en tres ejes:

- contrato longitudinal/histórico global fuera del loader acotado de history;
- política global para históricos/legacy sin `encounterId`;
- evidencia de regresión cross-surface fuera del set de surfaces ya validadas. :contentReference[oaicite:5]{index=5}

El riesgo no es volver a discutir principios ya cerrados, sino dejar abiertos puntos donde una composición longitudinal/histórica pueda derivar en drift contractual o en asociación ambigua fuera del bounded scope ya protegido. :contentReference[oaicite:6]{index=6} :contentReference[oaicite:7]{index=7}

## 3. Por qué este sprint tiene sentido ahora

El repo ya tiene un cierre acotado explícito y operativo para la frontera local encounter-centric vs longitudinal en las surfaces críticas auditadas. Por eso el siguiente paso razonable no es re-ejecutar ese hardening, sino definir y blindar el remanente real a nivel global/system-wide. :contentReference[oaicite:8]{index=8} :contentReference[oaicite:9]{index=9}

Este sprint toma ese remanente y lo convierte en un frente verificable, con foco en tests primero y con exclusiones explícitas para evitar scope confusion y retrabajo. También reconoce una salida válida sin cambios productivos: si el inventario y los tests no muestran gap verificable fuera del closure acotado, el sprint puede cerrarse con evidencia de no-regresión y alineación documental. :contentReference[oaicite:10]{index=10}

## 4. Alcance incluido

Incluye:

1. **Matriz global de surfaces fuera del closure acotado**
   - identificar qué surfaces/contracts longitudinales siguen abiertas fuera del bounded scope anterior;
   - distinguirlas de las ya protegidas.

2. **Tests de contrato global longitudinal/histórico**
   - agregar regresiones cross-surface para composición longitudinal/histórica;
   - cubrir policy de legacy sin `encounterId` en las surfaces que hoy sigan abiertas.

3. **Ajustes mínimos condicionados por fallo**
   - aplicar cambios solo si los tests nuevos detectan brecha real;
   - priorizar correcciones puntuales sobre composición de lectura, transformación longitudinal o ensamblado de props antes que refactor.

4. **Evidencia de no-regresión y alineación documental**
   - registrar con precisión qué se endureció globalmente;
   - dejar explícito qué sigue fuera de alcance system-wide.

## 5. Alcance excluido

No incluye:

- reabrir T1–T5 del sprint anterior;
- reabrir el confinement local de fallback-by-date ya cerrado en `app/patients/[id]/encounters/data.ts`;
- reabrir `encounter detail` canónico por `encounterId`;
- reabrir `patient detail` con fuente única `inProgressEncounter ?? lastFinishedEncounter`;
- refactor amplio de loaders ya cerrados;
- rediseño general del read model;
- cambios de lifecycle o write flow;
- usar browser E2E global como barra mínima obligatoria de este sprint. :contentReference[oaicite:11]{index=11} :contentReference[oaicite:12]{index=12} :contentReference[oaicite:13]{index=13}

## 6. Riesgos principales

### 6.1 Scope confusion

El mayor riesgo de este sprint es reabrir surfaces ya cerradas por confusión documental o por usar wording demasiado genérico. Este sprint debe operar solo sobre el remanente global fuera del bounded scope anterior. :contentReference[oaicite:14]{index=14}

### 6.2 Scope creep hacia refactor amplio

El objetivo no es rediseñar el subsistema longitudinal completo, sino endurecer el contrato global con evidencia y cambios mínimos donde haga falta.

### 6.3 Tests insuficientemente dirigidos

Si los tests no distinguen bien qué es global/system-wide y qué ya está bounded-closed, se puede terminar tocando código correcto o duplicando blindajes ya existentes.

### 6.4 Sobre-ejecutar un sprint sin gap real

Si TG1 no encuentra brechas verificables fuera del closure acotado, insistir en cambios productivos sería una forma de retrabajo. El sprint debe poder cerrarse con evidencia y documentación si ese fuera el resultado.

## 7. Landing zone inicial (test-first)

La entrada recomendada para este sprint es, primero, sobre tests que validen composición de lectura y consistencia cross-surface fuera del closure acotado ya cerrado:

- `app/patients/[id]/encounters/__tests__/data.test.ts`
- `app/patients/[id]/__tests__/data.test.ts` :contentReference[oaicite:15]{index=15} :contentReference[oaicite:16]{index=16} :contentReference[oaicite:17]{index=17}

`lib/patient/formatters/__tests__/encounter-charts.formatters.test.ts` no debe tratarse como landing zone primaria del sprint. Ese archivo entra solo como superficie secundaria si TG1/TG2 detectan una brecha verificable en composición longitudinal que ya llegue materializada a nivel de series/fechas formateadas, y no como lugar base para validar policy global de legacy ni source-of-truth del read model. Esto mantiene separado el hardening del contrato longitudinal/histórico del subsistema específico de visualización clínica. :contentReference[oaicite:18]{index=18} :contentReference[oaicite:19]{index=19} :contentReference[oaicite:20]{index=20}

Archivos candidatos a cambio **solo si esos tests fallan**:

- `app/patients/[id]/encounters/data.ts`, si la brecha vive en composición/read model;
- `lib/patient/formatters/encounter-charts.formatters.ts` o `lib/patient/formatters/clinical-ranges.adapter.ts`, solo si el problema aparece en la transformación longitudinal ya derivada;
- eventualmente ensamblado de props a nivel de ruta/página, solo si el gap no vive en la lógica de composición ni en la transformación longitudinal. :contentReference[oaicite:21]{index=21} :contentReference[oaicite:22]{index=22}

## 8. Ejecución propuesta

### TG1 — Matriz global de surfaces fuera del closure acotado

Inventariar exactamente qué surfaces longitudinales/históricas siguen sin blindaje global, dejando fuera explícitamente:

- `encounters/data.ts` en su boundary local ya cerrado,
- `encounter detail`,
- `patient detail` source selection. :contentReference[oaicite:23]{index=23} :contentReference[oaicite:24]{index=24}

**Resultado esperado:** lista verificable de surfaces/contratos realmente abiertos.

**Cláusula de salida temprana:** si TG1 no encuentra brechas verificables fuera del closure acotado, el sprint puede cerrarse sin cambios de código productivo, dejando evidencia de no-regresión, inventario explícito del alcance remanente y alineación documental mínima. Ese resultado también cuenta como cierre válido del sprint.

### TG2 — Tests de contrato global longitudinal/histórico

Agregar pruebas de regresión cross-surface para:

- composición longitudinal global;
- policy de legacy sin `encounterId` fuera del bounded scope;
- invariantes de no-regresión entre selector clínico encounter-centric y datasets longitudinales cuando corresponda. :contentReference[oaicite:25]{index=25} :contentReference[oaicite:26]{index=26} :contentReference[oaicite:27]{index=27}

**Resultado esperado:** cobertura que detecte brechas reales sin reabrir T1–T4 anteriores.

### TG3 — Ajustes mínimos condicionados por fallo

Aplicar cambios solo donde TG2 falle.

Prioridades:
- primero `data.ts` si el problema vive en composición/read model;
- después formatters/adapters si el problema aparece en transformación longitudinal ya derivada;
- recién al final ensamblado de props a nivel de ruta/página, solo si la brecha no vive en la lógica core de composición ni en transformación. :contentReference[oaicite:28]{index=28} :contentReference[oaicite:29]{index=29}

**Resultado esperado:** correcciones mínimas, sin refactor amplio y sin tocar surfaces ya cerradas salvo regresión real demostrada por tests.

### TG4 — Evidencia de no-regresión + actualización documental acotada

Cerrar el sprint con:

- evidencia de qué se endureció globalmente;
- límites explícitos de lo que sigue fuera de alcance;
- wording sincronizado en backlog/validación/sprint para evitar nuevo drift. :contentReference[oaicite:30]{index=30} :contentReference[oaicite:31]{index=31} :contentReference[oaicite:32]{index=32}

## 9. Criterios de aceptación

El sprint se considera cumplido si:

1. existe una matriz explícita de surfaces globales aún abiertas fuera del closure acotado;
2. se agregan tests de regresión orientados al contrato longitudinal/histórico global;
3. no se reabren surfaces bounded-closed salvo regresión demostrada por test automatizado nuevo o ajustado dentro del alcance del sprint;
4. cualquier cambio de código queda justificado por fallo previo en TG2;
5. el sprint deja evidencia concreta de no-regresión cross-surface en el área nueva cubierta;
6. la documentación diferencia con claridad:
   - lo ya cerrado en alcance acotado;
   - lo endurecido ahora a nivel global;
   - lo que sigue abierto system-wide.

**Nota de alcance:** la demostración de regresión para este sprint no exige browser E2E como barra base. Loader/integration tests y, cuando corresponda, formatter-level tests, son evidencia suficiente mientras el problema auditado permanezca dentro del contrato longitudinal/histórico global y fuera de surfaces ya bounded-closed. :contentReference[oaicite:33]{index=33} :contentReference[oaicite:34]{index=34}

## 10. Definición de done

- TG1 cerrado con surfaces abiertas verificadas;
- TG2 implementado con tests relevantes;
- TG3 ejecutado solo si hizo falta;
- TG4 reflejado en documentación mínima necesaria;
- sin reabrir el bounded closure previo;
- sin scope creep hacia refactor general del read model;
- o, si TG1 no encuentra brecha verificable, cierre con evidencia de no-regresión y sin cambios de código productivo.

## 11. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

- mejor explicitación del contrato longitudinal/histórico fuera del closure acotado;
- menor riesgo de drift cross-surface en composición histórica/legacy;
- más evidencia de regresión global sin tocar boundaries ya protegidos;
- mejor separación entre cierre acotado previo y hardening global posterior. :contentReference[oaicite:35]{index=35} :contentReference[oaicite:36]{index=36} :contentReference[oaicite:37]{index=37}

Si TG1 no detecta brecha verificable, el impacto esperado pasa a ser otro, igualmente válido:
- confirmación de que no queda gap técnico real fuera del bounded scope en el área auditada;
- documentación más precisa del remanente system-wide;
- y prevención de retrabajo por scope confusion.

## 12. Límites explícitos

Este sprint **no** declara cierre global total del read model ni de la deuda longitudinal/histórica completa.

Este sprint **no** invalida ni reemplaza el cierre acotado anterior.

Este sprint **no** reabre las reglas locales ya blindadas en `encounters/data.ts`, `patient detail` o `encounter detail`, salvo que un test nuevo y específico demuestre una regresión fuera de alcance hasta ahora no cubierta. :contentReference[oaicite:38]{index=38} :contentReference[oaicite:39]{index=39}

Este sprint **no** usa el subsistema de charts como source-of-truth del problema; sólo puede tocarlo si una brecha verificable del contrato longitudinal/histórico ya aparece materializada en transformación/formateo de series. :contentReference[oaicite:40]{index=40} :contentReference[oaicite:41]{index=41}

## 13. Próximo paso después del sprint

Una vez endurecido este remanente global, recién ahí tendría sentido re-evaluar si queda una fase posterior para continuidad system-wide/browser-level completa, o si la deuda longitudinal/histórica residual ya pasó a otro nivel de prioridad. Si TG1 no encuentra brechas verificables, el siguiente paso natural sería replantear el backlog sobre deuda efectivamente abierta y no sobre supuestos ya cerrados.