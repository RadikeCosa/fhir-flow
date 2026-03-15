# Informe de Revisión Arquitectónica — `infrastructure/fhir/`

**Fecha:** 2026-03-15  
**Alcance:** Revisión completa de la capa de infraestructura FHIR del proyecto FHIR Flow, incluyendo factories, mappers, repositories, schemas y el cliente HTTP de soporte.  
**Archivos revisados:** 36 archivos distribuidos en 8 directorios bajo `infrastructure/fhir/`, más `lib/fhir/fhir-client.ts`.

---

## Estructura del proyecto

El diagrama siguiente muestra `infrastructure/fhir/` y su relación con las capas adyacentes:

```
fhir-flow/
├── config/
│   └── fhir.config.ts              ← Configuración (FHIR_BASE_URL, etc.)
│
├── domain/                         ← Modelos e interfaces puras (sin FHIR)
│   ├── assessments/
│   │   ├── assessment.repository.ts
│   │   ├── barthel-assessment.repository.ts
│   │   ├── necpal-assessment.repository.ts
│   │   ├── base-assessment.ts
│   │   ├── barthel-assessment.ts
│   │   ├── eva-assessment.ts
│   │   └── necpal-assessment.ts
│   ├── encounters/
│   ├── episode-of-care/
│   ├── patients/
│   ├── plan-of-care/
│   ├── procedures/
│   └── vital-sign-record/
│
├── lib/fhir/                       ← Cliente HTTP + utilidades de bundle
│   ├── fhir-client.ts              ← Único punto de acceso HTTP al servidor FHIR
│   ├── bundle-utils.ts             ← safeGetEntries / safeGetResources
│   └── systems.ts
│
└── infrastructure/
    └── fhir/                       ← Implementación concreta del dominio
        ├── factories/              ← Composition roots (9 archivos)
        │   ├── assessment.factory.ts
        │   ├── barthel-assessment.factory.ts
        │   ├── encounter.factory.ts
        │   ├── episode-of-care.factory.ts
        │   ├── necpal-assessment.factory.ts
        │   ├── patient.factory.ts
        │   ├── plan-of-care.factory.ts
        │   ├── procedure.factory.ts
        │   └── vital-sign-record.factory.ts
        │
        ├── mappers/                ← Transformación FHIR → Dominio (8 archivos)
        │   ├── assessments/
        │   │   ├── barthel-assessment.mapper.ts
        │   │   ├── eva-assessment.mapper.ts
        │   │   └── necpal-assessment.mapper.ts
        │   ├── encounter.mapper.ts
        │   ├── episode-of-care.mapper.ts
        │   ├── patient.mapper.ts
        │   ├── plan-of-care.mapper.ts
        │   ├── procedure.mapper.ts
        │   └── vital-sign.mapper.ts
        │
        ├── repositories/           ← Implementaciones concretas (9 archivos)
        │   ├── assessments/
        │   │   ├── barthel-assessment.fhir-repository.ts
        │   │   ├── eva-assessment.fhir-repository.ts
        │   │   └── necpal-assessment.fhir-repository.ts
        │   ├── encounter.fhir-repository.ts
        │   ├── episode-of-care.fhir-repository.ts
        │   ├── patient.fhir-repository.ts
        │   ├── plan-of-care.fhir-repository.ts
        │   ├── procedure.fhir-repository.ts
        │   └── vital-sign-record.fhir-repository.ts
        │
        └── schemas/                ← Validación Zod (9 archivos)
            ├── assessments/
            │   ├── barthel-assessment.schema.ts
            │   ├── eva-assessment.schema.ts
            │   └── necpal-assessment.schema.ts
            ├── encounter.schema.ts
            ├── episode-of-care.schema.ts
            ├── patient.schema.ts
            ├── plan-of-care.schema.ts
            ├── procedure.schema.ts
            └── vital-sign.schema.ts
```

**Flujo de datos por recurso:**

```
Servidor FHIR
     │
     ▼
lib/fhir/fhir-client.ts        ← única frontera HTTP
     │
     ▼
infrastructure/fhir/repositories/   ← orquesta parse + map
     │
     ├── schemas/    ← Zod safeParse (validación)
     │
     └── mappers/    ← transformación tipada
          │
          ▼
     domain/         ← modelo limpio, sin trazas FHIR
          │
          ▼
        UI / app/
```

---

## Puntos fuertes

### 1. Arquitectura limpia con separación estricta de capas — ⭐ Excelente

El proyecto implementa una **Arquitectura Hexagonal / Clean Architecture** con gran disciplina:

