import { z } from "zod";
import { codeableConceptSchema, referenceSchema } from "../shared.schema";

/**
 * LOINC 96779-8 — Palliative care screening [NECPAL]
 * Each component uses a local code system for indicator identification.
 */

// small reusable fragments --------------------------------------------------

const performerSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

const componentSchema = z
    .object({
        /**
         * Indicator code (e.g., surprise-question, demand-indicator, need-indicator,
         * disease-indicator) defined in a local coding system.
         */
        code: codeableConceptSchema,
        valueBoolean: z.boolean().optional(),
    })
    .passthrough();

/**
 * Zod schema for a FHIR Observation resource that carries a NECPAL palliative
 * care screening assessment.
 *
 * Only the fields needed by the mapper are validated; all other properties are
 * allowed via `.passthrough()` so that unexpected extensions or server-specific
 * fields do not cause validation failures.
 */
export const fhirNecpalObservationSchema = z
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
        /**
         * Overall NECPAL screen result: true=positive, false=negative
         */
        valueBoolean: z.boolean().optional(),
        component: z.array(componentSchema).optional(),
    })
    .passthrough();

export type FhirNecpalObservation = z.infer<
    typeof fhirNecpalObservationSchema
>;
