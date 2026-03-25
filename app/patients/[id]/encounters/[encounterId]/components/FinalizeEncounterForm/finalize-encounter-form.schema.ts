import { z } from "zod";
import {
    APP_TIME_ZONE,
    composeLocalDateTimeToUtcIso,
    isDateOnly,
    isValidLocalTimeString,
} from "../../../../../../../lib/date-time/date-time.utils";
import { coerceOptionalNumber } from "../../../../../../../lib/clinical/coerce";
import {
    VITAL_SIGN_CAPTURE_RANGES,
} from "../../../../../../../lib/clinical/vital-sign-capture-ranges";
import {
    ProcedureCategoryValues,
    ProcedureCodeValues,
    type ProcedureCategory,
    type ProcedureCode,
} from "../../../../../../../domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "../../../../../../../domain/procedures/procedure-code-category.map";

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
        actualDate: z.string().refine((value) => isDateOnly(value), {
            message: "La fecha real debe tener formato YYYY-MM-DD.",
        }),

        actualStartTime: z.string().refine((value) => isValidLocalTimeString(value), {
            message: "La hora de inicio real debe tener formato HH:mm.",
        }),

        actualEndTime: z.string().refine((value) => isValidLocalTimeString(value), {
            message: "La hora de fin real debe tener formato HH:mm.",
        }),

        clinicalNote: z
            .string()
            .transform((val) => val?.trim())
            .refine(
                (val) => Boolean(val && val.length > 0),
                {
                    message: "La nota clínica es obligatoria.",
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

        evaScore: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.evaScore.min).max(VITAL_SIGN_CAPTURE_RANGES.evaScore.max))
            .optional(),
        bloodPressureSystolic: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min).max(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max))
            .optional(),
        bloodPressureDiastolic: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min).max(VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max))
            .optional(),
        heartRate: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.heartRate.min).max(VITAL_SIGN_CAPTURE_RANGES.heartRate.max))
            .optional(),
        respiratoryRate: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.min).max(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.max))
            .optional(),
        oxygenSaturation: z
            .preprocess(coerceOptionalNumber, z.number().int().min(VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.min).max(VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.max))
            .optional(),
        bodyTemperature: z
            .preprocess(coerceOptionalNumber, z.number().min(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.min).max(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.max))
            .optional(),

        procedures: z
            .array(
                z.object({
                    category: z
                        .union([z.literal(""), z.enum(ProcedureCategoryValues)])
                        .refine((value) => value !== "", {
                            message: "Seleccionar categoría",
                        })
                        .transform((value) => value as ProcedureCategory),
                    code: z
                        .union([z.literal(""), z.enum(ProcedureCodeValues)])
                        .refine((value) => value !== "", {
                            message: "Seleccionar procedimiento",
                        })
                        .transform((value) => value as ProcedureCode),
                    bodySite: z.string().optional(),
                    note: z.string().optional(),
                })
            )
            .default([]),
    })
    .superRefine((data, ctx) => {
        try {
            const startIso = composeLocalDateTimeToUtcIso(
                data.actualDate,
                data.actualStartTime,
                APP_TIME_ZONE
            );
            const endIso = composeLocalDateTimeToUtcIso(
                data.actualDate,
                data.actualEndTime,
                APP_TIME_ZONE
            );

            if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["actualEndTime"],
                    message: "La hora de fin debe ser posterior a la hora de inicio.",
                });
            }
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["actualDate"],
                message: "No se pudo construir la fecha/hora real de ejecución.",
            });
        }

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

        if (
            hasSystolic &&
            hasDiastolic &&
            data.bloodPressureDiastolic !== undefined &&
            data.bloodPressureSystolic !== undefined &&
            data.bloodPressureDiastolic >= data.bloodPressureSystolic
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["bloodPressureDiastolic"],
                message:
                    "La presión diastólica no puede exceder la sistólica",
            });
        }

        data.procedures.forEach((procedure, index) => {
            if (!procedure.category) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["procedures", index, "category"],
                    message: "Seleccionar categoría",
                });
                return;
            }

            if (!procedure.code) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["procedures", index, "code"],
                    message: "Seleccionar procedimiento",
                });
                return;
            }

            const allowedCodes = PROCEDURE_CODES_BY_CATEGORY[procedure.category];

            if (!allowedCodes?.includes(procedure.code)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["procedures", index, "code"],
                    message: "El código del procedimiento no coincide con la categoría seleccionada.",
                });
            }
        });
    });

export type FinalizeEncounterFormInput = z.input<typeof finalizeEncounterFormSchema>;
export type FinalizeEncounterFormValues = z.infer<typeof finalizeEncounterFormSchema>;