- `domain/` define interfaces puras (`PatientRepository`, `EncounterRepository`, etc.) sin ninguna dependencia de FHIR.
- `infrastructure/fhir/` implementa esas interfaces sin contaminar el dominio.
- Los imports siguen una sola dirección: `infrastructure → domain`, nunca al revés.
- Los tipos FHIR nunca se exponen fuera de la capa de infraestructura.

### 2. Pipeline Schema → Mapper → Repository — ⭐ Excelente

Cada recurso FHIR sigue un pipeline consistente de tres pasos:

```
FHIR JSON  →  Zod Schema (validación)  →  Mapper (transformación)  →  Domain Model
```

Esta separación genera una **frontera de confianza** clara: todo dato que cruza al dominio ha sido validado y tipado. Los errores de validación nunca llegan al dominio.

### 3. Schemas Zod permisivos (`.passthrough()`) — ⭐ Muy bueno

La decisión de hacer schemas **intencionalmente permisivos** — validando solo los campos que el mapper consume y usando `.passthrough()` para no rechazar recursos con campos extra — es correcta para interoperar con distintas implementaciones de servidores FHIR. Ejemplo en `barthel-assessment.schema.ts` y `necpal-assessment.schema.ts`.

### 4. Manejo de errores tipado en `FhirClient` — ⭐ Muy bueno

La jerarquía `FhirError → HttpError / OperationOutcomeError` en `lib/fhir/fhir-client.ts` permite que los repositorios discriminen errores con `instanceof` y actúen en consecuencia (p. ej., devolver `null` en 404 sin propagar la excepción).

### 5. Factory Pattern como Composition Root — ⭐ Bueno

Centralizar la creación de repositorios en factories permite inyectar un `FhirClient` de prueba sin frameworks de DI complejos. El patrón de parámetro opcional `client?: FhirClient` adoptado en la mayoría de las factories facilita el testing unitario.

### 6. Documentación inline exhaustiva — ⭐ Bueno

La mayoría de los archivos tienen JSDoc descriptivos que explican decisiones de diseño, trade-offs y limitaciones conocidas. Esto facilita el onboarding y la comprensión del código sin contexto externo.

### 7. Mappers defensivos — ⭐ Bueno

Los mappers verifican tipos con `typeof`, manejan arrays vacíos, valores `undefined` y nunca lanzan excepciones inesperadas. Esta defensividad es crítica cuando se trabaja con datos clínicos donde la completitud no está garantizada.

---

## Issues por prioridad

---

### 🔴 PRIORIDAD ALTA

---

#### Issue 1 — Duplicación masiva de helpers en mappers

| Campo | Detalle |
|---|---|
| **Prioridad** | 🔴 Alta |
| **Esfuerzo estimado** | Bajo |
| **Archivos afectados** | `mappers/assessments/barthel-assessment.mapper.ts`, `mappers/assessments/necpal-assessment.mapper.ts`, `mappers/assessments/eva-assessment.mapper.ts`, `mappers/encounter.mapper.ts`, `mappers/episode-of-care.mapper.ts`, `mappers/patient.mapper.ts`, `mappers/vital-sign.mapper.ts`, `mappers/plan-of-care.mapper.ts` |

**Descripción:**

Las funciones `extractId`, `extractEncounterId`, `extractPatientId`, `extractPerformer` y `extractDate` están implementadas de forma casi idéntica en 8 o más archivos de mappers. El propio código reconoce el problema con un TODO explícito en `necpal-assessment.mapper.ts`:

```typescript
// infrastructure/fhir/mappers/assessments/necpal-assessment.mapper.ts

// TODO: These helper functions are duplicated in other mappers (e.g., barthel-assessment.mapper.ts).
// Consider extracting shared mapper helpers into a common utility file.

function extractEncounterId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}

function extractPatientId(ref?: string): string {
    // idéntico al anterior, solo cambia el nombre
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}
```

**Recomendación:**

Crear `infrastructure/fhir/mappers/shared/extract-helpers.ts` con todas las funciones compartidas:

```typescript
// infrastructure/fhir/mappers/shared/extract-helpers.ts

/**
 * Extrae el id de una referencia FHIR con formato "ResourceType/id".
 * Devuelve cadena vacía si la referencia no tiene el formato esperado.
 */
export function extractId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

export const extractPatientId = extractId;
export const extractEncounterId = extractId;

export function extractPerformer(
    performer?: Array<{ reference?: string; display?: string }>
): { id: string; display: string } | undefined {
    if (!Array.isArray(performer) || performer.length === 0) return undefined;
    const first = performer[0];
    if (typeof first?.reference !== "string") return undefined;
    return {
        id: extractId(first.reference),
        display: typeof first.display === "string" ? first.display : "",
    };
}

export function extractDate(effectiveDateTime?: string, issued?: string): string {
    if (typeof effectiveDateTime === "string" && effectiveDateTime.trim() !== "") {
        return effectiveDateTime;
    }
    if (typeof issued === "string" && issued.trim() !== "") {
        return issued;
    }
    return "";
}
```

