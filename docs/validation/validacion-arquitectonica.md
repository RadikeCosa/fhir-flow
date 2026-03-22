# Validación Arquitectónica Vigente (estado real)

Este documento describe el estado real del sistema en relación a la arquitectura definida en los documentos de autoridad. No introduce nuevas reglas.

## Rol del documento

Este documento ofrece una validación honesta del estado real de la arquitectura: distingue lo válido hoy, lo transicional y la deuda conocida sin presentar el estado actual como cierre definitivo.

Fecha: 2026-03-19

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
| Transitional `planned -> finished` | **Deuda conocida** | Sigue permitido por compatibilidad transicional. No representa el lifecycle objetivo. | ADR + write-phase lo declaran explícitamente como transición. | Implementar `startEncounterAction` y migrar finalización para requerir `in-progress`. |
| Canonical read debt | **Deuda conocida** | Arquitectura define detalle de encounter como canonical read post-write, pero la hidratación final completa aún es deuda. | ADR + write-phase (Canonical Read After Write). | Priorizar ticket de detalle canónico por estado y reducir dependencia clínica en history. |
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

### 6. Transitional `planned -> finished`

**Estado:** Deuda conocida

Es compatibilidad transicional aceptada, no diseño objetivo. Debe tratarse como excepción temporal hasta habilitar transición explícita `planned -> in-progress -> finished`.

### 7. Canonical read debt

**Estado:** Deuda conocida

La intención arquitectónica está cerrada (detalle como fuente canónica para una encounter), pero su implementación aún no está completa en el estado `finished`. No debe comunicarse como cerrado.

### 8. Documentation drift

**Estado:** Parcialmente válido

La base documental principal (copilot instructions + write-phase + ADR) está alineada en dirección. El drift estuvo en validaciones con lenguaje excesivamente concluyente para temas que siguen transicionales o con deuda.

## Pendientes del ADR / tickets siguientes

1. Implementar transición operacional `planned -> in-progress` (`startEncounterAction`).
2. Endurecer finalización para requerir `in-progress` cuando el start esté operativo.
3. Completar canonical read del detalle de encounter `finished` con hidratación clínica completa.
4. Tipar `ActionError.details` por variante/capa sin romper `ActionResult`.
5. Cerrar consistencia total de practitioner context en todos los write inputs.

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

El sistema tiene bases sólidas en boundaries y responsabilidades, pero mantiene deuda explícita en lifecycle operativo, canonical read y cierre del contrato de errores tipados. La validación correcta hoy es: **base válida + transición activa + deuda reconocida + pendientes concretos del ADR**.

Nota: los últimos refactors de la capa `app/` (loaders, contratos y convención de rutas en patients/encounters) están resumidos en `docs/architecture/current/app-architecture-checkpoint-2026-03.md`.