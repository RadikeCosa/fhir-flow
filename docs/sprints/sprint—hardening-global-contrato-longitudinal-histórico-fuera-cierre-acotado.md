Sprint — Hardening global del contrato longitudinal/histórico (fuera del cierre acotado)

Status: closed
Fecha: 2026-04

1. Objetivo

Endurecer el contrato longitudinal/histórico a nivel global/system-wide fuera de las surfaces ya cerradas en alcance acotado, agregando evidencia de no-regresión cross-surface y una política más explícita para composición histórica/legacy, sin reabrir los boundaries ya protegidos de encounters/data.ts en su closure local, patient detail ni encounter detail.

Este sprint no busca revalidar principios ya cerrados ni forzar cambios de código productivo si no aparecen brechas verificables fuera del closure acotado previo. Su foco es transformar el remanente global/system-wide en un frente verificable, con entrada test-first y con límites explícitos para evitar retrabajo.

2. Problema a resolver

El cierre acotado anterior ya dejó blindados los límites locales más sensibles del read model y no deben reabrirse por defecto. Lo que sigue abierto es el frente global/system-wide: cómo sostener el contrato longitudinal/histórico fuera de esos puntos ya endurecidos y testeados.

La deuda remanente se concentra en tres ejes:

contrato longitudinal/histórico global fuera de las surfaces bounded-closed;
política global para históricos/legacy sin encounterId;
evidencia de no-regresión cross-surface fuera del set ya validado.

El riesgo no es volver a discutir principios ya cerrados, sino dejar abiertos puntos donde una composición longitudinal/histórica pueda derivar en drift contractual o en asociación ambigua fuera del bounded scope ya protegido.

3. Por qué este sprint tiene sentido ahora

El repo ya tiene un cierre acotado explícito y operativo para la frontera local encounter-centric vs longitudinal en las surfaces críticas auditadas. Por eso el siguiente paso razonable no es re-ejecutar ese hardening, sino definir y blindar el remanente real a nivel global/system-wide.

Este sprint toma ese remanente y lo convierte en un frente verificable, con foco en tests primero y con exclusiones explícitas para evitar scope confusion y retrabajo.

También reconoce una salida válida sin cambios productivos: si el inventario y los tests no muestran gap verificable fuera del closure acotado, el sprint puede cerrarse con evidencia de no-regresión y alineación documental.

4. Alcance incluido

Incluye:

Matriz global de surfaces fuera del closure acotado
identificar qué surfaces/contracts longitudinales siguen abiertas fuera del bounded scope anterior;
distinguirlas explícitamente de las ya protegidas.
Tests de contrato global longitudinal/histórico
agregar regresiones cross-surface para composición longitudinal/histórica;
cubrir policy de legacy sin encounterId solo en las surfaces que hoy sigan realmente abiertas.
Ajustes mínimos condicionados por fallo
aplicar cambios solo si los tests nuevos detectan brecha real;
priorizar correcciones puntuales por contrato antes que refactor.
Evidencia de no-regresión y alineación documental
registrar con precisión qué se endureció globalmente;
dejar explícito qué sigue fuera de alcance system-wide.
5. Alcance excluido

No incluye:

reabrir T1–T5 del sprint anterior;
reabrir el closure local ya validado de app/patients/[id]/encounters/data.ts;
reabrir encounter detail canónico por encounterId;
reabrir patient detail con fuente única inProgressEncounter ?? lastFinishedEncounter;
refactor amplio de loaders ya cerrados;
rediseño general del read model;
cambios de lifecycle o write flow;
usar browser E2E global como barra mínima obligatoria de este sprint;
usar charts/formatters como source-of-truth del problema salvo regresión nueva demostrada fuera del closure previo.
6. Riesgos principales
6.1 Scope confusion

El mayor riesgo de este sprint es reabrir surfaces ya cerradas por confusión documental o por usar wording demasiado genérico. Este sprint debe operar solo sobre el remanente global fuera del bounded scope anterior.

6.2 Scope creep hacia refactor amplio

El objetivo no es rediseñar el subsistema longitudinal completo, sino endurecer el contrato global con evidencia y cambios mínimos donde haga falta.

6.3 Tests insuficientemente dirigidos

Si los tests no distinguen bien qué es global/system-wide y qué ya está bounded-closed, se puede terminar tocando código correcto o duplicando blindajes ya existentes.

6.4 Sobre-ejecutar un sprint sin gap real

Si TG1 no encuentra brechas verificables fuera del closure acotado, insistir en cambios productivos sería retrabajo. El sprint debe poder cerrarse con evidencia y documentación si ese fuera el resultado.