---

#### Issue 2 — Inconsistencia en strictness de schemas de assessments

| Campo | Detalle |
|---|---|
| **Prioridad** | 🔴 Alta |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `schemas/assessments/eva-assessment.schema.ts`, `schemas/assessments/barthel-assessment.schema.ts`, `schemas/assessments/necpal-assessment.schema.ts` |

**Descripción:**

`eva-assessment.schema.ts` es un schema **estricto**: no usa `.passthrough()`, y varios campos son `required` sin `.optional()`. En cambio, `barthel-assessment.schema.ts` y `necpal-assessment.schema.ts` son **permisivos** (`.passthrough()`, campos opcionales). Esto significa que EVA rechazará recursos FHIR que incluyan campos extra del servidor (extensiones, metadatos, etc.), mientras los otros dos los aceptarán sin problema.

```typescript
// ❌ EVA — schema estricto, no tolera campos extra del servidor
export const fhirEvaObservationSchema = z.object({
    resourceType: z.literal("Observation"),
    id: z.string(),
    status: z.string(),
    category: z.array(z.object({           // sin .passthrough()
        coding: z.array(z.object({
            system: z.string(),            // required
            code: z.string(),              // required
            display: z.string().optional(),
        })),
    })),
    effectiveDateTime: z.string(),         // required, sin .optional()
    performer: z.array(...).min(1),        // min(1) — fallará si performer es []
    valueInteger: z.number().int().min(0).max(10),
});

// ✅ Barthel — schema permisivo, alineado con realidad de servidores FHIR
export const fhirBarthelObservationSchema = z.object({
    // ...
    effectiveDateTime: z.string().optional(),  // opcional
    performer: z.array(...).optional(),         // opcional
    valueInteger: z.number().optional(),
}).passthrough();                               // permite campos extra
```

**Recomendación:**

Alinear `eva-assessment.schema.ts` al patrón permisivo:

```typescript
export const fhirEvaObservationSchema = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string().optional(),
        subject: z.object({ reference: z.string().optional() }).passthrough().optional(),
        effectiveDateTime: z.string().optional(),
        issued: z.string().optional(),
        performer: z.array(
            z.object({
                reference: z.string().optional(),
                display: z.string().optional(),
            }).passthrough()
        ).optional(),
        valueInteger: z.number().int().min(0).max(10).optional(),
    })
    .passthrough();
```

---

#### Issue 3 — `assessment.factory.ts` no inyecta `FhirClient`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🔴 Alta |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `factories/assessment.factory.ts` |

**Descripción:**

A diferencia de **todas** las otras factories del proyecto, `assessment.factory.ts` no acepta un `FhirClient` opcional. Esto impide inyectar un mock en tests y rompe el contrato implícito del patrón factory establecido en el resto del proyecto.

```typescript
// ❌ Actual — no permite inyección de dependencias
export function createAssessmentRepository(): AssessmentRepository {
    return new EvaAssessmentFhirRepository();
}

// ✅ Todas las demás factories — ej. patient.factory.ts
export function createPatientRepository(client?: FhirClient): PatientRepository {
    const c = client ?? new FhirClient();
    return new PatientFhirRepository(c);
}
```

**Recomendación:**

Alinear con el patrón de las demás factories:

```typescript
import { FhirClient } from "../../../lib/fhir/fhir-client";
import { EvaAssessmentFhirRepository } from "../repositories/assessments/eva-assessment.fhir-repository";
import type { AssessmentRepository } from "../../../domain/assessments/assessment.repository";

export function createAssessmentRepository(client?: FhirClient): AssessmentRepository {
    const c = client ?? new FhirClient();
    return new EvaAssessmentFhirRepository(c);
}
```

---

#### Issue 4 — Inconsistencia en manejo de errores entre repositories

| Campo | Detalle |
|---|---|
| **Prioridad** | 🔴 Alta |
| **Esfuerzo estimado** | Bajo |
| **Archivos afectados** | `repositories/patient.fhir-repository.ts`, `repositories/assessments/necpal-assessment.fhir-repository.ts`, `repositories/assessments/barthel-assessment.fhir-repository.ts`, `repositories/procedure.fhir-repository.ts` |

**Descripción:**

