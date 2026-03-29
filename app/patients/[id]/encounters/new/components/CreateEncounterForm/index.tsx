"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { CalendarPlus, User } from "lucide-react";
import type { CreateEncounterFormInput } from "./create-encounter-form.schema";
import type { CreateEncounterFormValues } from "./create-encounter-form.schema";
import { createEncounterFormSchema } from "./create-encounter-form.schema";
import { createEncounterAction } from "../../actions/create-encounter.action";
import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import { formatEncounterVisitType } from "../../../../../../../lib/patient/formatters/encounter.formatters";
import {
  APP_TIME_ZONE,
  formatCalendarDateInTimeZone,
} from "@/lib/date-time/date-time.utils";

/**
 * Props for the CreateEncounterForm component.
 *
 * @param patientId       - The patient resource ID (from URL params)
 * @param episodeOfCareId - The episode of care resource ID (passed from parent)
 */
interface CreateEncounterFormProps {
  patientId: string;
  episodeOfCareId: string;
  practitionerName: string;
}

/**
 * Client Component: Form for creating a new planned Encounter.
 *
 * Handles:
 * - Form state management via React Hook Form + Zod
 * - Layer 1 validation (Zod schema)
 * - Submission to Server Action (createEncounterAction)
 * - Error display by layer (validation, domain, fhir)
 * - Loading states and disabled inputs
 *
 * On successful submission, createEncounterAction calls redirect(),
 * which throws internally, so the browser navigates before this component
 * can update its state. The error handling ensures failed submissions
 * are visible to the user without disrupting the UI.
 */
export function CreateEncounterForm({
  patientId,
  episodeOfCareId,
  practitionerName,
}: CreateEncounterFormProps) {
  /**
   * Server action result (Layer 2 domain rules or Layer 3 FHIR errors).
   * Zod validation errors are handled by form.formState.errors.
   */
  const [actionResult, setActionResult] = useState<ActionResult<{
    encounterId: string;
  }> | null>(null);

  /**
   * Tracks if the form is submitting to the server.
   * Disables inputs and changes button label while pending.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * React Hook Form integration with Zod schema.
   *
   * zodResolver performs Zod schema validation on change/blur/submit.
   * Errors automatically populate form.formState.errors.
   *
   * defaultValues:
   * - plannedDate: Today's date in app timezone
   * - plannedTime: Empty string (optional)
   * - note: Empty string (optional field)
   */
  const now = new Date();
  const todayDate = formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
  const maxDate = new Date(now.getTime());
  maxDate.setDate(maxDate.getDate() + 10);
  const maxDateValue = formatCalendarDateInTimeZone(maxDate, APP_TIME_ZONE);

  const form = useForm<
    CreateEncounterFormInput,
    unknown,
    CreateEncounterFormValues
  >({
    resolver: zodResolver(createEncounterFormSchema),
    defaultValues: {
      plannedDate: todayDate,
      plannedTime: "",
      visitType: "follow-up",
      reasonDisplay: "",
      note: "",
    },
  });

  /**
   * Form submission handler.
   *
   * Called with validated form values (Zod has already checked plannedDate/plannedTime contract).
   *
   * Flow:
   * 1. Set isSubmitting = true (disable inputs, change button text)
   * 2. Clear previous errors
   * 3. Call Server Action with form values
   * 4. Store the result (success or one of 3 error layers)
   * 5. Set isSubmitting = false
   *
   * Note: If successful, createEncounterAction calls redirect() which throws
   * internally, so this setState never completes. But if there's any error
   * (validation, domain rule, or FHIR), the result is saved and displayed.
   */
  const onSubmit = async (values: CreateEncounterFormValues) => {
    setIsSubmitting(true);
    setActionResult(null);

    const result = await createEncounterAction(patientId, episodeOfCareId, {
      ...values,
      visitType: values.visitType ?? "follow-up",
    });

    setActionResult(result);
    setIsSubmitting(false);

    // If result.success is true, we never reach this line because
    // createEncounterAction calls redirect(), which throws NEXT_REDIRECT.
  };

  /**
   * Extract error from action result.
   * actionResult.success === false means there's an error to show.
   */
  const error = actionResult?.success === false ? actionResult.error : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Error display: layer-specific header and message */}
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

      {/* Temporal planning fields */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          Agenda de la visita
        </legend>

        <div>
          <label
            htmlFor="plannedDate"
            className="block text-sm font-medium text-foreground"
          >
            Fecha programada
          </label>
          <p id="plannedDateHint" className="mt-1 text-xs text-muted-foreground">
            Se usa para planificar la agenda (entre hoy y los próximos 10 días).
          </p>
          <input
            type="date"
            id="plannedDate"
            min={todayDate}
            max={maxDateValue}
            aria-describedby="plannedDateHint"
            {...form.register("plannedDate")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          />
          {form.formState.errors.plannedDate && (
            <p className="mt-1 text-sm text-error">
              {form.formState.errors.plannedDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="plannedTime"
            className="block text-sm font-medium text-foreground"
          >
            Hora programada (opcional)
          </label>
          <p id="plannedTimeHint" className="mt-1 text-xs text-muted-foreground">
            Si queda vacía, la visita queda planificada solo con fecha.
          </p>
          <input
            type="time"
            id="plannedTime"
            step={60}
            aria-describedby="plannedTimeHint"
            {...form.register("plannedTime")}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          />
          {form.formState.errors.plannedTime && (
            <p className="mt-1 text-sm text-error">
              {form.formState.errors.plannedTime.message}
            </p>
          )}
        </div>
      </fieldset>

      {/* Practitioner (read-only) */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          Profesional
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
          <User size={14} aria-hidden="true" />
          <span>{practitionerName}</span>
        </div>
      </div>

      {/* Visit type field */}
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

      {/* Reason/motivo field */}
      <div>
        <label
          htmlFor="reasonDisplay"
          className="block text-sm font-medium text-foreground"
        >
          Motivo de la visita (opcional)
        </label>
        <input
          type="text"
          id="reasonDisplay"
          {...form.register("reasonDisplay")}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
          disabled={isSubmitting}
        />
        {form.formState.errors.reasonDisplay && (
          <p className="mt-1 text-sm text-error">
            {form.formState.errors.reasonDisplay.message}
          </p>
        )}
      </div>

      {/* Clinical note field */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-foreground"
        >
          Nota clínica (opcional)
        </label>
        <textarea
          id="note"
          {...form.register("note")}
          rows={4}
          placeholder="Motivo de la visita, observaciones previas, etc."
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
          disabled={isSubmitting}
        />
        {form.formState.errors.note && (
          <p className="mt-1 text-sm text-error">
            {form.formState.errors.note.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarPlus size={16} aria-hidden="true" />
          {isSubmitting ? "Guardando..." : "Planificar Visita"}
        </button>
      </div>
    </form>
  );
}
