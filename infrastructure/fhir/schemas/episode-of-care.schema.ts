import { z } from "zod";

/**
 * Basic building blocks reused in multiple episode-related resources.
 */

// simple coding structure with display and code
export const codingSchema = z
    .object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

// period used in various resources
export const periodSchema = z
    .object({
        start: z.string().optional(),
        end: z.string().optional(),
    })
    .passthrough();

// reference to another resource by id
export const referenceSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

/**
 * Zod schema for validating an EpisodeOfCare resource.  Only the fields the
 * mapper consumes are validated; other properties are ignored (passthrough).
 */
export const fhirEpisodeOfCareSchema = z
    .object({
        resourceType: z.literal("EpisodeOfCare"),
        id: z.string().min(1),
        identifier: z
            .array(
                z
                    .object({
                        value: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        status: z.string().optional(),
        type: z
            .array(
                z
                    .object({
                        coding: z.array(codingSchema).optional(),
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        period: periodSchema.optional(),
        diagnosis: z
            .array(
                z
                    .object({
                        condition: referenceSchema.optional(),
                    })
                    .passthrough()
            )
            .optional(),
        referralRequest: z.array(referenceSchema).optional(),
        careManager: referenceSchema.optional(),
        patient: referenceSchema.optional(),
    })
    .passthrough();

/**
 * ServiceRequest schema capturing the minimal elements used by the mapper
 * when a referral is present.  The schema is permissive and allows unknown
 * properties via `.passthrough()`.
 */
export const fhirServiceRequestSchema = z
    .object({
        resourceType: z.literal("ServiceRequest"),
        id: z.string().min(1),
        authoredOn: z.string().optional(),
        requester: referenceSchema.optional(),
        reasonCode: z
            .array(
                z
                    .object({
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        note: z
            .array(
                z
                    .object({
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

/**
 * FHIR Condition resource schema used when an episode includes a diagnosis
 * reference.  Only the elements needed by the mapper are validated.
 */
export const fhirConditionSchema = z
    .object({
        resourceType: z.literal("Condition"),
        id: z.string().min(1),
        code: z
            .object({
                coding: z.array(codingSchema).optional(),
                text: z.string().optional(),
            })
            .passthrough()
            .optional(),
        bodySite: z
            .array(
                z
                    .object({
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        severity: z
            .object({
                text: z.string().optional(),
            })
            .passthrough()
            .optional(),
        onsetDateTime: z.string().optional(),
        note: z
            .array(
                z
                    .object({
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

/**
 * Coverage resource schema.  Very permissive.
 */
export const fhirCoverageSchema = z
    .object({
        resourceType: z.literal("Coverage"),
        id: z.string().min(1),
        payor: z.array(
            z
                .object({
                    display: z.string().optional(),
                })
                .passthrough()
        ).optional(),
        class: z
            .array(
                z
                    .object({
                        name: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        subscriberId: z.string().optional(),
        period: periodSchema.optional(),
    })
    .passthrough();

/**
 * Practitioner schema used when resolving a referral practitioner.
 */
export const fhirPractitionerSchema = z
    .object({
        resourceType: z.literal("Practitioner"),
        id: z.string().min(1),
        name: z
            .array(
                z
                    .object({
                        family: z.string().optional(),
                        given: z.array(z.string()).optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

// export inferred types
export type FhirEpisodeOfCare = z.infer<typeof fhirEpisodeOfCareSchema>;
export type FhirCondition = z.infer<typeof fhirConditionSchema>;
export type FhirCoverage = z.infer<typeof fhirCoverageSchema>;
export type FhirPractitioner = z.infer<typeof fhirPractitionerSchema>;
export type FhirServiceRequest = z.infer<typeof fhirServiceRequestSchema>;
