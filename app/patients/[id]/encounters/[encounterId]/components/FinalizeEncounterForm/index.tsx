"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { FinalizeEncounterFormInput } from "./finalize-encounter-form.schema";
import { finalizeEncounterFormSchema } from "./finalize-encounter-form.schema";
import { finalizeEncounterAction } from "../../actions/finalize-encounter.action";
import type { ActionResult } from "../../../../../../../domain/shared/action-result.types";
import { ProcedureCategoryValues } from "@/domain/procedures/procedure";
import type {
  ProcedureCategory,
  ProcedureCode,
} from "@/domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "@/domain/procedures/procedure-code-category.map";

interface FinalizeEncounterFormProps {
  // Internal use only, not for display
  patientId: string;
  encounterId: string;
  // Display props
  patientName: string;
  practitionerName: string;
  periodStart: string;
  periodStartFormatted?: string;
}

const getProcedureCodes = (
  category: ProcedureCategory,
): readonly ProcedureCode[] => PROCEDURE_CODES_BY_CATEGORY[category];

const getDefaultProcedureCode = (category: ProcedureCategory): ProcedureCode =>
  getProcedureCodes(category)[0];

const isProcedureCategory = (value: string): value is ProcedureCategory =>
  ProcedureCategoryValues.includes(value as ProcedureCategory);

const createDefaultProcedure = (
  category: ProcedureCategory = ProcedureCategoryValues[0],
): {
  category: ProcedureCategory;
  code: ProcedureCode;
  bodySite?: string;
  note?: string;
} => ({
  category,
  code: getDefaultProcedureCode(category),
  bodySite: "",
  note: "",
});

