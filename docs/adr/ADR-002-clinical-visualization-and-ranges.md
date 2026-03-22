# ADR-002: Clinical Visualization and Ranges

**Status:** Proposed  
**Date:** 2026-03  
**Project:** FHIR Flow

> Este ADR formaliza decisiones arquitectónicas sobre:
> - visualización clínica
> - rangos clínicos
> - adapter
> - charts
>
> Este documento complementa ADR-001 y no lo reemplaza. ADR-001 sigue siendo el documento de autoridad para lifecycle de encounters, write architecture y responsabilidades de escritura.

## 1. Contexto

La evolución reciente del subsistema de visualización clínica permitió consolidar un pipeline más consistente para signos vitales, EVA y charts longitudinales. Sin embargo, antes de formalizar estas decisiones existían problemas repetidos en varias capas.

### Problemas previos

- los charts usaban colores que no siempre respondían a una semántica clínica consistente;
- parte de la lógica clínica quedaba duplicada entre UI y dominio;
- existía inconsistencia entre el tratamiento de métricas de un solo valor y métricas de múltiples puntos o múltiples dimensiones;
- faltaban zonas de referencia explícitas que ayudaran a interpretar visualmente normalidad, alerta y criticidad.

Estas inconsistencias generaban varias consecuencias indeseadas:

- la misma métrica podía cambiar de significado visual según el componente;
- el criterio clínico podía dispersarse entre formatters, charts y fallbacks de UI;
- resultaba más difícil validar que badges, overlays y tooltips respondieran a una única semántica;
- la visualización longitudinal corría riesgo de mostrar tendencias correctas pero con semántica clínica incompleta o inconsistente.

Este ADR fija la dirección arquitectónica para evitar que la visualización clínica evolucione como una suma de decisiones locales de UI.

## 2. Decisión

### A. Fuente de verdad única

Se establece una fuente de verdad única para la semántica clínica reutilizable.

- `CLINICAL_RANGES` define los rangos clínicos para vital signs.
- `EVA_RANGES` define la escala ordinal de EVA de manera separada.

Esta separación es deliberada. Los signos vitales y EVA no comparten la misma semántica clínica ni el mismo tipo de clasificación. Por lo tanto:

- los signos vitales se interpretan desde rangos clínicos compartidos;
- EVA mantiene su propia semántica ordinal;
- la UI no debe redefinir umbrales, niveles ni etiquetas por fuera de estas fuentes.

### B. Separación de capas

Se formaliza la separación entre dominio y UI para toda lógica clínica asociada a visualización.

- el dominio define rangos clínicos;
- la UI no contiene lógica clínica.

La UI puede decidir composición visual, layout y renderizado, pero no debe transformarse en la autoridad que decide qué valor es normal, warning, critical o equivalente ordinal. Esa responsabilidad pertenece a las capas compartidas de dominio y adaptación.

### C. Adapter obligatorio

Se adopta como decisión arquitectónica que exista un adapter obligatorio entre la semántica clínica y la semántica de charting.

Ese adapter debe transformar rangos clínicos en zonas de chart y también resolver de manera consistente:

- clamping;
- `rawValue` vs `chartValue`;
- `severity`.

La presencia de este adapter evita que cada chart vuelva a implementar reglas propias para overlays, tooltips, color semántico o tratamiento de outliers. La traducción entre significado clínico y representación visual debe ocurrir en una capa puente explícita.

### D. Modelo de datos para charts

Se define como modelo de datos para charts un enriched datum con los siguientes conceptos:

- `rawValue`;
- `chartValue`;
- `severity`;
- `zone`.

Este contrato permite que el chart reciba datos ya preparados para renderizado sin perder semántica clínica relevante. En particular:

- `rawValue` preserva el valor clínico real;
- `chartValue` representa el valor utilizable dentro del dominio visual del chart;
- `severity` expresa la clasificación clínica reutilizable;
- `zone` vincula el dato con la referencia visual correspondiente.

La meta no es detallar estructuras concretas de implementación, sino fijar la obligación arquitectónica de separar valor clínico, valor visible y clasificación semántica.

### E. Casos especiales

Se formalizan dos excepciones importantes del modelo general.

#### EVA mantiene 5 niveles

EVA mantiene cinco niveles y no debe colapsarse a tres.

La razón es que EVA representa una escala ordinal específica cuyo valor clínico y de comunicación se degrada si se fuerza una simplificación a un esquema genérico de tres niveles.

#### BloodPressure usa sistólica para clasificación

BloodPressure usa la presión sistólica como base de clasificación para esta arquitectura.

Esto no convierte esa simplificación en una regla clínica universal; simplemente formaliza el criterio vigente que debe mantenerse consistente en badges, overlays y charts hasta que exista una decisión arquitectónica distinta.

## 3. Consecuencias

### Positivas

- mayor consistencia visual entre charts, badges, fallbacks y overlays;
- mejor testabilidad de la semántica clínica al quedar concentrada en fuentes compartidas y en el adapter;
- eliminación de duplicación entre dominio, formatters y componentes de UI.

### Negativas

- mayor complejidad en el adapter, porque concentra responsabilidades de traducción clínica a charting;
- necesidad de mantener `clinical-model.md` actualizado para que la documentación de estado actual siga alineada con la decisión arquitectónica.

## 4. Alternativas consideradas

### Lógica en UI

Descartado.

Mantener lógica clínica dentro de componentes o fallbacks visuales aumenta la duplicación, dificulta testing aislado y rompe la separación entre semántica clínica y renderizado.

### Múltiples fuentes de rangos

Descartado.

Permitir que badges, charts, overlays o tooltips definan rangos por separado introduce drift semántico y hace imposible asegurar consistencia clínica a nivel de producto.

### Colapsar EVA a 3 niveles

Descartado.

Aunque simplificar EVA a un esquema de tres niveles podría acercarla a otras métricas visuales, implicaría perder información relevante de una escala ordinal que ya tiene semántica propia y que debe preservarse.

## 5. Relación con otros documentos

- `ADR-001-encounter-lifecycle-and-write-architecture.md`: este ADR complementa la dirección general de arquitectura y separación de responsabilidades, pero no modifica sus decisiones sobre lifecycle ni write flow.
- `clinical-model.md`: debe reflejar el estado actual verificable del modelo clínico reutilizado por badges, adapter y charts.
- `clinical-charts-current-state.md`: se referencia como documento de estado del subsistema de visualización clínica; mientras ese nombre no exista como archivo vigente, la referencia equivalente actual en el repositorio es `internal-clinical-charts-subsystem.md`.
- `encounters-and-clinical-evolution.md`: aporta el contexto evolutivo que explica cómo se consolidó esta separación entre dominio clínico, adapter y visualización longitudinal.

## Alcance y límites

Este ADR fija dirección arquitectónica y semántica compartida. No describe implementación detallada, no incluye código y no sustituye documentos de estado actual o de evolución histórica.
