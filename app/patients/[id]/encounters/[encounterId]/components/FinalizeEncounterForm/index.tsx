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
import { ProcedureCategoryValues } from "@/domain/procedures/procedure";
import type {
  ProcedureCategory,
  ProcedureCode,
} from "@/domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "@/domain/procedures/procedure-code-category.map";
import {
  VITAL_SIGN_CAPTURE_RANGES,
  EVA_HELPER_TEXT,
} from "@/lib/clinical/vital-sign-capture-ranges";
import {
  formatProcedureCategory,
  formatProcedureCode,
} from "@/lib/patient/formatters/procedure.formatters";
import {
  buildFinalizeEncounterFormDefaultValues,
  formatPlannedContext,
  resolveInitialActualTiming,
} from "./finalize-encounter-form.defaults";
import type { InProgressEncounterFormInitialValues } from "@/lib/patient/mappers/in-progress-encounter-detail.mapper";

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
  const [showVitals, setShowVitals] = useState(true);
  const [showEva, setShowEva] = useState(true);
  const [showProcedures, setShowProcedures] = useState(true);
  const initialActualTiming = useMemo(
    () => resolveInitialActualTiming(actualStartAt, plannedDate),
    [actualStartAt, plannedDate],
  );
  const defaultValues = useMemo(
    () =>
      buildFinalizeEncounterFormDefaultValues(
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
    setActiveIntent("finalize");
    setServerResult(null);
    setSaveProgressSuccessMessage(null);
    clearSaveProgressRefreshTimeout();
    try {
      const result = await finalizeEncounterAction(patientId, encounterId, {
        ...values,
      });

      setServerResult(result);
      if (result.success) {
        router.refresh();
      }
    } catch (error: unknown) {
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
    } finally {
      setActiveIntent(null);
    }
  };

  const onSaveProgress = async () => {
    setActiveIntent("save-progress");
    setServerResult(null);
    setSaveProgressSuccessMessage(null);
    clearSaveProgressRefreshTimeout();

    try {
      const values = getValues();
      const clinicalNoteElement = document.getElementById("clinicalNote");
      const clinicalNoteFromDom =
        clinicalNoteElement instanceof HTMLTextAreaElement
          ? clinicalNoteElement.value
          : values.clinicalNote;

      const result = await saveEncounterProgressAction(patientId, encounterId, {
        clinicalNote: clinicalNoteFromDom,
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

      setServerResult(result);
      if (result.success) {
        setSaveProgressSuccessMessage("Progreso guardado correctamente.");
      }
    } catch (error: unknown) {
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
    } finally {
      setActiveIntent(null);
    }
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

          <fieldset className="mt-3 space-y-4">
            <legend className="text-sm font-medium text-foreground">
              Ejecución real de la visita
            </legend>
            <p id="actualTimingHint" className="text-xs text-muted-foreground">
              Registrá fecha y horario real en formato 24 horas.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  aria-describedby="actualTimingHint"
                  {...register("actualDate")}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                />
                {formState.errors.actualDate && (
                  <p className="text-xs text-red-600">
                    {formState.errors.actualDate.message}
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
                  aria-describedby="actualTimingHint"
                  {...register("actualStartTime")}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                />
                {formState.errors.actualStartTime && (
                  <p className="text-xs text-red-600">
                    {formState.errors.actualStartTime.message}
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
                  aria-describedby="actualTimingHint"
                  {...register("actualEndTime")}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                />
                {formState.errors.actualEndTime && (
                  <p className="text-xs text-red-600">
                    {formState.errors.actualEndTime.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <div className="mt-3">
            <label htmlFor="clinicalNote" className="block text-sm font-medium">
              Nota clínica *
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
                    Frecuencia cardíaca (
                    {VITAL_SIGN_CAPTURE_RANGES.heartRate.unit})
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
                  <p className="text-xs text-muted">
                    {VITAL_SIGN_CAPTURE_RANGES.heartRate.helperText}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="respiratoryRate"
                    className="block text-sm font-medium"
                  >
                    Frecuencia respiratoria (
                    {VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.unit})
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
                  <p className="text-xs text-muted">
                    {VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.helperText}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="oxygenSaturation"
                    className="block text-sm font-medium"
                  >
                    Saturación oxígeno (
                    {VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.unit})
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
                  <p className="text-xs text-muted">
                    {VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.helperText}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="bodyTemperature"
                    className="block text-sm font-medium"
                  >
                    Temperatura corporal (
                    {VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.unit})
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
                  <p className="text-xs text-muted">
                    {VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.helperText}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">Tensión arterial (mmHg)</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label
                      htmlFor="bloodPressureSystolic"
                      className="block text-sm font-medium"
                    >
                      Presión sistólica (
                      {VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.unit})
                    </label>
                    <input
                      type="number"
                      id="bloodPressureSystolic"
                      min={VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min}
                      max={VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max}
                      step={
                        VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.step
                      }
                      {...register("bloodPressureSystolic")}
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                    />
                    <p className="text-xs text-muted">
                      {
                        VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic
                          .helperText
                      }
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="bloodPressureDiastolic"
                      className="block text-sm font-medium"
                    >
                      Presión diastólica (
                      {VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.unit})
                    </label>
                    <input
                      type="number"
                      id="bloodPressureDiastolic"
                      min={VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min}
                      max={VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max}
                      step={
                        VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.step
                      }
                      {...register("bloodPressureDiastolic")}
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                    />
                    <p className="text-xs text-muted">
                      {
                        VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic
                          .helperText
                      }
                    </p>
                  </div>
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
                id="evaScore"
                min={VITAL_SIGN_CAPTURE_RANGES.evaScore.min}
                max={VITAL_SIGN_CAPTURE_RANGES.evaScore.max}
                step={VITAL_SIGN_CAPTURE_RANGES.evaScore.step}
                {...register("evaScore")}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2"
              />
              <p className="text-xs text-muted">{EVA_HELPER_TEXT}</p>
              {formState.errors.evaScore && (
                <p className="text-xs text-red-600">
                  {formState.errors.evaScore.message}
                </p>
              )}
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
                  watchProcedures?.[index]?.category ?? field.category ?? "";
                const codes =
                  category && isProcedureCategory(category)
                    ? getProcedureCodes(category)
                    : [];
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
                        {formState.errors.procedures?.[index]?.category
                          ?.message && (
                          <p className="text-xs text-red-600">
                            {
                              formState.errors.procedures[index]?.category
                                ?.message
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium">
                          Código
                        </label>
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
                          Región anatómica (opcional)
                        </label>
                        <input
                          type="text"
                          {...register(`procedures.${index}.bodySite` as const)}
                          className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Observaciones (opcional)
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
