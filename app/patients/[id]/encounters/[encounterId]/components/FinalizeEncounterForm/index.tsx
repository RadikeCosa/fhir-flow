"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FinalizeEncounterFormInput } from "./finalize-encounter-form.schema";
import type { FinalizeEncounterFormValues } from "./finalize-encounter-form.schema";
import { finalizeEncounterFormSchema } from "./finalize-encounter-form.schema";
import { finalizeEncounterAction } from "../../actions/finalize-encounter.action";
import { saveEncounterProgressAction } from "../../actions/save-encounter-progress.action";
import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import {
  buildClinicalEncounterFormDefaultValues,
  formatPlannedContext,
  resolveInitialActualTiming,
} from "../../../components/ClinicalEncounterForm/clinical-encounter-form.defaults";
import type { InProgressEncounterFormInitialValues } from "@/lib/patient/mappers/in-progress-encounter-detail.mapper";
import { ClinicalEncounterForm } from "../../../components/ClinicalEncounterForm/ClinicalEncounterForm";
import { createDefaultProcedure } from "../../../components/ClinicalEncounterForm/schema";
import { EncounterActionErrorBanner } from "../../../components/EncounterActionErrorBanner";
import { runEncounterIntent } from "../../../components/encounter-submit-wiring";
export { createDefaultProcedure } from "../../../components/ClinicalEncounterForm/schema";

interface FinalizeEncounterFormProps {
  // Internal use only, not for display
  patientId: string;
  encounterId: string;
  // Display props
  practitionerName: string;
  plannedDate?: string;
  plannedTime?: string;
  actualStartAt?: string;
  initialValues?: InProgressEncounterFormInitialValues;
}

