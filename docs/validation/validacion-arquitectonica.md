# Validación Arquitectónica Vigente (estado real)

Este documento describe el estado real del sistema en relación a la arquitectura definida en los documentos de autoridad. No introduce nuevas reglas.

## Rol del documento

Este documento ofrece una validación honesta del estado real de la arquitectura: distingue lo válido hoy, lo transicional y la deuda conocida sin presentar el estado actual como cierre definitivo.

Fecha: 2026-03-31

Este documento reemplaza el enfoque de "aprobado total" por una validación honesta del estado actual.

## Autoridad utilizada

- `.github/instructions/copilot.instructions.md`
- `docs/write-phase-architecture.md`
- `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` (archivo ADR vigente en el repositorio)

## Convenciones de estado

- **Válido hoy**: implementado y alineado con arquitectura.
- **Parcialmente válido**: dirección correcta, implementación incompleta o con transición activa.
- **Deuda conocida**: brecha reconocida entre modelo objetivo y comportamiento actual.
- **Pendiente ADR / tickets siguientes**: decisión ya definida por ADR pero aún no operativa.

## Matriz de validación vigente

| Tema | Estado | Diagnóstico actual | Evidencia de autoridad | Acción siguiente |
|---|---|---|---|---|
| Hexagonal boundaries | **Válido hoy** | El dominio no debe depender de FHIR; FHIR permanece fuera del boundary de dominio. | Reglas no negociables en copilot instructions + write flow oficial. | Mantener enforcement en revisiones y tests de arquitectura. |
| Validation layers | **Parcialmente válido** | La separación por capas está bien definida (Form Zod, Domain Rules, Inverse Mapper, FHIR Client), pero requiere enforcement sostenido en implementación. | Secciones de Validation Architecture en ambos docs base. | Mantener checklist por PR y evitar mover reglas clínicas a schema/mapper. |
| ActionResult / ActionError | **Parcialmente válido** | `ActionResult` es contrato estable en Server Actions; `ActionError.details` sigue transicional (`unknown`). | ADR + write-phase definen estabilidad de `layer/message/code` y evolución de `details`. | Ticket de tipado por capa (`validation/domain/fhir`) sin romper contrato estable. |
| Inverse mapper purity | **Parcialmente válido** | Regla arquitectónica es clara: mapper puro, sin resolver identidad ni reglas de negocio. Persisten riesgos de drift cuando la resolución de contexto no entra por input. | copilot instructions + ADR (responsabilidad de practitioner en Server Action). | Verificar por flujo que mapper solo transforme input validado y no lea config. |
| Practitioner resolution | **Parcialmente válido** | El ADR fija que la resolución de practitioner es server-side y luego via write input. La dirección está cerrada, la implementación requiere consistencia completa entre create/finalize. | ADR sección de practitioner responsibility + write-phase. | Completar uniformidad de input (`performerId`, `practitionerName`) en todos los writes. |
| Register flow (`/encounters/register`) | **Válido hoy** | La separación de entry points está operativa: `/encounters/new` planifica y `/encounters/register` registra con `registerEncounterAction` y `completionMode` explícito (`start`/`complete`). | Estado de app layer + write-phase actualizado. | Mantener consistencia documental y evitar regresión semántica entre rutas. |
| Save progress separado | **Válido hoy** | `saveEncounterProgressAction` existe como operación propia con snapshot transaccional y ownership metadata interoperable para recursos clínicos gestionados por esta app. | write-phase + código de acciones/rules/repositorio. | Mantener hardening de validaciones por estado y ownership. |
| Lifecycle transition (`planned -> in-progress`) | **Válido hoy** | `startEncounterAction` ya está operativo para encounters planificados y la finalización exige `in-progress`. | Reglas de estado en actions/domain + write-phase actualizado. | Mantener hardening de regresiones y tests de estado. |
| Canonical read (finished detail) | **Parcialmente válido** | El path específico `finished encounter detail` se preserva y sigue válido hoy; el hardening completo de canonical read de `finished` a nivel global permanece abierto. | ADR + write-phase + backlog vigente + validación encounter-centric acotada del sprint 2026-03. | Mantener el path preservado y cerrar hardening completo por estado/surfaces antes de marcar deuda totalmente resuelta. |
| Encounter-centric vs longitudinal read split | **Parcialmente válido** | Se consolidó la separación: patient/encounter detail operan encounter-centric y el fallback por fecha queda encapsulado para longitudinal. Aún hay deuda en hardening de límites para evitar regresiones de mezcla. | Checkpoint app + auditoría temporal + ajustes recientes en `encounters/data.ts` y patient detail. | Mantener tests de no-filtración del fallback temporal a surfaces encounter-centric. |
| Clinical linkage (`encounterId`) in read mappers | **Parcialmente válido** | Vital signs y EVA ya hidratan `encounterId` cuando `Observation.encounter.reference` existe (incluyendo casos ausente/relativo/absoluto). Mejora coherencia encounter-centric pero no elimina deuda histórica sin referencia. | Mappers/schemas de lectura y tests endurecidos recientes. | Mantener fallback longitudinal controlado para históricos sin linkage y evaluar backfill futuro. |
| In-progress encounter-centric read | **Parcialmente válido** | Hay evidencia más fuerte de no-mezcla y continuidad básica `write -> read -> render` en surfaces encounter-centric activas, incluyendo tests de integración livianos; aun así, la continuidad clínica completa en UI `in-progress` sigue abierta. | Loader patient detail + loader/render encounter detail + sprint de validación E2E encounter-centric (2 tests de integración + validación manual). | Mantener explícito que no existe aún persistencia parcial operativa en la UI de completar visita ni cierre total de continuidad `in-progress`. |
| Documentation drift | **Parcialmente válido** | Documentación alinea dirección, pero hubo deriva de tono (“todo aprobado”) y riesgo de leer transición como estado final. | Diferencia entre validación previa y lenguaje explícito de ADR/write-phase. | Mantener este documento como checklist vivo y actualizar por fase/ticket real. |

