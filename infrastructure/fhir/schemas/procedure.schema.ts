import { z } from "zod";

/**
 * Zod schemas used by the procedure mapper.  These schemas only cover the
 * elements that are actually accessed by the infrastructure mapping logic.
 * All objects are permissive (`.passthrough()`) so that unexpected fields do
 * not cause a validation failure, and non-required elements are marked
 * optional.
 */

// reuse common schemas from other modules to keep shapes consistent
import { codingSchema, referenceSchema } from "./encounter.schema";

// procedure-specific extension to coding to allow `system`
export const procedureCodingSchema = codingSchema.extend({
    system: z.string().optional(),
});

export const fhirProcedureSchema = z
    .object({
        resourceType: z.literal("Procedure"),
        id: z.string().min(1),
        status: z.string(),
        code: z
            .object({
                coding: z.array(procedureCodingSchema).optional(),
            })
            .passthrough(),
        bodySite: z
            .array(
                z
                    .object({
                        text: z.string().optional(),
                    })
                    .passthrough()
            )
            .optional(),
        performer: z
            .array(
                z
                    .object({
                        actor: referenceSchema.optional(),
                    })
                    .passthrough()
            )
            .optional(),
        encounter: referenceSchema.optional(),
        subject: referenceSchema.optional(),
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

export type FhirProcedure = z.infer<typeof fhirProcedureSchema>;
