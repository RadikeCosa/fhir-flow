"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import type { BaseSyntheticEvent } from "react";
import { z } from "zod";

import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import {
  APP_TIME_ZONE,
  formatCalendarDateInTimeZone,
  isDateOnly,
  isValidLocalTimeString,
} from "../../../../../../../lib/date-time/date-time.utils";
import { registerEncounterAction } from "../../actions/register-encounter.action";
import { saveEncounterProgressAction } from "../../../[encounterId]/actions/save-encounter-progress.action";
import { finalizeEncounterAction } from "../../../[encounterId]/actions/finalize-encounter.action";
import {
  buildFinalizeEncounterFormDefaultValues,
  resolveInitialActualTiming,
} from "../../../[encounterId]/components/FinalizeEncounterForm/finalize-encounter-form.defaults";
import type { InProgressEncounterFormInitialValues } from "@/lib/patient/mappers/in-progress-encounter-detail.mapper";
import { ClinicalEncounterForm } from "../../../components/ClinicalEncounterForm/ClinicalEncounterForm";
import {
  applyClinicalEncounterIntentRefinement,
  clinicalEncounterBaseSchema,
  createDefaultProcedure,
  visitTypeSchema,
} from "../../../components/ClinicalEncounterForm/schema";

const registerEncounterFormSchema = z
  .object({
    episodeOfCareId: z.string().min(1, "El episodio de cuidado es requerido"),
    visitType: visitTypeSchema,
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
    clinicalNote: clinicalEncounterBaseSchema.shape.clinicalNote,
    reasonDisplay: clinicalEncounterBaseSchema.shape.reasonDisplay,
    evaScore: clinicalEncounterBaseSchema.shape.evaScore,
    bloodPressureSystolic: clinicalEncounterBaseSchema.shape.bloodPressureSystolic,
    bloodPressureDiastolic: clinicalEncounterBaseSchema.shape.bloodPressureDiastolic,
    heartRate: clinicalEncounterBaseSchema.shape.heartRate,
    respiratoryRate: clinicalEncounterBaseSchema.shape.respiratoryRate,
    oxygenSaturation: clinicalEncounterBaseSchema.shape.oxygenSaturation,
    bodyTemperature: clinicalEncounterBaseSchema.shape.bodyTemperature,
    procedures: clinicalEncounterBaseSchema.shape.procedures,
  })
  .superRefine((data, ctx) => {
    applyClinicalEncounterIntentRefinement(data, ctx, {
      requireActualDate: true,
      requireActualStartTime: true,
      requireActualEndTime: false,
      requireClinicalNote: false,
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

    if (completionMode === "complete") {
      const missingEnd = !values.actualEndTime || values.actualEndTime.trim() === "";
      const missingClinicalNote = !values.clinicalNote || values.clinicalNote.trim() === "";

      if (missingEnd || missingClinicalNote) {
        setActionResult({
          success: false,
          error: {
            layer: "validation",
            message:
              "Para registrar la visita se requiere fecha, hora de inicio, hora de fin y nota clínica.",
            code: "REGISTER_REQUIRED_FIELDS_MISSING",
            details: {
              formErrors: [
                "Para registrar la visita se requiere fecha, hora de inicio, hora de fin y nota clínica.",
              ],
              fieldErrors: {},
            },
          },
        });
        return;
      }
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

      <ClinicalEncounterForm
        register={register}
        formState={formState}
        setValue={setValue}
        fields={fields}
        watchProcedures={watchProcedures}
        appendProcedure={() => append(createDefaultProcedure())}
        removeProcedure={remove}
        practitionerName={practitionerName}
        isSubmitting={isSubmitting}
        showVisitType
        actionMode="register"
      />
    </form>
  );
}