## Revisión explícita por tema solicitado

### 1. Hexagonal boundaries

**Estado:** Válido hoy

El principio se mantiene: el dominio no debe importar tipos/recursos FHIR y la traducción a FHIR pertenece al borde de infraestructura (mappers + client). Esto sigue siendo correcto y vigente.

### 2. Validation layers

**Estado:** Parcialmente válido

La arquitectura de validación está correctamente estratificada y definida. Lo pendiente no es de diseño, sino de disciplina de implementación: evitar overlap (por ejemplo, reglas clínicas en schema o mapper) y sostener validaciones en la secuencia obligatoria de Server Action.

### 3. ActionResult / ActionError

**Estado:** Parcialmente válido

`ActionResult` permanece como contrato estable de Server Action. `ActionError` tiene capa y mensaje utilizables hoy, pero `details` sigue en transición y no debe presentarse como modelo tipado final.

### 4. Inverse mapper purity

**Estado:** Parcialmente válido

La pureza del inverse mapper está definida como regla no negociable. La deuda aparece cuando el contexto requerido por mapeo no entra de forma explícita por write input en todos los flujos.

### 5. Practitioner resolution

**Estado:** Parcialmente válido

La responsabilidad quedó correctamente asignada por ADR: resolver practitioner en Server Action y pasar contexto al repositorio/mapper por input. La consistencia total entre flujos aún es trabajo en curso.

### 6. Register flow separado (`/encounters/register`)

**Estado:** Válido hoy

La separación de entry points está implementada: `/encounters/new` planifica y `/encounters/register` registra visita. El register flow usa `registerEncounterAction` con `completionMode` explícito (`start`/`complete`) y validación server-side de EpisodeOfCare.

### 6.1 Save progress separado

**Estado:** Válido hoy

`saveEncounterProgressAction` existe como operación separada para encuentros en `in-progress`, con persistencia transaccional de snapshot clínico y metadata de ownership para interoperabilidad de recursos gestionados por esta app.

### 7. Lifecycle transition en encounters planificados

**Estado:** Válido hoy

