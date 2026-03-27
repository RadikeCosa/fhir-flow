import { z } from "zod";
import { codeableConceptSchema } from "../shared.schema";

// main observation schema ------------------------------------------------

/**
 * Zod schema for a FHIR Observation resource that carries a Barthel index
 * assessment.  Only the fields consumed by the mapper are checked; all other
 * properties are allowed via `.passthrough()` so that unexpected extensions
 * or server-specific fields do not cause validation failures.
 */
export const fhirBarthelObservationSchema = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string().optional(),
        subject: z
            .object({ reference: z.string().optional() })
            .passthrough()
            .optional(),
        encounter: z
            .object({ reference: z.string().optional() })
            .passthrough()
            .optional(),
        performer: z
            .array(
                z
                    .object({
                        reference: z.string().optional(),
                        display: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        effectiveDateTime: z.string().optional(),
        issued: z.string().optional(),
        code: codeableConceptSchema.optional(),
        valueInteger: z.number().optional(),
        component: z
            .array(
                z
                    .object({
                        code: codeableConceptSchema,
                        valueInteger: z.number().optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

// inferred type export
export type FhirBarthelObservation = z.infer<
    typeof fhirBarthelObservationSchema
>;