7. Landing zone inicial (test-first)

La entrada recomendada para este sprint es, primero, sobre tests que validen composición de lectura y consistencia cross-surface fuera del closure acotado ya cerrado:

app/patients/[id]/encounters/__tests__/data.test.ts
app/patients/[id]/__tests__/data.test.ts

Landing zone secundaria y no primaria:

lib/patient/formatters/__tests__/encounter-charts.formatters.test.ts

Este último archivo no debe tratarse como landing zone base del sprint. Solo entra si TG1/TG2 detectan una brecha verificable en composición longitudinal que ya llegue materializada a nivel de series/fechas formateadas. No es el lugar primario para validar policy global de legacy ni source-of-truth del read model.

8. Regla de no reapertura del closure local

app/patients/[id]/encounters/data.ts permanece bounded-closed en su boundary local ya validado.

Puede ser tocado solo si TG1/TG2 demuestran una regresión nueva, verificable y situada fuera del closure acotado previo.

Por lo tanto:

no se reabre por hipótesis;
no se reabre por simetría arquitectónica;
no se reabre por sospecha abstracta;
no se reabre solo porque sea un lugar “cómodo” donde tocar código.

La carga de prueba es inversa: primero debe aparecer gap verificable fuera del cierre previo; recién después puede considerarse cambio puntual.

9. Ejecución propuesta
TG1 — Matriz global de surfaces fuera del closure acotado

Inventariar exactamente qué surfaces longitudinales/históricas siguen sin blindaje global, dejando fuera explícitamente:

encounters/data.ts en su boundary local ya cerrado;
encounter detail;
patient detail source selection.
Formato mínimo obligatorio de la matriz

Cada fila debe incluir, como mínimo:

surface
tipo de contrato (encounter-centric | longitudinal/histórico)
source of truth
evidencia existente
gap verificable (sí | no)
riesgo de filtración cross-surface
acción sugerida (sin cambio | test | fix mínimo)
Resultado esperado

Lista verificable y comparable de surfaces/contratos realmente abiertos, evitando inventarios ambiguos o no comparables entre implementadores.

Cláusula de salida temprana

Si TG1 no encuentra brechas verificables fuera del closure acotado, el sprint puede cerrarse sin cambios de código productivo, dejando:

evidencia de no-regresión;
inventario explícito del alcance remanente;
alineación documental mínima.

Ese resultado también cuenta como cierre válido del sprint.

TG2 — Tests de contrato global longitudinal/histórico

Agregar pruebas de regresión cross-surface para:

composición longitudinal global;
policy de legacy sin encounterId solo en surfaces longitudinales/históricas todavía abiertas;
invariantes de no-regresión entre selector clínico encounter-centric y datasets longitudinales cuando corresponda.
Regla de foco para legacy sin encounterId

La policy de legacy sin encounterId se audita únicamente donde siga abierta como problema contractual real.

No forma parte de este sprint:

revalidar charts/formatters como autoridad del contrato global;
mover el centro del análisis a visualización;
tratar el subsistema de charts como source-of-truth del problema.

Charts/formatters solo entran si una brecha contractual ya demostrada en composición longitudinal aparece efectivamente materializada en esas capas.

Resultado esperado

Cobertura que detecte brechas reales sin reabrir T1–T5 anteriores ni arrastrar surfaces cerradas.

TG3 — Ajustes mínimos condicionados por fallo

Aplicar cambios solo donde TG2 falle.

Orden de prioridad:

tests/contracts
ampliar blindaje si el hueco era solo de evidencia;
composición longitudinal abierta
tocar la lógica puntual donde viva la brecha real, sin refactor amplio;
transformación longitudinal derivada
tocar formatters/adapters solo si el problema ya llega materializado ahí;
ensamblado de props a nivel de ruta/página
solo si la brecha no vive ni en tests/contracts ni en composición ni en transformación.
Regla explícita para encounters/data.ts

app/patients/[id]/encounters/data.ts no es “primer candidato a cambio” por defecto. Solo puede entrar en TG3 si:

existe fallo reproducible en TG2;
el fallo demuestra brecha nueva fuera del closure acotado;
esa brecha vive efectivamente en esa composición y no en otra capa.
Resultado esperado

Correcciones mínimas, justificadas por fallo previo, sin refactor amplio y sin tocar surfaces ya cerradas salvo regresión real demostrada.

TG4 — Evidencia de no-regresión + actualización documental acotada

Cerrar el sprint con:

evidencia de qué se endureció globalmente;
límites explícitos de lo que sigue fuera de alcance;
wording sincronizado en backlog/validación/sprint para evitar nuevo drift.
10. Primer movimiento recomendado
Inspección read-only inicial