export default function FinalizeEncounterForm({
  patientId,
  encounterId,
  patientName,
  practitionerName,
  periodStart,
  periodStartFormatted,
}: FinalizeEncounterFormProps) {
  const [serverResult, setServerResult] = useState<ActionResult<void> | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVitals, setShowVitals] = useState(true);
  const [showEva, setShowEva] = useState(false);
  const [showProcedures, setShowProcedures] = useState(true);

  const form = useForm<FinalizeEncounterFormInput>({
    resolver: zodResolver(finalizeEncounterFormSchema),
    defaultValues: {
      periodEnd: new Date(),
      clinicalNote: "",
      reasonDisplay: "",
      evaScore: undefined,
      bloodPressureSystolic: undefined,
      bloodPressureDiastolic: undefined,
      heartRate: undefined,
      respiratoryRate: undefined,
      oxygenSaturation: undefined,
      bodyTemperature: undefined,
      procedures: [],
    },
  });

  const { control, register, handleSubmit, formState, setValue } = form;
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

  const onSubmit = async (values: FinalizeEncounterFormInput) => {
    setIsSubmitting(true);
    setServerResult(null);

    const result = await finalizeEncounterAction(patientId, encounterId, {
      ...values,
      periodEnd: values.periodEnd,
    });

    setServerResult(result);
    setIsSubmitting(false);
  };

  const error = serverResult?.success === false ? serverResult.error : null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-sm text-muted">Paciente: {patientName}</div>
        <div className="text-sm text-muted">
          Profesional: {practitionerName}
        </div>
        <div className="text-sm text-muted">
          Inicio del período: {periodStartFormatted ?? periodStart}
        </div>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Datos del cierre */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold">Datos del cierre</h2>

          <p className="text-sm text-muted">
            Fecha inicio (no editable): {periodStartFormatted ?? periodStart}
          </p>

          <div className="mt-3">
            <label htmlFor="periodEnd" className="block text-sm font-medium">
              Fecha y hora de fin
            </label>
            <input
              type="datetime-local"
              id="periodEnd"
              {...register("periodEnd", { valueAsDate: true })}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
            {formState.errors.periodEnd && (
              <p className="text-xs text-red-600">
                {formState.errors.periodEnd.message}
              </p>
            )}
          </div>

          <div className="mt-3">
            <label htmlFor="clinicalNote" className="block text-sm font-medium">
              Nota clínica
            </label>
            <textarea
              id="clinicalNote"
              {...register("clinicalNote")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
            {formState.errors.clinicalNote && (
              <p className="text-xs text-red-600">
                {formState.errors.clinicalNote.message}
              </p>
            )}
          </div>

          <div className="mt-3">
            <label
              htmlFor="reasonDisplay"
              className="block text-sm font-medium"
            >
              Motivo de la visita
            </label>
            <input
              type="text"
              id="reasonDisplay"
              {...register("reasonDisplay")}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
            {formState.errors.reasonDisplay && (
              <p className="text-xs text-red-600">
                {formState.errors.reasonDisplay.message}
              </p>
            )}
          </div>

          <div className="mt-3 rounded-md border border-border bg-surface p-3">
            <p className="text-sm font-medium">Profesional</p>
            <p className="text-sm">{practitionerName}</p>
          </div>
        </div>

        {/* Signos vitales */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <button
            type="button"
            onClick={() => setShowVitals((prev) => !prev)}
            className="mb-3 text-sm font-semibold"
          >
            Signos vitales {showVitals ? "▲" : "▼"}
          </button>
          {showVitals && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="heartRate"
                    className="block text-sm font-medium"
                  >
                    Frecuencia cardíaca
                  </label>
                  <input
                    type="number"
                    id="heartRate"
                    {...register("heartRate", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="respiratoryRate"
                    className="block text-sm font-medium"
                  >
                    Frecuencia respiratoria
                  </label>
                  <input
                    type="number"
                    id="respiratoryRate"
                    {...register("respiratoryRate", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="oxygenSaturation"
                    className="block text-sm font-medium"
                  >
                    Saturación oxígeno
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    id="oxygenSaturation"
                    {...register("oxygenSaturation", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bodyTemperature"
                    className="block text-sm font-medium"
                  >
                    Temperatura corporal
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="bodyTemperature"
                    {...register("bodyTemperature", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="bloodPressureSystolic"
                    className="block text-sm font-medium"
                  >
                    Presión sistólica
                  </label>
                  <input
                    type="number"
                    id="bloodPressureSystolic"
                    {...register("bloodPressureSystolic", {
                      valueAsNumber: true,
                    })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bloodPressureDiastolic"
                    className="block text-sm font-medium"
                  >
                    Presión diastólica
                  </label>
                  <input
                    type="number"
                    id="bloodPressureDiastolic"
                    {...register("bloodPressureDiastolic", {
                      valueAsNumber: true,
                    })}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* EVA */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <button
            type="button"
            onClick={() => setShowEva((prev) => !prev)}
            className="mb-3 text-sm font-semibold"
          >
            EVA {showEva ? "▲" : "▼"}
          </button>
          {showEva && (
            <div>
              <label htmlFor="evaScore" className="block text-sm font-medium">
                Puntuación EVA
              </label>
              <input
                type="number"
                min="0"
                max="10"
                id="evaScore"
                {...register("evaScore", { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2"
              />
            </div>
          )}
        </div>

        {/* Procedimientos */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <button
            type="button"
            onClick={() => setShowProcedures((prev) => !prev)}
            className="mb-3 text-sm font-semibold"
          >
            Procedimientos {showProcedures ? "▲" : "▼"}
          </button>
          {showProcedures && (
            <div className="space-y-3">
              {fields.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted">
                  No hay procedimientos cargados. Podés agregar uno desde esta
                  sección.
                </div>
              )}

              {fields.map((field, index) => {
                const category =
                  watchProcedures?.[index]?.category ??
                  field.category ??
                  ProcedureCategoryValues[0];
                const codes = getProcedureCodes(category);
                const categoryField = register(
                  `procedures.${index}.category` as const,
                );
                const codeField = register(`procedures.${index}.code` as const);

                return (
                  <div
                    key={field.id}
                    className="space-y-2 rounded-md border border-border p-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium">
                          Categoría
                        </label>
                        <select
                          {...categoryField}
                          onChange={(event) => {
                            const nextCategory = event.currentTarget.value;

                            categoryField.onChange(event);
                            if (!isProcedureCategory(nextCategory)) {
                              return;
                            }

                            setValue(
                              `procedures.${index}.code`,
                              getDefaultProcedureCode(nextCategory),
                              {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              },
                            );
                          }}
                          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                        >
                          {ProcedureCategoryValues.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium">
                          Código
                        </label>
                        <select
                          {...codeField}
                          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                        >
                          {codes.map((code) => (
                            <option key={code} value={code}>
                              {code}
                            </option>
                          ))}
                        </select>
                        {formState.errors.procedures?.[index]?.code
                          ?.message && (
                          <p className="text-xs text-red-600">
                            {formState.errors.procedures[index]?.code?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium">
                          Cuerpo afectado
                        </label>
                        <input
                          type="text"
                          {...register(`procedures.${index}.bodySite` as const)}
                          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Nota
                        </label>
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
                className="mt-2 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Agregar procedimiento
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Finalizar visita"}
        </button>
      </form>
    </div>
  );
}