Existen tres estrategias de error handling distintas en los repositorios, sin criterio documentado:

| Repositorio | Estrategia |
|---|---|
| `patient.fhir-repository.ts` | Catch explícito `HttpError(404)` → `null`; re-throw todo lo demás ✅ |
| `necpal-assessment.fhir-repository.ts` | Bare `catch {}` → `throw new Error(msg)` — pierde stack trace original ❌ |
| `barthel-assessment.fhir-repository.ts` | Bare `catch {}` → `throw new Error(msg)` — pierde stack trace original ❌ |
| `procedure.fhir-repository.ts` | Sin `try/catch` — propaga excepciones raw, incluyendo errores de red ⚠️ |

```typescript
// ❌ Necpal/Barthel — pierde el error original (stack trace, causa, tipo)
} catch {
    throw new Error(
        `Failed to fetch NECPAL assessment for encounter: ${encounterId}`
    );
}

// ✅ Patient — patrón correcto: discrimina 404, re-throw el resto
} catch (err) {
    if (err instanceof HttpError && err.status === 404) {
        return null;
    }
    throw err;  // preserva el error original
}
```

**Recomendación:**

Adoptar el patrón de `PatientFhirRepository` como estándar en toda la capa. Para repositorios de assessments donde un recurso no encontrado debe devolver `null`, el patrón es:

```typescript
} catch (err) {
    if (err instanceof HttpError && err.status === 404) {
        return null;
    }
    throw err;
}
```

Importar `HttpError` de `lib/fhir/fhir-client.ts` en todos los repositorios que lo necesiten.

---

#### Issue 5 — Schemas Zod duplicados entre archivos

| Campo | Detalle |
|---|---|
| **Prioridad** | 🔴 Alta |
| **Esfuerzo estimado** | Bajo |
| **Archivos afectados** | `schemas/patient.schema.ts`, `schemas/encounter.schema.ts`, `schemas/episode-of-care.schema.ts`, `schemas/vital-sign.schema.ts`, `schemas/plan-of-care.schema.ts`, `schemas/assessments/barthel-assessment.schema.ts`, `schemas/assessments/necpal-assessment.schema.ts` |

**Descripción:**

Los building blocks `codingSchema`, `referenceSchema` y `periodSchema` están definidos de manera independiente en múltiples archivos de schemas, con ligeras variaciones entre sí. Solo `procedure.schema.ts` importa correctamente de `encounter.schema.ts`.

| Archivo | `codingSchema` incluye `system`? | `referenceSchema` existe? |
|---|---|---|
| `patient.schema.ts` | ❌ No | ❌ No |
| `encounter.schema.ts` | ❌ No | ✅ Sí |
| `episode-of-care.schema.ts` | ✅ Sí | ✅ Sí |
| `vital-sign.schema.ts` | ✅ Sí | ❌ No |
| `plan-of-care.schema.ts` | ✅ Sí | ✅ Sí |
| `barthel-assessment.schema.ts` | ✅ Sí (local) | ✅ Sí (local) |
| `necpal-assessment.schema.ts` | ✅ Sí (local) | ✅ Sí (local) |

**Recomendación:**

Crear `infrastructure/fhir/schemas/shared.schema.ts` con las definiciones canónicas:

```typescript
// infrastructure/fhir/schemas/shared.schema.ts
import { z } from "zod";

/**
 * Building blocks Zod reutilizables para schemas FHIR.
 * Todos los schemas de recursos deben importar desde aquí
 * en lugar de definir sus propios fragmentos.
 */

export const codingSchema = z
    .object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

export const codeableConceptSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

export const referenceSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

export const periodSchema = z
    .object({
        start: z.string().optional(),
        end: z.string().optional(),
    })
    .passthrough();

export const identifierSchema = z
    .object({
        system: z.string().optional(),
        value: z.string().optional(),
    })
    .passthrough();
```

---

### 🟡 PRIORIDAD MEDIA

---

#### Issue 6 — Sin logging ni observabilidad

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | Todos los repositories (patrón `safeParse`) |

**Descripción:**

Cuando `safeParse` falla, el recurso se descarta silenciosamente sin ningún aviso. En un contexto clínico, esto puede enmascarar problemas graves: un cambio en el servidor FHIR que rompa la validación pasaría completamente desapercibido hasta que alguien note datos faltantes en la UI.

```typescript
// Patrón actual — fallo silencioso
const parsed = fhirBarthelObservationSchema.safeParse(obj);
return parsed.success ? parsed.data : null;  // null desaparece sin rastro
```

**Recomendación:**

