import { z } from "zod";
import { codingSchema, codeableConceptSchema, referenceSchema } from "../shared.schema";

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
        subject: referenceSchema.optional(),
        encounter: referenceSchema.optional(),
        performer: z.array(referenceSchema).optional(),
        effectiveDateTime: z.string().optional(),
        issued: z.string().optional(),
        valueInteger: z.number().int().min(0).max(10).optional(),
    })
    .passthrough();

export type FhirEvaObservation = z.infer<
    typeof fhirEvaObservationSchema
>;
