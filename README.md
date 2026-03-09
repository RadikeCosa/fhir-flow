# FHIR Flow

Laboratorio de aprendizaje para construir una aplicacion clinica sobre **FHIR R4** con **Next.js + TypeScript**, aplicando arquitectura limpia/hexagonal.

El foco del proyecto no es un demo rapido: es practicar una estructura realista para software de salud, con limites claros entre UI, dominio e infraestructura.

## Objetivos

- Consumir datos clinicos desde un servidor FHIR (HAPI FHIR).
- Mantener el dominio desacoplado del formato FHIR.
- Validar respuestas externas en runtime con Zod.
- Centralizar toda la comunicacion HTTP en un unico cliente.
- Construir una base mantenible y testeable.

## Stack

- Next.js (App Router, Server Components first)
- TypeScript (strict)
- Tailwind CSS v4
- Zod
- FHIR R4 (HAPI FHIR)

## Arquitectura

Flujo obligatorio de capas:

`config -> lib/fhir/fhir-client -> infrastructure (schemas + mappers + repositories) -> domain -> app (UI)`

Reglas clave:

- La UI no llama `fetch` directamente.
- La UI no consume JSON FHIR crudo.
- El dominio no depende de tipos FHIR.
- Toda llamada HTTP pasa por `lib/fhir/fhir-client.ts`.
- Todo dato FHIR se valida con Zod antes de mapear al dominio.

## Estructura del proyecto

```text
app/                    # UI (Server Components + componentes de presentacion)
config/                 # configuracion y validacion de entorno
domain/                 # modelos y contratos de repositorio (sin FHIR)
infrastructure/fhir/    # schemas, mappers, repositorios y factories FHIR
lib/fhir/               # cliente HTTP unico y utilidades de Bundle
lib/patient/            # formateadores de presentacion
docs/                   # notas de pasos/evolucion
seed-*.http             # seeds para poblar HAPI FHIR
```

## Requisitos

- Node.js 20+
- npm 10+ (o pnpm/yarn)
- Un servidor FHIR R4 corriendo (ejemplo local: HAPI FHIR en `http://localhost:8080/fhir`)

## Servidor HAPI FHIR en Docker (local)

Si estas corriendo HAPI FHIR en Docker local, este proyecto lo soporta sin cambios extra.

Ejemplo con `docker run`:

```bash
docker run --name hapi-fhir \
	-p 8080:8080 \
	-e hapi.fhir.fhir_version=R4 \
	-d hapiproject/hapi:latest
```

Con ese setup, usa esta variable:

```env
FHIR_BASE_URL=http://localhost:8080/fhir
```

Si usas otra imagen/tag o puerto, ajusta `FHIR_BASE_URL` en `.env.local`.

## Variables de entorno

Crear un archivo `.env.local` en la raiz:

```env
FHIR_BASE_URL=http://localhost:8080/fhir
CURRENT_PRACTITIONER_ID=kine-1
```

Variables requeridas:

- `FHIR_BASE_URL`: URL base del servidor FHIR.
- `CURRENT_PRACTITIONER_ID`: Practitioner usado para consultas clinicas contextualizadas.

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Scripts disponibles

```bash
npm run dev     # entorno de desarrollo
npm run build   # build de produccion
npm run start   # correr build de produccion
npm run lint    # linting con ESLint
```

## Carga de datos de ejemplo (seed)

El repo incluye archivos `.http` para poblar el servidor FHIR con pacientes, episodios, encuentros, signos vitales, EVA y procedimientos.

Archivos principales:

- `seed-bundle-unified.http`
- `seed-bundle.http`
- `seed-bundle2.http`
- `seed-bundle-eva.http`
- `seed.procedures.http`

Opciones para ejecutarlos:

- Con la extension **REST Client** de VS Code (recomendado para este repo).
- Con `curl`, enviando los mismos payloads al `FHIR_BASE_URL`.

## Rutas funcionales principales

- `/patients`: listado de pacientes.
- `/patients/[id]`: detalle del paciente (perfil, episodios, ultimo/proximo encuentro, signos vitales y EVA).
- `/patients/[id]/encounters`: historial de visitas.
- `/patients/[id]/encounters/[encounterId]`: detalle clinico por visita (vitales, EVA, procedimientos).
- `/patients/[id]/vital-signs`: serie de signos vitales (ultimos 15 o historial completo).
- `/patients/[id]/assessments`: evaluaciones EVA.

## Convenciones de desarrollo

- Preferir Server Components.
- Mantener funciones pequenas y de responsabilidad unica.
- No usar `any`.
- No ocultar errores: usar errores tipados y manejo explicito.
- Si agregas nueva lectura FHIR:
	1. Crear/ajustar schema Zod en `infrastructure/fhir/schemas`.
	2. Mapear a modelo de dominio en `infrastructure/fhir/mappers`.
	3. Exponer desde repositorio en `infrastructure/fhir/repositories`.
	4. Consumir en UI solo via contrato de dominio/factory.

## Estado del proyecto

Proyecto orientado a aprendizaje y evolucion incremental, con enfasis en practicas de arquitectura para sistemas de salud interoperables.
