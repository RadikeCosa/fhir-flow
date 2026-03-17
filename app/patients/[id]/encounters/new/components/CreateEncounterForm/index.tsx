"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { CreateEncounterFormValues } from "./create-encounter-form.schema";
import { createEncounterFormSchema } from "./create-encounter-form.schema";
import { createEncounterAction } from "../../actions/create-encounter.action";
import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";

/**
 * Props for the CreateEncounterForm component.
 *
 * @param patientId       - The patient resource ID (from URL params)
 * @param episodeOfCareId - The episode of care resource ID (passed from parent)
 */
interface CreateEncounterFormProps {
  patientId: string;
  episodeOfCareId: string;
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
   * - plannedAt: Today's date (Date object, not string)
   * - note: Empty string (optional field)
   */
  const form = useForm<CreateEncounterFormValues>({
    resolver: zodResolver(createEncounterFormSchema),
    defaultValues: {
      plannedAt: new Date(),
      note: "",
    },
  });

  /**
   * Form submission handler.
   *
   * Called with validated form values (Zod has already checked plannedAt is Date, note is clean).
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

    const result = await createEncounterAction(
      patientId,
      episodeOfCareId,
      values,
    );

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

      {/* Planned date/time field */}
      <div>
        <label
          htmlFor="plannedAt"
          className="block text-sm font-medium text-gray-700"
        >
          Fecha y hora planificada
        </label>
        <input
          type="datetime-local"
          id="plannedAt"
          {...form.register("plannedAt", {
            valueAsDate: true,
          })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          disabled={isSubmitting}
        />
        {form.formState.errors.plannedAt && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.plannedAt.message}
          </p>
        )}
      </div>

      {/* Clinical note field */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-gray-700"
        >
          Nota clínica (opcional)
        </label>
        <textarea
          id="note"
          {...form.register("note")}
          rows={4}
          placeholder="Motivo de la visita, observaciones previas, etc."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          disabled={isSubmitting}
        />
        {form.formState.errors.note && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.note.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Planificar Visita"}
        </button>
      </div>
    </form>
  );
}
