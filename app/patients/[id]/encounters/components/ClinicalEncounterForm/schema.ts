import { z } from "zod";

import { coerceOptionalNumber } from "@/lib/clinical/coerce";
import { VITAL_SIGN_CAPTURE_RANGES } from "@/lib/clinical/vital-sign-capture-ranges";
import {
  APP_TIME_ZONE,
  composeLocalDateTimeToUtcIso,
  isDateOnly,
  isValidLocalTimeString,
} from "@/lib/date-time/date-time.utils";
import {
  ProcedureCategoryValues,
  ProcedureCodeValues,
  type ProcedureCategory,
  type ProcedureCode,
} from "@/domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "@/domain/procedures/procedure-code-category.map";

export const visitTypeSchema = z.enum([
  "initial",
  "follow-up",
  "re-assessment",
  "discharge",
]);

export const procedureItemSchema = z.object({
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
});

export function createDefaultProcedure(): {
  category: ProcedureCategory | "";
  code: ProcedureCode | "";
  bodySite?: string;
  note?: string;
} {
  return {
    category: "",
    code: "",
    bodySite: "",
    note: "",
  };
}

const optionalDateSchema = z
  .string()
  .optional()
  .refine((value) => value === undefined || isDateOnly(value), {
    message: "La fecha debe tener formato YYYY-MM-DD.",
  });

const optionalTimeSchema = z
  .string()
  .optional()
  .refine((value) => value === undefined || isValidLocalTimeString(value), {
    message: "La hora debe tener formato HH:mm.",
  });

export const clinicalEncounterBaseSchema = z.object({
  visitType: visitTypeSchema.optional(),
  actualDate: optionalDateSchema,
  actualStartTime: optionalTimeSchema,
  actualEndTime: optionalTimeSchema,
  clinicalNote: z.string().optional().transform((value) => value?.trim()),
  reasonDisplay: z.string().optional().transform((value) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  }),
  evaScore: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.evaScore.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.evaScore.max),
  ),
  bloodPressureSystolic: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max),
  ),
  bloodPressureDiastolic: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max),
  ),
  heartRate: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.heartRate.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.heartRate.max),
  ),
  respiratoryRate: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.max),
  ),
  oxygenSaturation: optionalClinicalNumber(
    z
      .number()
      .int()
      .min(VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.max),
  ),
  bodyTemperature: optionalClinicalNumber(
    z
      .number()
      .min(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.min)
      .max(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.max),
  ),
  procedures: z.array(procedureItemSchema).default([]),
});

export function optionalClinicalNumber<T extends z.ZodNumber>(schema: T) {
  return z.preprocess((value) => {
    const normalized = coerceOptionalNumber(value);
    return normalized === undefined ? undefined : normalized;
  }, z.union([schema, z.undefined()]));
}

interface EncounterIntentRules {
  requireActualDate: boolean;
  requireActualStartTime: boolean;
  requireActualEndTime: boolean;
  requireClinicalNote: boolean;
}

interface EncounterTemporalRules {
  blockFutureStart: boolean;
  blockFutureEnd: boolean;
}

const defaultTemporalRules: EncounterTemporalRules = {
  blockFutureStart: true,
  blockFutureEnd: true,
};

export function applyClinicalEncounterIntentRefinement(
  data: z.infer<typeof clinicalEncounterBaseSchema>,
  ctx: z.RefinementCtx,
  intentRules: EncounterIntentRules,
  temporalRules: EncounterTemporalRules = defaultTemporalRules,
): void {
  if (intentRules.requireActualDate && !data.actualDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualDate"],
      message: "La fecha es obligatoria.",
    });
  }

  if (intentRules.requireActualStartTime && !data.actualStartTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualStartTime"],
      message: "La hora de inicio es obligatoria.",
    });
  }

  if (intentRules.requireActualEndTime && !data.actualEndTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["actualEndTime"],
      message: "La hora de fin es obligatoria para completar.",
    });
  }

  if (intentRules.requireClinicalNote && !data.clinicalNote?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["clinicalNote"],
      message: "La nota clínica es obligatoria.",
    });
  }

  if (!data.actualDate || !data.actualStartTime) {
    return;
  }

  const now = new Date();

  try {
    const startIso = composeLocalDateTimeToUtcIso(
      data.actualDate,
      data.actualStartTime,
      APP_TIME_ZONE,
    );

    if (temporalRules.blockFutureStart && new Date(startIso).getTime() > now.getTime()) {
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

  if (!data.actualEndTime) {
    applyClinicalEncounterOptionalRules(data, ctx);
    return;
  }

  try {
    const startIso = composeLocalDateTimeToUtcIso(
      data.actualDate,
      data.actualStartTime,
      APP_TIME_ZONE,
    );
    const endIso = composeLocalDateTimeToUtcIso(
      data.actualDate,
      data.actualEndTime,
      APP_TIME_ZONE,
    );

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actualEndTime"],
        message: "La hora de fin debe ser posterior a la hora de inicio.",
      });
    }

    if (temporalRules.blockFutureEnd && new Date(endIso).getTime() > now.getTime()) {
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

  applyClinicalEncounterOptionalRules(data, ctx);
}

export function applyClinicalEncounterOptionalRules(
  data: z.infer<typeof clinicalEncounterBaseSchema>,
  ctx: z.RefinementCtx,
): void {
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
}
