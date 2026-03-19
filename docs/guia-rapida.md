# Guia Rapida - Navegacion de Documentacion

Esta guia resume como navegar la documentacion vigente del proyecto.

## Jerarquia Documental

La lectura recomendada es esta:

```text
1. .github/instructions/copilot.instructions.md
   Reglas globales de arquitectura y desarrollo

2. docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md
   Autoridad para lifecycle, write behavior transitorio,
   practitioner responsibility y canonical read

3. docs/write-phase-architecture.md
   Referencia operativa del write flow actual
```

Si dos documentos hablan del mismo tema:

- el ADR manda sobre lifecycle, canonical read y direccion del write flow
- `copilot.instructions.md` manda sobre reglas globales del repositorio
- `write-phase-architecture.md` manda sobre la operativa concreta del write flow, siempre alineada con el ADR

## Que Archivo Manda en Cada Tema

| Tema | Archivo autoridad |
|---|---|
| Reglas globales de arquitectura | `.github/instructions/copilot.instructions.md` |
| Terminologia Encounter vs Visit | `.github/instructions/copilot.instructions.md` |
| Validation architecture | `.github/instructions/copilot.instructions.md` |
| Lifecycle oficial de Encounter | `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` |
| `planned -> finished` como compatibilidad transitoria | `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` |
| Practitioner responsibility | `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` |
| Canonical read de encounter detail | `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md` |
| Write flow operativo actual | `docs/write-phase-architecture.md` |
| Responsabilidades de Server Action / repository / inverse mapper / FHIR client | `docs/write-phase-architecture.md` |
| `ActionResult` y `ActionError` en writes | `docs/write-phase-architecture.md` |

## Donde Buscar Cada Cosa

### Reglas globales

Busca en `.github/instructions/copilot.instructions.md`.

Usalo para:

- limites de capas
- reglas no negociables
- terminologia
- validacion multicapa
- reglas generales de write

### Lifecycle

Busca en `docs/adr/ADR-001-visit-lyfecicle-and-write-arquitecture.md`.

Usalo para:

- estados oficiales de `Encounter`
- transiciones aceptadas
- compatibilidad transitoria actual
- direccion futura aceptada

### Practitioner Responsibility

Busca en `docs/adr/ADR-001-visit-lyfecicle-and-write-arquitecture.md`.

Usalo para confirmar que:

- el practitioner se resuelve en Server Action
- el write input debe cargar `performerId` y `practitionerName`
- los inverse mappers no leen identidad desde config

### Write Flow

Busca en `docs/write-phase-architecture.md`.

Usalo para:

- flujo operativo actual de write
- responsabilidades por capa
- modelo implementado hoy
- deuda tecnica y comportamiento transitorio

### Canonical Read

Busca primero en `docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`.

Luego usa `docs/write-phase-architecture.md` para ver como se aplica despues de una write.

### ActionResult / ActionError

Busca en `docs/write-phase-architecture.md`.

Usalo para:

- contrato estable de Server Actions
- capas de error: `validation`, `domain`, `fhir`
- direccion futura de `details`

## Regla Practica de Lectura

Si la duda es sobre una regla global del repo, lee `copilot.instructions.md`.

Si la duda es sobre una decision de arquitectura del lifecycle o del write flow, lee el ADR.

Si la duda es sobre como implementar u operar una write hoy, lee `write-phase-architecture.md`.

## Nota Importante

El archivo ADR vigente en el repo hoy se llama:

`docs/adr/ADR-001-encounter-lifecycle-and-write-architecture.md`

Ese es el documento que debe tratarse como autoridad arquitectonica, aunque su nombre de archivo todavia conserve un typo historico.