Agregar logging cuando `safeParse` falla, incluyendo el `resourceType`, el `id` del recurso y el error de Zod:

```typescript
private parseObservation(obj: unknown): FhirBarthelObservation | null {
    const parsed = fhirBarthelObservationSchema.safeParse(obj);
    if (!parsed.success) {
        // En producción, reemplazar por el logger del proyecto
        console.warn(
            "[BarthelRepository] Schema validation failed",
            {
                resourceType: (obj as Record<string, unknown>)?.resourceType,
                id: (obj as Record<string, unknown>)?.id,
                errors: parsed.error.flatten(),
            }
        );
        return null;
    }
    return parsed.data;
}
```

---

#### Issue 7 — `procedure.mapper.ts`: switch gigante con ~40+ cases hardcodeados

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Medio |
| **Archivos afectados** | `mappers/procedure.mapper.ts` |

**Descripción:**

El mapper de procedimientos contiene un bloque `switch` con aproximadamente 40 o más cases hardcodeados para mapear cada código de procedimiento a su categoría y display. Con 15KB+ de tamaño, este archivo es el más difícil de mantener del proyecto. Agregar un nuevo procedimiento requiere editar el switch manualmente y es propenso a errores.

**Recomendación:**

Refactorizar a una lookup table (diccionario):

```typescript
// infrastructure/fhir/mappers/procedure.mapper.ts

import type { ProcedureCategory, ProcedureCode } from "../../../domain/procedures/procedure";

interface ProcedureEntry {
    category: ProcedureCategory;
    code: ProcedureCode;
    display: string;
}

const PROCEDURE_CODE_MAP: Record<string, ProcedureEntry> = {
    "masoterapia": {
        category: "terapia-manual",
        code: "masoterapia",
        display: "Masoterapia",
    },
    "tens": {
        category: "electroterapia",
        code: "tens",
        display: "TENS",
    },
    // ...resto de los procedimientos
};

function mapProcedureCode(code: string): ProcedureEntry | undefined {
    return PROCEDURE_CODE_MAP[code.toLowerCase()];
}
```

Este approach reduce el archivo a una fracción de su tamaño actual, hace que agregar procedimientos sea seguro (solo agregar una entrada al mapa) y permite testing directo del mapa.

---

#### Issue 8 — Paginación incompleta

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Medio |
| **Archivos afectados** | `repositories/vital-sign-record.fhir-repository.ts`, `repositories/assessments/eva-assessment.fhir-repository.ts` |

**Descripción:**

Ambos repositorios hardcodean `_count: "100"` como límite de resultados. Si un paciente tiene más de 100 observaciones, los datos más antiguos se pierden silenciosamente. El cliente FHIR devuelve links de paginación en el Bundle (`link[rel="next"]`) que nunca se siguen.

```typescript
// repositories/vital-sign-record.fhir-repository.ts y eva-assessment.fhir-repository.ts
const bundle = await this.client.search<unknown>("Observation", {
    subject: `Patient/${patientId}`,
    _sort: "-date",
    _count: "100",  // ❌ hardcodeado, sin paginación
});
```

**Recomendación:**

Implementar un helper en `lib/fhir/bundle-utils.ts` que siga los links de paginación:

```typescript
// lib/fhir/bundle-utils.ts

/**
 * Sigue los links de paginación de un Bundle FHIR hasta obtener todos los recursos.
 * ADVERTENCIA: usar con precaución en pacientes con historiales muy largos.
 */
export async function fetchAllPages<T>(
    client: FhirClient,
    firstBundle: FhirBundle<T>
): Promise<T[]> {
    const allResources: T[] = [...safeGetResources(firstBundle)];
    let nextUrl = getNextPageUrl(firstBundle);

    while (nextUrl) {
        const nextBundle = await client.fetchByUrl<FhirBundle<T>>(nextUrl);
        allResources.push(...safeGetResources(nextBundle));
        nextUrl = getNextPageUrl(nextBundle);
    }

    return allResources;
}
```

Como alternativa inmediata de bajo riesgo, documentar la limitación con un TODO explícito que indique el número máximo real de recursos esperados para el contexto clínico.

---

#### Issue 9 — `safeGetEntries` vs `safeGetResources` sin criterio documentado

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | Todos los repositories |

**Descripción:**

Algunos repositorios usan `safeGetEntries` (devuelve `BundleEntry[]` con acceso a `entry.resource`, `entry.search`, etc.) y otros usan `safeGetResources` (devuelve directamente los recursos). No hay documentación sobre cuándo usar uno u otro.

