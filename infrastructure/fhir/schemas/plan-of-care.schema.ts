import { z } from "zod";

/*
 * CarePlan (FHIR R4) — Plan of Care
 * Goal (FHIR R4) — Individual clinical objective
 * These two resources are always resolved together in the repository.
 */

// common building blocks ---------------------------------------------------

const codingSchema = z
    .object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

const referenceSchema = z
    .object({
        reference: z.string().optional(),
    })
    .passthrough();

const noteSchema = z
    .object({
        text: z.string().optional(),
    })
    .passthrough();

const extensionSchema = z
    .object({
        url: z.string().optional(),
        valueString: z.string().optional(),
        valueCode: z.string().optional(),
    })
    .passthrough();

// Goal --------------------------------------------------------------------

export const fhirGoalSchema = z
    .object({
        resourceType: z.literal("Goal"),
        id: z.string().min(1),
        lifecycleStatus: z.string().optional(),
        subject: referenceSchema.optional(),
        note: z.array(noteSchema).optional(),
        description: z
            .object({
                text: z.string().optional(),
                coding: z.array(codingSchema).optional(),
            })
            .passthrough()
            .optional(),
        target: z
            .array(
                z
                    .object({
                        dueDate: z.string().optional(),
                        measure: z
                            .object({
                                text: z.string().optional(),
                            })
                            .passthrough()
                            .optional(),
                    })
                    .passthrough()
            )
            .optional(),
        extension: z.array(extensionSchema).optional(),
    })
    .passthrough();

export type FhirGoal = z.infer<typeof fhirGoalSchema>;

// CarePlan ----------------------------------------------------------------

export const fhirCarePlanSchema = z
    .object({
        resourceType: z.literal("CarePlan"),
        id: z.string().min(1),
        status: z.string().optional(),
        intent: z.string().optional(),
        subject: referenceSchema.optional(),
        encounter: referenceSchema.optional(),
        author: z
            .object({
                reference: z.string().optional(),
                display: z.string().optional(),
            })
            .passthrough()
            .optional(),
        created: z.string().optional(),
        period: z
            .object({
                start: z.string().optional(),
                end: z.string().optional(),
            })
            .passthrough()
            .optional(),
        goal: z
            .array(
                z
                    .object({
                        reference: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        addresses: z
            .array(
                z
                    .object({
                        reference: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        activity: z
            .array(
                z
                    .object({
                        detail: z
                            .object({
                                status: z.string().optional(),
                                description: z.string().optional(),
                                scheduledTiming: z
                                    .object({
                                        repeat: z
                                            .object({
                                                frequency: z.number().optional(),
                                                period: z.number().optional(),
                                                periodUnit: z.string().optional(),
                                            })
                                            .passthrough()
                                            .optional(),
                                    })
                                    .passthrough()
                                    .optional(),
                            })
                            .passthrough()
                            .optional(),
                    })
                    .passthrough()
            )
            .optional(),
        note: z.array(noteSchema).optional(),
        extension: z.array(extensionSchema).optional(),
    })
    .passthrough();

export type FhirCarePlan = z.infer<typeof fhirCarePlanSchema>;
