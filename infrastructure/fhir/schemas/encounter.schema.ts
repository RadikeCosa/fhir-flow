import { z } from "zod";
import { codingSchema, referenceSchema, periodSchema } from "./shared.schema";

/**
 * Zod schemas used by the encounter mapper.  These schemas are intentionally
 * permissive and only cover the elements the mapper actually touches.  Any
 * extra properties are passed through so that malformed resources do not
 * cause validation failures; erroneous entries are filtered later in the
 * repository layer.
 */

// Shared building blocks imported from shared.schema.ts
// element used for encounter.type, reasonCode.coding, participant.type etc.
export const codeableConceptSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        // other fields such as `text`/`display` are not required by mapper
    })
    .passthrough();

export const participantSchema = z
    .object({
        type: z.array(codeableConceptSchema).optional(),
        individual: referenceSchema.optional(),
    })
    .passthrough();

export const reasonCodeSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

/**
 * Minimal FHIR Encounter resource schema.  Only fields consumed by the
 * mapper are validated; the rest of the resource is allowed via `.passthrough()`.
 */
export const fhirEncounterSchema = z
    .object({
        resourceType: z.literal("Encounter"),
        id: z.string().min(1),
        status: z.string(),
        type: z.array(codeableConceptSchema).optional(),
        period: periodSchema.optional(),
        episodeOfCare: z
            .array(
                z
                    .object({
                        reference: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        subject: referenceSchema.optional(),
        participant: z.array(participantSchema).optional(),
        reasonCode: z.array(reasonCodeSchema).optional(),
        extension: z
            .array(
                z
                    .object({
                        url: z.string().optional(),
                        valueString: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

export type FhirEncounter = z.infer<typeof fhirEncounterSchema>;