| Repositorio | Función usada |
|---|---|
| `procedure.fhir-repository.ts` | `safeGetEntries` |
| `necpal-assessment.fhir-repository.ts` | `safeGetEntries` |
| `vital-sign-record.fhir-repository.ts` | `safeGetResources` |
| `eva-assessment.fhir-repository.ts` | `safeGetResources` |

**Recomendación:**

Documentar en `lib/fhir/bundle-utils.ts` cuándo usar cada función y, si no hay casos de uso reales para acceder a metadatos del entry (como `search.mode`), estandarizar en `safeGetResources` por ser la API más simple.

---

#### Issue 10 — Patrón ad-hoc de extracción de `patientId` en `eva-assessment.fhir-repository.ts`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `repositories/assessments/eva-assessment.fhir-repository.ts` |

**Descripción:**

El método `findEvaByEncounterId` extrae el `patientId` inline del primer recurso válido, y el propio comentario reconoce que no es estrictamente necesario:

```typescript
// repositories/assessments/eva-assessment.fhir-repository.ts

// patientId not strictly needed by mapper but required by its signature
let patientId = "";
if (valid.length > 0 && valid[0].subject?.reference) {
    const parts = valid[0].subject.reference.split("/");
    patientId = parts[parts.length - 1] || "";
}

return mapFhirObservationsToEvaAssessments(valid, patientId);
```

**Recomendación:**

Evaluar si la firma del mapper `mapFhirObservationsToEvaAssessments` debería hacer `patientId` opcional (ya que está presente en el recurso FHIR). Si el mapper puede extraerlo internamente, eliminar el parámetro de la firma para simplificar los call sites.

---

#### Issue 11 — Duplicación intra-clase en `procedure.fhir-repository.ts`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `repositories/procedure.fhir-repository.ts` |

**Descripción:**

Los métodos `findAllByEncounterId` y `findAllByPatientId` son prácticamente idénticos: mismo loop `for`, mismo `parseProcedure`, mismo `mapFhirProcedureToDomain`. Solo difieren en los parámetros de búsqueda.

```typescript
// Patrón duplicado en ambos métodos
const entries = safeGetEntries(bundle);
const results: Procedure[] = [];
for (const e of entries) {
    if (e.resource) {
        const proc = this.parseProcedure(e.resource);
        if (proc) {
            const mapped = mapFhirProcedureToDomain(proc);
            if (mapped) results.push(mapped);
        }
    }
}
return results;
```

**Recomendación:**

Extraer un método privado `searchAndMapProcedures`:

```typescript
private async searchAndMapProcedures(
    params: Record<string, string>
): Promise<Procedure[]> {
    const bundle = await this.client.search<unknown>("Procedure", params);
    const entries = safeGetEntries(bundle);
    const results: Procedure[] = [];
    for (const e of entries) {
        if (e.resource) {
            const proc = this.parseProcedure(e.resource);
            if (proc) {
                const mapped = mapFhirProcedureToDomain(proc);
                if (mapped) results.push(mapped);
            }
        }
    }
    return results;
}

public async findAllByEncounterId(encounterId: string): Promise<Procedure[]> {
    return this.searchAndMapProcedures({
        encounter: `Encounter/${encounterId}`,
        _sort: "date",
    });
}

public async findAllByPatientId(patientId: string): Promise<Procedure[]> {
    return this.searchAndMapProcedures({
        patient: patientId,
        _sort: "-date",
    });
}
```

---

#### Issue 12 — Falta barrel exports (`index.ts`) en subdirectorios

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `factories/`, `mappers/`, `repositories/`, `schemas/` |

**Descripción:**

No hay archivos `index.ts` en ninguna de las carpetas de infraestructura. Los consumidores (factories desde UI, o desde tests) deben conocer la ruta exacta de cada archivo, lo que genera acoplamiento a la estructura interna de directorios.

**Recomendación:**

Agregar barrel files, con prioridad en `factories/` ya que es la única carpeta que debería ser parte de la API pública de la capa de infraestructura:

```typescript
// infrastructure/fhir/factories/index.ts
export { createPatientRepository } from "./patient.factory";
export { createEncounterRepository } from "./encounter.factory";
export { createEpisodeOfCareRepository } from "./episode-of-care.factory";
export { createProcedureRepository } from "./procedure.factory";
export { createVitalSignRecordRepository } from "./vital-sign-record.factory";
export { createPlanOfCareRepository } from "./plan-of-care.factory";
export { createAssessmentRepository } from "./assessment.factory";
export { createBarthelAssessmentRepository } from "./barthel-assessment.factory";
export { createNecpalAssessmentRepository } from "./necpal-assessment.factory";
```

---

