import { z } from "zod";

/**
 * Zod schemas used by the encounter mapper.  These schemas are intentionally
 * permissive and only cover the elements the mapper actually touches.  Any
 * extra properties are passed through so that malformed resources do not
 * cause validation failures; erroneous entries are filtered later in the
 * repository layer.
 */

// basic coding structure used in multiple locations
export const codingSchema = z
    .object({
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

// simple reference with optional display
export const referenceSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

// element used for encounter.type, reasonCode.coding, participant.type etc.
export const codeableConceptSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        // other fields such as `text`/`display` are not required by mapper
    })
    .passthrough();

export const periodSchema = z
    .object({
        start: z.string().optional(),
        end: z.string().optional(),
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
    })
    .passthrough();

export type FhirEncounter = z.infer<typeof fhirEncounterSchema>;
