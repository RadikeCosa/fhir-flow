import { z } from "zod";
import { codingSchema, referenceSchema } from "./shared.schema";

/**
 * Zod schema for validating FHIR R4 Observation resources that represent
 * vital sign measurements (heart rate, respiratory rate, oxygen
 * saturation, body temperature) and blood pressure (component-based).
 *
 * This schema is an infrastructure-level contract: it validates the
 * raw FHIR Observation resources returned by the server before they are
 * passed to the mapper. It intentionally does not import or reference
 * any domain types.
 */

// alias to preserve exported name and typing
export const performerSchema = referenceSchema;

export const valueQuantitySchema = z
    .object({
        value: z.number(),
        unit: z.string().optional(),
    })
    .passthrough();

export const codeWithCodingSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
    })
    .passthrough();

// component entry used for blood pressure observations
export const componentSchema = z
    .object({
        code: z
            .object({
                coding: z.array(codingSchema).optional(),
            })
            .passthrough(),
        valueQuantity: valueQuantitySchema.optional(),
    })
    .passthrough();

/**
 * Shape 1: single-value Observation (heart rate, respiratory rate,
 * oxygen saturation, body temperature).
 */
const singleValueObservation = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string(),
        effectiveDateTime: z.string(),
        performer: z.array(performerSchema).min(1),
        code: z.object({ coding: z.array(codingSchema).optional() }).passthrough(),
        valueQuantity: valueQuantitySchema,
        // accept category but do not validate its shape strictly
        category: z.unknown().optional(),
    })
    .passthrough();

/**
 * Shape 2: component Observation (blood pressure) where the measured
 * values are contained in the `component` array instead of `valueQuantity`.
 */
const componentObservation = z
    .object({
        resourceType: z.literal("Observation"),
        id: z.string().min(1),
        status: z.string(),
        effectiveDateTime: z.string(),
        performer: z.array(performerSchema).min(1),
        code: z.object({ coding: z.array(codingSchema).optional() }).passthrough(),
        component: z.array(componentSchema).min(1),
        category: z.unknown().optional(),
    })
    .passthrough();

/**
 * Discriminated union accepting either a single-value vital sign
 * Observation or a component-based Observation (blood pressure).
 */
export const fhirVitalSignObservationSchema = z.union([
    singleValueObservation,
    componentObservation,
]);

export type FhirVitalSignObservation = z.infer<typeof fhirVitalSignObservationSchema>;