#### Issue 13 — No hay tests visibles para esta capa

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟡 Media |
| **Esfuerzo estimado** | Alto |
| **Archivos afectados** | Toda la capa `infrastructure/fhir/` |

**Descripción:**

No se detectaron archivos `*.test.ts` o `*.spec.ts` en el repositorio para esta capa. Las factories aceptan `FhirClient` inyectable (diseño correcto), pero aparentemente no se está aprovechando para testing automatizado.

**Recomendación:**

Priorizar tests en este orden:

1. **Mappers** — Funciones puras sin efectos secundarios. Son las más fáciles de testear y las de mayor ROI:

```typescript
// infrastructure/fhir/mappers/__tests__/patient.mapper.test.ts
import { mapFhirPatientToDomain } from "../patient.mapper";

describe("mapFhirPatientToDomain", () => {
    it("extrae nombre completo de la primera entrada HumanName", () => {
        const fhirPatient = {
            resourceType: "Patient" as const,
            id: "p-001",
            name: [{ given: ["Juan"], family: "García" }],
        };
        const result = mapFhirPatientToDomain(fhirPatient);
        expect(result.name).toBe("Juan García");
    });

    it("devuelve cadena vacía cuando name es undefined", () => {
        const result = mapFhirPatientToDomain({
            resourceType: "Patient" as const,
            id: "p-001",
        });
        expect(result.name).toBe("");
    });
});
```

2. **Schemas** — Validar que aceptan recursos válidos y rechazan recursos inválidos.

3. **Repositories** — Con `FhirClient` mockeado vía inyección en la factory.

---

### 🟢 PRIORIDAD BAJA

---

#### Issue 14 — `new FhirClient()` como default en constructores de repositorios

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟢 Baja |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | Todos los repositories (9 archivos) |

**Descripción:**

Cada repositorio define `constructor(private client: FhirClient = new FhirClient())`. Si se instancia un repositorio directamente (sin pasar por la factory), se crea una instancia independiente de `FhirClient` que no comparte configuración ni estado con las demás.

**Recomendación:**

Evaluar si conviene remover el default para **forzar** el uso a través de factories. Esto haría explícita la dependencia y evitaría instanciaciones accidentales:

```typescript
// Opción: eliminar el default del constructor
constructor(private client: FhirClient) { }
```

Las factories seguirían siendo el punto de creación, ahora obligatorio.

---

#### Issue 15 — Uso de `any` en `episode-of-care.fhir-repository.ts`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟢 Baja |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `repositories/episode-of-care.fhir-repository.ts` (línea ~80) |

**Descripción:**

El tipo `any` en el parámetro del callback bypasea la verificación de tipos de TypeScript:

```typescript
// ❌ Actual
const first = covEntries.find((e: any) => e.resource)?.resource;
```

**Recomendación:**

Reemplazar con el tipo correcto del entry de bundle, o al menos con `unknown` para forzar el narrowing:

```typescript
// ✅ Opción 1: usar el tipo del bundle (si está disponible)
const first = covEntries.find((e) => e.resource)?.resource;

// ✅ Opción 2: si se necesita tipado explícito
type BundleEntry = { resource?: unknown; search?: unknown };
const first = covEntries.find((e: BundleEntry) => e.resource)?.resource;
```

---

#### Issue 16 — JSDoc desalineado en `plan-of-care.mapper.ts`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟢 Baja |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `mappers/plan-of-care.mapper.ts` |

**Descripción:**

Un comentario JSDoc habla de lógica de fechas pero la función que documenta mapea el `status` de un CarePlan. Es un copy-paste residual:

```typescript
/**
 * Prefer the primary date; fall back to the secondary date; otherwise empty.
 */
function mapPlanStatus(status?: string): PlanOfCareStatus {
    // ↑ El comentario describe mapeo de fechas, no de status
```

**Recomendación:**

Corregir el comentario:

```typescript
/**
 * Maps a raw FHIR CarePlan status string to the domain PlanOfCareStatus type.
 * Returns "unknown" for unrecognized or missing values.
 */
function mapPlanStatus(status?: string): PlanOfCareStatus {
```

---

#### Issue 17 — IIFE innecesaria en `barthel-assessment.mapper.ts`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟢 Baja |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `mappers/assessments/barthel-assessment.mapper.ts` |

**Descripción:**

Para extraer el `patientId`, el mapper usa una IIFE (Immediately Invoked Function Expression) en lugar del helper `extractId` / `extractPatientId` disponible en el mismo archivo o en otros mappers:

```typescript
// ❌ Actual — IIFE innecesaria
const patientId = (() => {
    const ref = resource.subject?.reference;
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
})();
```