export default function FinalizeEncounterForm({
  patientId,
  encounterId,
  practitionerName,
  plannedDate,
  plannedTime,
  actualStartAt,
  initialValues,
}: FinalizeEncounterFormProps) {
  const router = useRouter();
  const [serverResult, setServerResult] = useState<ActionResult<void> | null>(
    null,
  );
  const [saveProgressSuccessMessage, setSaveProgressSuccessMessage] = useState<
    string | null
  >(null);
  const [activeIntent, setActiveIntent] = useState<
    "save-progress" | "finalize" | null
  >(null);
  const saveProgressRefreshTimeoutRef = useRef<number | null>(null);

  const initialActualTiming = useMemo(
    () => resolveInitialActualTiming(actualStartAt, plannedDate),
    [actualStartAt, plannedDate],
  );
  const defaultValues = useMemo(
    () =>
      buildClinicalEncounterFormDefaultValues(
        initialActualTiming,
        initialValues,
      ),
    [initialActualTiming, initialValues],
  );

  const form = useForm<
    FinalizeEncounterFormInput,
    unknown,
    FinalizeEncounterFormValues
  >({
    resolver: zodResolver(finalizeEncounterFormSchema),
    shouldFocusError: true,
    defaultValues,
  });

  const {
    control,
    register,
    handleSubmit,
    formState,
    setValue,
    getValues,
    reset,
  } = form;
  const { fields, append, remove } = useFieldArray<
    FinalizeEncounterFormInput,
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

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    return () => {
      if (saveProgressRefreshTimeoutRef.current !== null) {
        window.clearTimeout(saveProgressRefreshTimeoutRef.current);
      }
    };
  }, []);

  const clearSaveProgressRefreshTimeout = () => {
    if (saveProgressRefreshTimeoutRef.current !== null) {
      window.clearTimeout(saveProgressRefreshTimeoutRef.current);
      saveProgressRefreshTimeoutRef.current = null;
    }
  };

  const onSubmit = async (values: FinalizeEncounterFormValues) => {
    await runEncounterIntent({
      intent: "finalize",
      setActiveIntent,
      clearError: () => setServerResult(null),
      beforeRun: () => {
        setSaveProgressSuccessMessage(null);
        clearSaveProgressRefreshTimeout();
      },
      run: () =>
        finalizeEncounterAction(patientId, encounterId, {
          ...values,
        }),
      onResult: (result) => {
        setServerResult(result);
        if (result.success) {
          router.refresh();
        }
      },
      onError: (error: unknown) => {
        console.error("[FinalizeEncounterForm] onSubmit catch", error);
        const message = error instanceof Error ? error.message : "";
        if (message.includes("NEXT_REDIRECT")) {
          router.refresh();
          return;
        }

        setServerResult({
          success: false,
          error: {
            layer: "fhir",
            message: "Ocurrió un error inesperado al finalizar la visita.",
            code: "FINALIZE_UNEXPECTED_ERROR",
          },
        });
      },
    });
  };

  const onSaveProgress = async () => {
    await runEncounterIntent({
      intent: "save-progress",
      setActiveIntent,
      clearError: () => setServerResult(null),
      beforeRun: () => {
        setSaveProgressSuccessMessage(null);
        clearSaveProgressRefreshTimeout();
      },
      run: async () => {
        const values = getValues();

        return saveEncounterProgressAction(patientId, encounterId, {
          actualDate: values.actualDate,
          actualStartTime: values.actualStartTime,
          clinicalNote: values.clinicalNote,
          reasonDisplay: values.reasonDisplay,
          evaScore: values.evaScore,
          bloodPressureSystolic: values.bloodPressureSystolic,
          bloodPressureDiastolic: values.bloodPressureDiastolic,
          heartRate: values.heartRate,
          respiratoryRate: values.respiratoryRate,
          oxygenSaturation: values.oxygenSaturation,
          bodyTemperature: values.bodyTemperature,
          procedures: values.procedures,
        });
      },
      onResult: (result) => {
        setServerResult(result);
        if (result.success) {
          setSaveProgressSuccessMessage("Progreso guardado correctamente.");
        }
      },
      onError: (error: unknown) => {
        console.error("[FinalizeEncounterForm] onSaveProgress catch", error);
        const message = error instanceof Error ? error.message : "";
        if (message.includes("NEXT_REDIRECT")) {
          setSaveProgressSuccessMessage("Progreso guardado correctamente.");
          clearSaveProgressRefreshTimeout();
          saveProgressRefreshTimeoutRef.current = window.setTimeout(() => {
            router.refresh();
          }, 800);
          return;
        }

        setSaveProgressSuccessMessage(null);
        setServerResult({
          success: false,
          error: {
            layer: "fhir",
            message: "Ocurrió un error inesperado al guardar el progreso.",
            code: "SAVE_PROGRESS_UNEXPECTED_ERROR",
          },
        });
      },
    });
  };
  const error = serverResult?.success === false ? serverResult.error : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <div className="flex flex-col gap-1">
          <div>
            <span className="font-medium text-foreground">Profesional:</span>{" "}
            {practitionerName}
          </div>
          <div>
            <span className="font-medium text-foreground">
              Agenda planificada:
            </span>{" "}
            {formatPlannedContext(plannedDate, plannedTime)}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted">
        Si llegaste desde <span className="font-medium text-foreground">Guardar progreso</span>,
        estás continuando la misma visita. Podés completar o ajustar los datos
        clínicos antes de finalizar.
      </div>

      {error && <EncounterActionErrorBanner error={error} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ClinicalEncounterForm
          register={register}
          formState={formState}
          setValue={setValue}
          fields={fields}
          watchProcedures={watchProcedures}
          appendProcedure={() => append(createDefaultProcedure())}
          removeProcedure={remove}
          practitionerName={practitionerName}
          showVisitType={false}
          showPractitionerCard={false}
          actionMode="none"
        />

        <div className="flex flex-wrap items-center gap-2">
          {saveProgressSuccessMessage && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
            >
              {saveProgressSuccessMessage}
            </div>
          )}

          <button
            type="button"
            onClick={onSaveProgress}
            disabled={activeIntent !== null}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-foreground disabled:opacity-50"
          >
            {activeIntent === "save-progress"
              ? "Guardando..."
              : "Guardar progreso"}
          </button>

          <button
            type="submit"
            disabled={activeIntent !== null}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {activeIntent === "finalize" ? "Guardando..." : "Finalizar visita"}
          </button>
        </div>
      </form>
    </div>
  );
}
