"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { BaseSyntheticEvent } from "react";
import { z } from "zod";

import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import { formatEncounterVisitType } from "../../../../../../../lib/patient/formatters/encounter.formatters";
import {
  APP_TIME_ZONE,
  formatCalendarDateInTimeZone,
  isDateOnly,
  isValidLocalTimeString,
} from "../../../../../../../lib/date-time/date-time.utils";
import { registerEncounterAction } from "../../actions/register-encounter.action";

const registerEncounterFormSchema = z.object({
  episodeOfCareId: z.string().min(1, "El episodio de cuidado es requerido"),
  visitType: z.enum(["initial", "follow-up", "re-assessment", "discharge"]),
  actualDate: z.string().refine((value) => isDateOnly(value), {
    message: "La fecha real debe tener formato YYYY-MM-DD.",
  }),
  actualStartTime: z.string().refine((value) => isValidLocalTimeString(value), {
    message: "La hora de inicio real debe tener formato HH:mm.",
  }),
  actualEndTime: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim();
      return normalized === "" ? undefined : normalized;
    },
    z
      .string()
      .refine((value) => isValidLocalTimeString(value), {
        message: "La hora de fin real debe tener formato HH:mm.",
      })
      .optional(),
  ),
  clinicalNote: z
    .string()
    .optional()
    .transform((value) => {
      const normalized = value?.trim();
      return normalized === "" ? undefined : normalized;
    }),
});

type RegisterEncounterFormInput = z.input<typeof registerEncounterFormSchema>;
type RegisterEncounterFormValues = z.output<typeof registerEncounterFormSchema>;

interface RegisterEncounterFormProps {
  patientId: string;
  episodeOfCareId: string;
  practitionerName: string;
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

function formatLocalTimeInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const hour = parts.find((item) => item.type === "hour")?.value ?? "00";
  const minute = parts.find((item) => item.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

export function RegisterEncounterForm({
  patientId,
  episodeOfCareId,
  practitionerName,
}: RegisterEncounterFormProps) {
  const [actionResult, setActionResult] = useState<ActionResult<{
    encounterId: string;
  }> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date();
  const todayDate = formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
  const currentTime = formatLocalTimeInTimeZone(now, APP_TIME_ZONE);

  const form = useForm<
    RegisterEncounterFormInput,
    unknown,
    RegisterEncounterFormValues
  >({
    resolver: zodResolver(registerEncounterFormSchema),
    defaultValues: {
      episodeOfCareId,
      visitType: "follow-up",
      actualDate: todayDate,
      actualStartTime: currentTime,
      actualEndTime: "",
      clinicalNote: "",
    },
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
        },
      });
      return;
    }

    setIsSubmitting(true);
    setActionResult(null);

    const result = await registerEncounterAction(patientId, {
      ...values,
      actualEndTime: normalizeOptionalString(values.actualEndTime),
      clinicalNote: normalizeOptionalString(values.clinicalNote),
      completionMode,
      procedures: [],
    });

    setActionResult(result);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

      <input type="hidden" {...form.register("episodeOfCareId")} />

      <div>
        <label
          htmlFor="visitType"
          className="block text-sm font-medium text-foreground"
        >
          Tipo de visita
        </label>
        <select
          id="visitType"
          {...form.register("visitType")}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
          disabled={isSubmitting}
        >
          <option value="initial">{formatEncounterVisitType("initial")}</option>
          <option value="follow-up">
            {formatEncounterVisitType("follow-up")}
          </option>
          <option value="re-assessment">
            {formatEncounterVisitType("re-assessment")}
          </option>
          <option value="discharge">
            {formatEncounterVisitType("discharge")}
          </option>
        </select>
        {form.formState.errors.visitType && (
          <p className="mt-1 text-sm text-error">
            {form.formState.errors.visitType.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="actualDate"
            className="block text-sm font-medium text-foreground"
          >
            Fecha real
          </label>
          <input
            type="date"
            id="actualDate"
            {...form.register("actualDate")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          />
          {form.formState.errors.actualDate && (
            <p className="mt-1 text-sm text-error">
              {form.formState.errors.actualDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="actualStartTime"
            className="block text-sm font-medium text-foreground"
          >
            Hora real de inicio
          </label>
          <input
            type="time"
            id="actualStartTime"
            step={60}
            {...form.register("actualStartTime")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          />
          {form.formState.errors.actualStartTime && (
            <p className="mt-1 text-sm text-error">
              {form.formState.errors.actualStartTime.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="actualEndTime"
            className="block text-sm font-medium text-foreground"
          >
            Hora real de fin
          </label>
          <input
            type="time"
            id="actualEndTime"
            step={60}
            {...form.register("actualEndTime")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          />
          {form.formState.errors.actualEndTime && (
            <p className="mt-1 text-sm text-error">
              {form.formState.errors.actualEndTime.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="clinicalNote"
          className="block text-sm font-medium text-foreground"
        >
          Nota clínica
        </label>
        <textarea
          id="clinicalNote"
          {...form.register("clinicalNote")}
          rows={4}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
          disabled={isSubmitting}
        />
        {form.formState.errors.clinicalNote && (
          <p className="mt-1 text-sm text-error">
            {form.formState.errors.clinicalNote.message}
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
        <p className="font-medium text-foreground">Profesional</p>
        <p>{practitionerName}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          data-completion-mode="start"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          Iniciar visita
        </button>
        <button
          type="submit"
          data-completion-mode="complete"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
        >
          Finalizar directamente
        </button>
      </div>

      <p className="text-xs text-muted">Elegí cómo querés registrar la visita.</p>
    </form>
  );
}
