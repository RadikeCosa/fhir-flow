"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import type { BaseSyntheticEvent } from "react";
import { z } from "zod";

import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import { formatEncounterVisitType } from "../../../../../../../lib/patient/formatters/encounter.formatters";
import {
  APP_TIME_ZONE,
  composeLocalDateTimeToUtcIso,
  formatCalendarDateInTimeZone,
  isDateOnly,
  isValidLocalTimeString,
} from "../../../../../../../lib/date-time/date-time.utils";
import { coerceOptionalNumber } from "../../../../../../../lib/clinical/coerce";
import {
  EVA_HELPER_TEXT,
  VITAL_SIGN_CAPTURE_RANGES,
} from "../../../../../../../lib/clinical/vital-sign-capture-ranges";
import {
  ProcedureCategoryValues,
  ProcedureCodeValues,
  type ProcedureCategory,
  type ProcedureCode,
} from "../../../../../../../domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "../../../../../../../domain/procedures/procedure-code-category.map";
import {
  formatProcedureCategory,
  formatProcedureCode,
} from "../../../../../../../lib/patient/formatters/procedure.formatters";
import { registerEncounterAction } from "../../actions/register-encounter.action";
import { saveEncounterProgressAction } from "../../../[encounterId]/actions/save-encounter-progress.action";
import { finalizeEncounterAction } from "../../../[encounterId]/actions/finalize-encounter.action";
import {
  buildFinalizeEncounterFormDefaultValues,
  resolveInitialActualTiming,
} from "../../../[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.defaults";
import type { InProgressEncounterFormInitialValues } from "@/lib/patient/mappers/in-progress-encounter-detail.mapper";

