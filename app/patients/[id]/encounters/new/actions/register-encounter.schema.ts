import { z } from "zod";
import {
    APP_TIME_ZONE,
    composeLocalDateTimeToUtcIso,
    isDateOnly,
    isValidLocalTimeString,
} from "../../../../../../lib/date-time/date-time.utils";
import { coerceOptionalNumber } from "../../../../../../lib/clinical/coerce";
import { VITAL_SIGN_CAPTURE_RANGES } from "../../../../../../lib/clinical/vital-sign-capture-ranges";
import {
    ProcedureCategoryValues,
    ProcedureCodeValues,
    type ProcedureCategory,
    type ProcedureCode,
} from "../../../../../../domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "../../../../../../domain/procedures/procedure-code-category.map";

export const registerEncounterSchema = z
    .object({
        completionMode: z.enum(["start", "complete"]),
        episodeOfCareId: z.string().min(1, "El episodio de cuidado es requerido"),
        visitType: z.enum(["initial", "follow-up", "re-assessment", "discharge"]),
        actualDate: z.string().refine((value) => isDateOnly(value), {
            message: "La fecha debe tener formato YYYY-MM-DD.",
        }),
        actualStartTime: z.string().refine((value) => isValidLocalTimeString(value), {
            message: "La hora de inicio debe tener formato HH:mm.",
        }),
        actualEndTime: z
            .string()
            .optional()
            .refine((value) => value === undefined || isValidLocalTimeString(value), {
                message: "La hora de fin debe tener formato HH:mm.",
            }),
        clinicalNote: z.string().optional().transform((value) => value?.trim()),
        reasonDisplay: z.string().optional().transform((value) => value?.trim()),
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
                        .refine((value) => value !== "", { message: "Seleccionar categoría" })
                        .transform((value) => value as ProcedureCategory),
                    code: z
                        .union([z.literal(""), z.enum(ProcedureCodeValues)])
                        .refine((value) => value !== "", { message: "Seleccionar procedimiento" })
                        .transform((value) => value as ProcedureCode),
                    bodySite: z.string().optional(),
                    note: z.string().optional(),
                })
            )
            .default([]),
    })
    .superRefine((data, ctx) => {
        const now = new Date();

        try {
            const startIso = composeLocalDateTimeToUtcIso(
                data.actualDate,
                data.actualStartTime,
                APP_TIME_ZONE
            );
            if (new Date(startIso).getTime() > now.getTime()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["actualStartTime"],
                    message:
                        "La visita no puede registrarse en una fecha u hora futura. Si aún no ocurrió, planificala desde Nueva visita.",
                });
            }
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["actualDate"],
                message: "No se pudo construir la fecha/hora de ejecución.",
            });
        }

        if (data.completionMode === "complete" && !data.actualEndTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["actualEndTime"],
                message: "La hora de fin es obligatoria para completar.",
            });
        }

        if (data.completionMode === "complete") {
            const clinicalNote = data.clinicalNote?.trim();
            if (!clinicalNote) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["clinicalNote"],
                    message: "La nota clínica es obligatoria para completar.",
                });
            }
        }

        if (data.actualEndTime) {
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

                if (new Date(endIso).getTime() > now.getTime()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["actualEndTime"],
                        message:
                            "La hora de fin no puede ser futura. Si la visita todavía no terminó, guardá progreso.",
                    });
                }
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["actualDate"],
                    message: "No se pudo construir la fecha/hora de ejecución.",
                });
            }
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
            hasSystolic
            && hasDiastolic
            && data.bloodPressureDiastolic !== undefined
            && data.bloodPressureSystolic !== undefined
            && data.bloodPressureDiastolic >= data.bloodPressureSystolic
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["bloodPressureDiastolic"],
                message: "La presión diastólica no puede exceder la sistólica",
            });
        }

        data.procedures.forEach((procedure, index) => {
            if (!procedure.category || !procedure.code) {
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

export type RegisterEncounterSchemaInput = z.input<typeof registerEncounterSchema>;