**Recomendación:**

Usar el helper directamente (una vez que se cree el archivo de helpers compartidos del Issue 1):

```typescript
// ✅ Con shared helpers
import { extractId } from "../shared/extract-helpers";

const patientId = extractId(resource.subject?.reference);
```

---

#### Issue 18 — Inconsistencia en cómo los assessment schemas definen `codingSchema`

| Campo | Detalle |
|---|---|
| **Prioridad** | 🟢 Baja |
| **Esfuerzo estimado** | Mínimo |
| **Archivos afectados** | `schemas/assessments/barthel-assessment.schema.ts`, `schemas/assessments/necpal-assessment.schema.ts`, `schemas/assessments/eva-assessment.schema.ts` |

**Descripción:**

`barthel-assessment.schema.ts` y `necpal-assessment.schema.ts` definen `codingSchema` localmente como variable nombrada. `eva-assessment.schema.ts` lo define inline directamente en el schema, sin extraer. Esta inconsistencia dentro de la misma subcarpeta refuerza la necesidad del `shared.schema.ts` del Issue 5.

**Recomendación:**

Resolver como parte del Issue 5 (crear `shared.schema.ts`). Una vez creado ese archivo, los tres schemas de assessments importarán desde el mismo lugar.

---

## Resumen ejecutivo

| Categoría | Calificación |
|---|---|
| **Arquitectura general** | ⭐⭐⭐⭐⭐ Excelente |
| **Separación de concerns** | ⭐⭐⭐⭐⭐ Excelente |
| **Type safety** | ⭐⭐⭐⭐ Muy bueno |
| **Consistencia interna** | ⭐⭐⭐ Bueno (necesita unificación) |
| **Mantenibilidad** | ⭐⭐⭐ Bueno (duplicación a resolver) |
| **Testabilidad** | ⭐⭐⭐⭐ Muy bueno (diseño apto, faltan tests) |
| **Observabilidad** | ⭐⭐ Necesita mejora |

---

## Plan de acción sugerido

### Fase 1 — Correcciones críticas (sprint 1)

1. **[Issue 3]** Fix `assessment.factory.ts` — agregar parámetro `client?: FhirClient` (cambio de 2 líneas, riesgo cero).
2. **[Issue 4]** Unificar manejo de errores en todos los repositories adoptando el patrón de `PatientFhirRepository`.
3. **[Issue 2]** Alinear `eva-assessment.schema.ts` al patrón permisivo (`.passthrough()`, campos opcionales).

### Fase 2 — Reducción de deuda técnica (sprint 2)

4. **[Issue 5]** Crear `infrastructure/fhir/schemas/shared.schema.ts` y actualizar todos los schemas para importar desde ahí.
5. **[Issue 1]** Crear `infrastructure/fhir/mappers/shared/extract-helpers.ts` y reemplazar todas las duplicaciones en mappers.
6. **[Issue 17]** Reemplazar IIFE en `barthel-assessment.mapper.ts` por el helper extraído (se resuelve naturalmente con Issue 1).
7. **[Issue 18]** Unificar definiciones inline de `codingSchema` en assessments (se resuelve con Issues 1 y 5).

### Fase 3 — Observabilidad y consistencia (sprint 3)

8. **[Issue 6]** Agregar logging en fallos de `safeParse` en todos los repositories.
9. **[Issue 9]** Documentar criterio de uso de `safeGetEntries` vs `safeGetResources` y estandarizar.
10. **[Issue 11]** Extraer método privado `searchAndMapProcedures` en `procedure.fhir-repository.ts`.
11. **[Issue 12]** Agregar barrel exports (`index.ts`) en `factories/`.
12. **[Issue 15]** Reemplazar `(e: any)` por tipo correcto en `episode-of-care.fhir-repository.ts`.
13. **[Issue 16]** Corregir JSDoc desalineado en `plan-of-care.mapper.ts`.

### Fase 4 — Mejoras estructurales (sprint 4+)

14. **[Issue 7]** Refactorizar `procedure.mapper.ts` de switch a lookup table.
15. **[Issue 8]** Implementar paginación real o documentar limitación de forma explícita.
16. **[Issue 10]** Evaluar si `patientId` debe ser opcional en la firma de `mapFhirObservationsToEvaAssessments`.
17. **[Issue 13]** Escribir tests unitarios (empezando por mappers, luego schemas, luego repositories).
18. **[Issue 14]** Evaluar si remover defaults de constructores de repositorios para forzar uso vía factory.

---

*Documento generado el 2026-03-15. Revisado por: arquitectura interna del proyecto FHIR Flow.*