const registerEncounterFormSchema = z
  .object({
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
      .refine((value) => value === undefined || value === "" || isValidLocalTimeString(value), {
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
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    try {
      const startIso = composeLocalDateTimeToUtcIso(
        data.actualDate,
        data.actualStartTime,
        APP_TIME_ZONE,
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

    if (data.actualEndTime) {
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
  });

type RegisterEncounterFormInput = z.input<typeof registerEncounterFormSchema>;
type RegisterEncounterFormValues = z.output<typeof registerEncounterFormSchema>;

interface RegisterEncounterFormProps {
  patientId: string;
  episodeOfCareId: string;
  practitionerName: string;
  initialEncounterId?: string;
  initialVisitType?: "initial" | "follow-up" | "re-assessment" | "discharge";
  initialActualStartAt?: string;
  initialValues?: InProgressEncounterFormInitialValues;
}

export function resolveRegisterCompletionMode(
  submitter?: Pick<HTMLButtonElement, "dataset"> | null,
): "start" | "complete" | null {
  const completionMode = submitter?.dataset.completionMode;
  if (completionMode === "start" || completionMode === "complete") {
    return completionMode;
  }

  return null;
}

export function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();
  return normalized === "" ? undefined : normalized;
}

const getProcedureCodes = (
  category: ProcedureCategory,
): readonly ProcedureCode[] => PROCEDURE_CODES_BY_CATEGORY[category];

const isProcedureCategory = (value: string): value is ProcedureCategory =>
  ProcedureCategoryValues.includes(value as ProcedureCategory);

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

export function RegisterEncounterForm({
  patientId,
  episodeOfCareId,
  practitionerName,
  initialEncounterId,
  initialVisitType,
  initialActualStartAt,
  initialValues,
}: RegisterEncounterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [actionResult, setActionResult] = useState<ActionResult<{ encounterId: string }> | ActionResult<void> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [encounterId, setEncounterId] = useState<string | null>(
    initialEncounterId ?? null,
  );

  const initialActualTiming = useMemo(
    () => resolveInitialActualTiming(initialActualStartAt),
    [initialActualStartAt],
  );
  const baseDefaults = useMemo(
    () =>
      buildFinalizeEncounterFormDefaultValues(initialActualTiming, initialValues),
    [initialActualTiming, initialValues],
  );

  const todayDate = formatCalendarDateInTimeZone(new Date(), APP_TIME_ZONE);

  const form = useForm<
    RegisterEncounterFormInput,
    unknown,
    RegisterEncounterFormValues
  >({
    resolver: zodResolver(registerEncounterFormSchema),
    defaultValues: {
      episodeOfCareId,
      visitType: initialVisitType ?? "follow-up",
      actualDate: baseDefaults.actualDate || todayDate,
      actualStartTime: baseDefaults.actualStartTime,
      actualEndTime: baseDefaults.actualEndTime,
      clinicalNote: baseDefaults.clinicalNote,
      reasonDisplay: baseDefaults.reasonDisplay,
      evaScore: baseDefaults.evaScore,
      bloodPressureSystolic: baseDefaults.bloodPressureSystolic,
      bloodPressureDiastolic: baseDefaults.bloodPressureDiastolic,
      heartRate: baseDefaults.heartRate,
      respiratoryRate: baseDefaults.respiratoryRate,
      oxygenSaturation: baseDefaults.oxygenSaturation,
      bodyTemperature: baseDefaults.bodyTemperature,
      procedures: baseDefaults.procedures,
    },
  });

  const { control, register, handleSubmit, formState, setValue } = form;
  const { fields, append, remove } = useFieldArray<
    RegisterEncounterFormInput,
    "procedures"
  >({
    control,
    name: "procedures",
  });

  const watchProcedures = useWatch({
    control,
    name: "procedures",
    defaultValue: [],
  });

  const error = actionResult?.success === false ? actionResult.error : null;

  const onSubmit = async (
    values: RegisterEncounterFormValues,
    event?: BaseSyntheticEvent,
  ) => {
    const submitterEvent = event?.nativeEvent as SubmitEvent | undefined;
    const completionMode = resolveRegisterCompletionMode(
      submitterEvent?.submitter as HTMLButtonElement | null | undefined,
    );

    if (completionMode !== "start" && completionMode !== "complete") {
      setActionResult({
        success: false,
        error: {
          layer: "validation",
          message: "Seleccioná una acción de guardado.",
          code: "MISSING_COMPLETION_MODE",
          details: {
            formErrors: ["Seleccioná una acción de guardado."],
            fieldErrors: {},
          },
        },
      });
      return;
    }

    setIsSubmitting(true);
    setActionResult(null);

    const normalizedValues = {
      ...values,
      actualEndTime: normalizeOptionalString(values.actualEndTime),
      clinicalNote: normalizeOptionalString(values.clinicalNote),
      reasonDisplay: normalizeOptionalString(values.reasonDisplay),
      procedures: values.procedures,
    };

    try {
      if (!encounterId) {
        const result = await registerEncounterAction(patientId, {
          ...normalizedValues,
          completionMode,
          redirectToDetail: completionMode === "complete",
        });

        setActionResult(result);

        if (result.success && completionMode === "start" && result.data?.encounterId) {
          const createdEncounterId = result.data.encounterId;
          setEncounterId(createdEncounterId);
          router.replace(`${pathname}?encounterId=${createdEncounterId}`);
        }

        return;
      }

      if (completionMode === "start") {
        const result = await saveEncounterProgressAction(
          patientId,
          encounterId,
          {
            ...normalizedValues,
            actualDate: values.actualDate,
            actualStartTime: values.actualStartTime,
          },
        );

        setActionResult(result);
        return;
      }

      const result = await finalizeEncounterAction(patientId, encounterId, {
        ...normalizedValues,
        actualEndTime: normalizedValues.actualEndTime,
      });

      setActionResult(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (initialEncounterId) {
      setEncounterId(initialEncounterId);
    }
  }, [initialEncounterId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {encounterId && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted">
          Continuando visita en curso. ID: <span className="font-medium text-foreground">{encounterId}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <h3 className="text-sm font-semibold text-red-800">
            {error.layer === "validation" && "Error de validación"}
            {error.layer === "domain" && "Error de reglas clínicas"}
            {error.layer === "fhir" && "Error al guardar en el servidor"}
          </h3>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
          {error.code && (
            <p className="text-xs text-red-600 mt-1">Código: {error.code}</p>
          )}
        </div>
      )}

      <input type="hidden" {...register("episodeOfCareId")} />

      <div>
        <label htmlFor="visitType" className="block text-sm font-medium text-foreground">
          Tipo de visita
        </label>
        <select
          id="visitType"
          {...register("visitType")}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
          disabled={isSubmitting}
        >
          <option value="initial">{formatEncounterVisitType("initial")}</option>
          <option value="follow-up">{formatEncounterVisitType("follow-up")}</option>
          <option value="re-assessment">{formatEncounterVisitType("re-assessment")}</option>
          <option value="discharge">{formatEncounterVisitType("discharge")}</option>
        </select>
      </div>

      <div>
        <label htmlFor="reasonDisplay" className="block text-sm font-medium">
          Motivo de la visita
        </label>
        <input
          type="text"
          id="reasonDisplay"
          {...register("reasonDisplay")}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="actualDate" className="block text-sm font-medium text-foreground">
            Fecha
          </label>
          <input
            type="date"
            id="actualDate"
            {...register("actualDate")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualDate && (
            <p className="mt-1 text-sm text-error">{formState.errors.actualDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="actualStartTime" className="block text-sm font-medium text-foreground">
            Hora de entrada
          </label>
          <input
            type="time"
            id="actualStartTime"
            step={60}
            {...register("actualStartTime")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualStartTime && (
            <p className="mt-1 text-sm text-error">{formState.errors.actualStartTime.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="actualEndTime" className="block text-sm font-medium text-foreground">
            Hora de salida
          </label>
          <input
            type="time"
            id="actualEndTime"
            step={60}
            {...register("actualEndTime")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualEndTime && (
            <p className="mt-1 text-sm text-error">{formState.errors.actualEndTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="clinicalNote" className="block text-sm font-medium">
          Nota clínica
        </label>
        <textarea
          id="clinicalNote"
          {...register("clinicalNote")}
          rows={4}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
          disabled={isSubmitting}
        />
        {formState.errors.clinicalNote && (
          <p className="mt-1 text-sm text-error">{formState.errors.clinicalNote.message}</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        Registrado por <span className="font-medium text-foreground">{practitionerName}</span>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">Signos vitales</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="heartRate" className="block text-sm font-medium">
              Frecuencia cardíaca ({VITAL_SIGN_CAPTURE_RANGES.heartRate.unit})
            </label>
            <input
              type="number"
              id="heartRate"
              min={VITAL_SIGN_CAPTURE_RANGES.heartRate.min}
              max={VITAL_SIGN_CAPTURE_RANGES.heartRate.max}
              step={VITAL_SIGN_CAPTURE_RANGES.heartRate.step}
              {...register("heartRate")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="respiratoryRate" className="block text-sm font-medium">
              Frecuencia respiratoria ({VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.unit})
            </label>
            <input
              type="number"
              id="respiratoryRate"
              min={VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.min}
              max={VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.max}
              step={VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.step}
              {...register("respiratoryRate")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="oxygenSaturation" className="block text-sm font-medium">
              Saturación oxígeno ({VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.unit})
            </label>
            <input
              type="number"
              id="oxygenSaturation"
              min={VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.min}
              max={VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.max}
              step={VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.step}
              {...register("oxygenSaturation")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bodyTemperature" className="block text-sm font-medium">
              Temperatura corporal ({VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.unit})
            </label>
            <input
              type="number"
              id="bodyTemperature"
              min={VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.min}
              max={VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.max}
              step={VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.step}
              {...register("bodyTemperature")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium">
              Presión sistólica ({VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.unit})
            </label>
            <input
              type="number"
              id="bloodPressureSystolic"
              min={VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min}
              max={VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max}
              step={VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.step}
              {...register("bloodPressureSystolic")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="bloodPressureDiastolic" className="block text-sm font-medium">
              Presión diastólica ({VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.unit})
            </label>
            <input
              type="number"
              id="bloodPressureDiastolic"
              min={VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min}
              max={VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max}
              step={VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.step}
              {...register("bloodPressureDiastolic")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <label htmlFor="evaScore" className="block text-sm font-medium">
          EVA
        </label>
        <input
          type="number"
          id="evaScore"
          min={VITAL_SIGN_CAPTURE_RANGES.evaScore.min}
          max={VITAL_SIGN_CAPTURE_RANGES.evaScore.max}
          step={VITAL_SIGN_CAPTURE_RANGES.evaScore.step}
          {...register("evaScore")}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
        />
        <p className="text-xs text-muted mt-1">{EVA_HELPER_TEXT}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold">Procedimientos</h3>
        {fields.length === 0 && (
          <p className="text-sm text-muted">No hay procedimientos cargados.</p>
        )}

        {fields.map((field, index) => {
          const category = watchProcedures?.[index]?.category ?? field.category ?? "";
          const codes =
            category && isProcedureCategory(category)
              ? getProcedureCodes(category)
              : [];
          const categoryField = register(`procedures.${index}.category` as const);
          const codeField = register(`procedures.${index}.code` as const);

          return (
            <div key={field.id} className="space-y-2 rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Categoría</label>
                  <select
                    {...categoryField}
                    onChange={(event) => {
                      categoryField.onChange(event);
                      setValue(`procedures.${index}.code`, "", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  >
                    <option value="">Seleccionar categoría</option>
                    {ProcedureCategoryValues.map((cat) => (
                      <option key={cat} value={cat}>
                        {formatProcedureCategory(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Código</label>
                  <select
                    {...codeField}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  >
                    <option value="">Seleccionar procedimiento</option>
                    {codes.map((code) => (
                      <option key={code} value={code}>
                        {formatProcedureCode(code)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Región anatómica (opcional)</label>
                  <input
                    type="text"
                    {...register(`procedures.${index}.bodySite` as const)}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Observaciones (opcional)</label>
                  <input
                    type="text"
                    {...register(`procedures.${index}.note` as const)}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(index)}
                className="text-sm text-red-600"
              >
                Eliminar
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => append(createDefaultProcedure())}
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
        >
          Agregar procedimiento
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          data-completion-mode="start"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardado parcial"}
        </button>
        <button
          type="submit"
          data-completion-mode="complete"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Registrar"}
        </button>
      </div>

      <p className="text-xs text-muted">
        La intención clínica se define por el botón de acción seleccionado.
      </p>
    </form>
  );
}
