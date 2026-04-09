"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { formatEncounterVisitType } from "@/lib/patient/formatters/encounter.formatters";
import { ClinicalMeasurementsSections } from "./ClinicalMeasurementsSections";
import type { ProcedureCategory, ProcedureCode } from "@/domain/procedures/procedure";

interface ProcedureFieldItem {
  id: string;
  category?: ProcedureCategory | "";
}

interface ProcedureFormItem {
  category: ProcedureCategory | "";
  code: ProcedureCode | "";
  bodySite?: string;
  note?: string;
}

interface ClinicalEncounterFormProps<FormValues extends { procedures: ProcedureFormItem[] }> {
  register: UseFormRegister<FormValues>;
  formState: { errors: FieldErrors<FormValues> };
  setValue: UseFormSetValue<FormValues>;
  fields: ProcedureFieldItem[];
  watchProcedures?: ProcedureFormItem[];
  appendProcedure: () => void;
  removeProcedure: (index: number) => void;
  practitionerName: string;
  isSubmitting?: boolean;
  showVisitType?: boolean;
  showPractitionerCard?: boolean;
  actionMode?: "register" | "none";
}

export function ClinicalEncounterForm<FormValues extends { procedures: ProcedureFormItem[] }>({
  register,
  formState,
  setValue,
  fields,
  watchProcedures,
  appendProcedure,
  removeProcedure,
  practitionerName,
  isSubmitting = false,
  showVisitType = true,
  showPractitionerCard = true,
  actionMode = "none",
}: ClinicalEncounterFormProps<FormValues>) {
  return (
    <>
      {showVisitType && (
        <div>
          <label htmlFor="visitType" className="block text-sm font-medium text-foreground">
            Tipo de visita
          </label>
          <select
            id="visitType"
            {...register("visitType" as never)}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
            disabled={isSubmitting}
          >
            <option value="initial">{formatEncounterVisitType("initial")}</option>
            <option value="follow-up">{formatEncounterVisitType("follow-up")}</option>
            <option value="re-assessment">{formatEncounterVisitType("re-assessment")}</option>
            <option value="discharge">{formatEncounterVisitType("discharge")}</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="reasonDisplay" className="block text-sm font-medium">
          Motivo de la visita
        </label>
        <input
          type="text"
          id="reasonDisplay"
          {...register("reasonDisplay" as never)}
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
            {...register("actualDate" as never)}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualDate && (
            <p className="mt-1 text-sm text-error">{String(formState.errors.actualDate.message)}</p>
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
            {...register("actualStartTime" as never)}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualStartTime && (
            <p className="mt-1 text-sm text-error">{String(formState.errors.actualStartTime.message)}</p>
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
            {...register("actualEndTime" as never)}
            className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm"
            disabled={isSubmitting}
          />
          {formState.errors.actualEndTime && (
            <p className="mt-1 text-sm text-error">{String(formState.errors.actualEndTime.message)}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="clinicalNote" className="block text-sm font-medium">
          Nota clínica
        </label>
        <textarea
          id="clinicalNote"
          {...register("clinicalNote" as never)}
          rows={4}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
          disabled={isSubmitting}
        />
        {formState.errors.clinicalNote && (
          <p className="mt-1 text-sm text-error">{String(formState.errors.clinicalNote.message)}</p>
        )}
      </div>

      {showPractitionerCard && (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Registrado por <span className="font-medium text-foreground">{practitionerName}</span>
        </div>
      )}

      <ClinicalMeasurementsSections
        register={register}
        formState={formState}
        setValue={setValue}
        fields={fields}
        watchProcedures={watchProcedures}
        appendProcedure={appendProcedure}
        removeProcedure={removeProcedure}
      />

      {actionMode === "register" && (
        <>
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
        </>
      )}
    </>
  );
}