Antes de escribir tests nuevos o tocar código productivo, inspeccionar:

app/patients/[id]/encounters/__tests__/data.test.ts
app/patients/[id]/__tests__/data.test.ts

Buscando específicamente:

separación ya existente entre encounter-centric vs longitudinal;
cobertura ya presente de fallback temporal;
policy ya cubierta para legacy/date fallback;
posibles puntos de leakage cross-surface aún no blindados.
Primer test a extender, solo si aparece hueco verificable

app/patients/[id]/__tests__/cross-surface.contract.test.ts con un caso puntual como:

history incluye registro legacy derived-by-date sin encounterId, mientras patient detail mantiene fuente clínica encounter-centric sin contaminación.

Tipo exacto de gap a buscar primero
leakage cross-surface;
contaminación de source selection encounter-centric por dataset longitudinal legacy;
reutilización indebida de criterio temporal fuera del dominio longitudinal.

Si eso no se reproduce, no hay gap técnico remanente verificable dentro del alcance de este sprint.

11. Criterios de aceptación

El sprint se considera cumplido si:

existe una matriz explícita de surfaces globales aún abiertas fuera del closure acotado;
se agregan tests de regresión orientados al contrato longitudinal/histórico global donde realmente siga abierto;
no se reabren surfaces bounded-closed salvo regresión demostrada por test automatizado nuevo o ajustado;
cualquier cambio de código queda justificado por fallo previo en TG2;
el sprint deja evidencia concreta de no-regresión cross-surface en el área nueva cubierta;
la documentación diferencia con claridad:
lo ya cerrado en alcance acotado;
lo endurecido ahora a nivel global;
lo que sigue abierto system-wide.
Nota de alcance

La demostración de regresión para este sprint no exige browser E2E como barra base. Loader/integration tests y, cuando corresponda de forma estrictamente secundaria, formatter-level tests, son evidencia suficiente mientras el problema auditado permanezca dentro del contrato longitudinal/histórico global y fuera de surfaces ya bounded-closed.

12. Definición de done
TG1 cerrado con surfaces abiertas verificadas y matriz mínima completa;
TG2 implementado con tests relevantes;
TG3 ejecutado solo si hizo falta;
TG4 reflejado en documentación mínima necesaria;
sin reabrir el bounded closure previo;
sin scope creep hacia refactor general del read model;
o, si TG1 no encuentra brecha verificable, cierre con evidencia de no-regresión y sin cambios de código productivo.
13. Impacto esperado

Al cerrar este sprint, el sistema debería quedar con:

mejor explicitación del contrato longitudinal/histórico fuera del closure acotado;
menor riesgo de drift cross-surface en composición histórica/legacy;
más evidencia de regresión global sin tocar boundaries ya protegidos;
mejor separación entre cierre acotado previo y hardening global posterior.

Si TG1 no detecta brecha verificable, el impacto esperado pasa a ser otro, igualmente válido:

confirmación de que no queda gap técnico real fuera del bounded scope en el área auditada;
documentación más precisa del remanente system-wide;
prevención de retrabajo por scope confusion.
14. Límites explícitos

Este sprint no declara cierre global total del read model ni de la deuda longitudinal/histórica completa.

Este sprint no invalida ni reemplaza el cierre acotado anterior.

Este sprint no reabre las reglas locales ya blindadas en encounters/data.ts, patient detail o encounter detail, salvo que un test nuevo y específico demuestre una regresión fuera de alcance hasta ahora no cubierta.

Este sprint no usa el subsistema de charts como source-of-truth del problema. Solo puede tocarlo si una brecha verificable del contrato longitudinal/histórico ya aparece materializada en transformación/formateo de series.

15. Resultado de ejecución (cierre por evidencia)

TG1 fue ejecutado en modo read-only sobre las surfaces objetivo:

- app/patients/[id]/encounters/__tests__/data.test.ts
- app/patients/[id]/__tests__/data.test.ts
- app/patients/[id]/__tests__/cross-surface.contract.test.ts

Resultado:

- no se encontró brecha técnica verificable fuera del closure acotado;
- no se justifica pasar a TG2/TG3;
- el sprint se cierra sin cambios de código productivo.

Guardrail explícito de cierre:

- app/patients/[id]/encounters/data.ts se mantiene bounded-closed en su boundary local ya validado y no se reabre en este sprint.

Nota opcional/no bloqueante:

- puede evaluarse más adelante un único caso cross-surface de legacy derived-by-date sin encounterId; no constituye gap técnico verificable actual ni condición para este cierre.
