import { z } from "zod";

/**
 * Schema for FHIR Observation resources representing EVA assessments.
 *
 * These observations are expected to carry LOINC code 72514-3 and
 * include an integer value between 0 and 10, corresponding to the
 * patient-reported EVA scale. The repository layer will validate
 * incoming FHIR resources against this schema; any resource that
 * fails validation will be silently skipped.
 */
export const fhirEvaObservationSchema = z.object({
    resourceType: z.literal("Observation"),
    id: z.string(),
    status: z.string(),
    category: z.array(
        z.object({
            coding: z.array(
                z.object({
                    system: z.string(),
                    code: z.string(),
                    display: z.string().optional(),
                })
            ),
        })
    ),
    code: z.object({
        coding: z.array(
            z.object({
                system: z.string(),
                code: z.string(),
                display: z.string().optional(),
            })
        ),
        text: z.string().optional(),
    }),
    subject: z.object({ reference: z.string() }),
    effectiveDateTime: z.string(),
    performer: z
        .array(
            z.object({
                reference: z.string(),
                display: z.string().optional(),
            })
        )
        .min(1),
    valueInteger: z.number().int().min(0).max(10),
});

export type FhirEvaObservation = z.infer<typeof fhirEvaObservationSchema>;
