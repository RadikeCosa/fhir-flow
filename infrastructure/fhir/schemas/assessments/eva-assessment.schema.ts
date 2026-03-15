import { z } from "zod";
import { codingSchema, codeableConceptSchema } from "../shared.schema";

// reusable fragments -------------------------------------------------------

const performerSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

/**
 * Zod schema for a FHIR Observation resource that carries an EVA assessment.
 *
 * This schema is intentionally permissive: only the fields required by the
 * mapper are validated, and all other properties are allowed via `.passthrough()`.
 */
export const fhirEvaObservationSchema = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string().optional(),
        category: z.array(
            z
                .object({
                    coding: z.array(codingSchema).optional(),
                })
                .passthrough()
        ).optional(),
        code: codeableConceptSchema.optional(),
        subject: z
            .object({ reference: z.string().optional() })
            .passthrough()
            .optional(),
        encounter: z
            .object({ reference: z.string().optional() })
            .passthrough()
            .optional(),
        performer: z.array(performerSchema).optional(),
        effectiveDateTime: z.string().optional(),
        issued: z.string().optional(),
        valueInteger: z.number().int().min(0).max(10).optional(),
    })
    .passthrough();

export type FhirEvaObservation = z.infer<
    typeof fhirEvaObservationSchema
>;
