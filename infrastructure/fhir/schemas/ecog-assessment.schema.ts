import { z } from "zod";

/**
 * ECOG Performance Status assessment represented as a FHIR Observation.
 */

// small reusable fragments --------------------------------------------------

const codingSchema = z
    .object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

const codeableConceptSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

const referenceSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

const performerSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

/**
 * Zod schema for a FHIR Observation resource that carries an ECOG
 * performance status assessment.
 *
 * Only the fields needed by the mapper are validated; all other properties are
 * allowed via `.passthrough()` so that unexpected extensions or server-specific
 * fields do not cause validation failures.
 */
export const fhirEcogObservationSchema = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string().optional(),
        subject: referenceSchema.optional(),
        encounter: referenceSchema.optional(),
        performer: z.array(performerSchema).optional(),
        effectiveDateTime: z.string().optional(),
        issued: z.string().optional(),
        code: codeableConceptSchema.optional(),
        valueInteger: z.number().int().min(0).max(4).optional(),
    })
    .passthrough();

export type FhirEcogObservation = z.infer<typeof fhirEcogObservationSchema>;
