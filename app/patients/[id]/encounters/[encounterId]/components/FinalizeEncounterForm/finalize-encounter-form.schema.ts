import { z } from "zod";
import {
    ProcedureCategoryValues,
    ProcedureCodeValues,
} from "@/domain/procedures/procedure";

/**
 * Schema for the finalize encounter form.
 *
 * `ProcedureCategoryValues` and `ProcedureCodeValues` are runtime constants
 * derived from the domain union types in `domain/procedures/procedure.ts`.
 * This avoids duplicating literal values in the schema while keeping a
 * single source of truth for allowed values.
 */
export const finalizeEncounterFormSchema = z
    .object({
        periodEnd: z
            .date()
            .superRefine((value, ctx) => {
                if (!(value instanceof Date)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "La fecha de fin no es un valor de fecha válido.",
                    });
                    return;
                }

                if (Number.isNaN(value.getTime())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "La fecha de fin no es una fecha válida.",
                    });
                }
            }),

        clinicalNote: z
            .string()
            .optional()
            .transform((val) => val?.trim())
            .refine(
                (val) => val === undefined || val.length > 0,
                {
                    message: "La nota clínica no puede quedar en blanco si se ingresa.",
                }
            ),

        reasonDisplay: z
            .string()
            .optional()
            .transform((val) => val?.trim())
            .refine(
                (val) => val === undefined || val.length > 0,
                {
                    message:
                        "La razón de la visita no puede quedar en blanco si se ingresa.",
                }
            ),

        evaScore: z.number().int().min(0).max(10).optional(),
        bloodPressureSystolic: z.number().positive().optional(),
        bloodPressureDiastolic: z.number().positive().optional(),
        heartRate: z.number().int().positive().optional(),
        respiratoryRate: z.number().int().positive().optional(),
        oxygenSaturation: z.number().int().min(0).max(100).optional(),
        bodyTemperature: z.number().positive().optional(),

        procedures: z
            .array(
                z.object({
                    category: z.enum(ProcedureCategoryValues),
                    code: z.enum(ProcedureCodeValues),
                    bodySite: z.string().optional(),
                    note: z.string().optional(),
                })
            )
            .default([]),
    })
    .superRefine((data, ctx) => {
        const hasSystolic = data.bloodPressureSystolic !== undefined;
        const hasDiastolic = data.bloodPressureDiastolic !== undefined;

        if ((hasSystolic && !hasDiastolic) || (!hasSystolic && hasDiastolic)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["bloodPressureDiastolic"],
                message:
                    "Si se indica presión arterial, debe completarse tanto sistólica como diastólica.",
            });
        }
    });

export type FinalizeEncounterFormInput = z.input<typeof finalizeEncounterFormSchema>;
export type FinalizeEncounterFormValues = z.infer<typeof finalizeEncounterFormSchema>;