`startEncounterAction` ya habilita transición explícita `planned -> in-progress` y `finalizeEncounterAction` exige `in-progress`. La creación directa por register en `finished` permanece como modo de creación, no como transición de un encounter ya planificado.

### 8. Canonical read de finished detail

**Estado:** Parcialmente válido

El path `finished encounter detail` se mantiene preservado y válido hoy en alcance acotado, con continuidad encounter-centric verificada sin reapertura de ese recorrido específico.
Aun así, el hardening completo de canonical read de `finished` (global, por estado/surfaces) sigue abierto y debe mantenerse explícito como deuda.

### 9. Documentation drift

**Estado:** Parcialmente válido

La base documental principal (copilot instructions + write-phase + ADR) está alineada en dirección. El drift estuvo en validaciones con lenguaje excesivamente concluyente para temas que siguen transicionales o con deuda.

### 10. Encounter-centric vs longitudinal (estado actual)

**Estado:** Parcialmente válido

Las superficies `patient detail` y `encounter detail` se sostienen como encounter-centric.
El fallback por fecha permanece como estrategia longitudinal y no debe reutilizarse como source-of-truth encounter-centric.

### 11. Linkage clínico en lectura (`encounterId`)

**Estado:** Parcialmente válido

La lectura de vitales y EVA ya conserva `encounterId` cuando FHIR trae `Observation.encounter.reference` (incluyendo referencias ausentes, relativas y absolutas en tests). Esto mejora consistencia del read model encounter-centric, pero no resuelve automáticamente históricos sin vínculo explícito.

### 12. Soporte `in-progress` en lectura encounter-centric

**Estado:** Parcialmente válido

`patient detail` ya no mezcla encounter mostrado con datasets de otro encounter y `encounter detail` mantiene hidratación por `encounterId`.
El sprint de validación E2E encounter-centric agregó evidencia reproducible mínima (2 tests de integración livianos) y validación manual satisfactoria de continuidad básica y no-mezcla.

Límite explícito: en la UI de completar visita, si el usuario vuelve, pierde datos cargados en sesión; no hay persistencia parcial operativa en esa UI. Por eso, la continuidad clínica completa de `in-progress` permanece como deuda abierta.

## Pendientes del ADR / tickets siguientes

1. Completar canonical read de `finished` por estado y cerrar la deuda de forma verificable.
2. Tipar `ActionError.details` por variante/capa sin romper `ActionResult`.
3. Cerrar consistencia total de practitioner context en todos los write inputs.
4. Endurecer garantías de separación encounter-centric vs longitudinal para evitar regresiones de fallback temporal fuera de charts/historial.
5. Definir cierre verificable de continuidad clínica `in-progress` en UI si producto lo requiere.

## Checklist vigente para validación de cambios

Usar este checklist en cada cambio de write flow:

- [ ] El dominio no importa FHIR ni devuelve recursos FHIR.
- [ ] Server Action orquesta: Zod -> Domain Rules -> Repository -> ActionResult.
- [ ] Domain Rules Validator no hace IO ni efectos secundarios.
- [ ] Inverse mapper es puro y no resuelve practitioner desde config/sesión.
- [ ] El error devuelto distingue al menos `layer`, `message` y `code`.
- [ ] Si un flujo depende de `planned -> finished`, está marcado como transición.
- [ ] No se afirma como "resuelto" lo que ADR/write-phase aún marcan como deuda.
- [ ] Los cambios documentales reflejan estado real, no estado aspiracional.

## Veredicto vigente

La arquitectura **no está “todo aprobado”**.

El sistema tiene bases sólidas en boundaries y responsabilidades, mantiene deuda explícita en lifecycle operativo, canonical read completo de `finished` y cierre del contrato de errores tipados. La validación correcta hoy es: **base válida + transición activa + deuda reconocida + pendientes concretos del ADR**.

Nota: los últimos refactors de la capa `app/` (loaders, contratos y convención de rutas en patients/encounters) están resumidos en `docs/architecture/current/app-architecture-checkpoint-2026-03.md`.
