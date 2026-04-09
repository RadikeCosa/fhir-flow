"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  EVA_HELPER_TEXT,
  VITAL_SIGN_CAPTURE_RANGES,
} from "@/lib/clinical/vital-sign-capture-ranges";
import {
  ProcedureCategoryValues,
  type ProcedureCategory,
  type ProcedureCode,
} from "@/domain/procedures/procedure";
import { PROCEDURE_CODES_BY_CATEGORY } from "@/domain/procedures/procedure-code-category.map";
import {
  formatProcedureCategory,
  formatProcedureCode,
} from "@/lib/patient/formatters/procedure.formatters";
import { createDefaultProcedure } from "./schema";

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

interface ClinicalMeasurementsSectionsProps<FormValues extends { procedures: ProcedureFormItem[] }> {
  register: UseFormRegister<FormValues>;
  formState: { errors: FieldErrors<FormValues> };
  setValue: UseFormSetValue<FormValues>;
  fields: ProcedureFieldItem[];
  watchProcedures?: ProcedureFormItem[];
  appendProcedure: () => void;
  removeProcedure: (index: number) => void;
  compactToggles?: boolean;
}

const isProcedureCategory = (value: string): value is ProcedureCategory =>
  ProcedureCategoryValues.includes(value as ProcedureCategory);

export function ClinicalMeasurementsSections<FormValues extends { procedures: ProcedureFormItem[] }>({
  register,
  formState,
  setValue,
  fields,
  watchProcedures,
  appendProcedure,
  removeProcedure,
  compactToggles = false,
}: ClinicalMeasurementsSectionsProps<FormValues>) {
  const procedureErrors = formState.errors.procedures as
    | Array<{ category?: { message?: string }; code?: { message?: string } }>
    | undefined;

  return (
    <>
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
              {...register("heartRate" as never)}
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
              {...register("respiratoryRate" as never)}
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
              {...register("oxygenSaturation" as never)}
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
              {...register("bodyTemperature" as never)}
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
              {...register("bloodPressureSystolic" as never)}
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
              {...register("bloodPressureDiastolic" as never)}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2"
            />
          </div>
        </div>
        <p className="mt-2 text-sm font-medium">Tensión arterial (mmHg)</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <label htmlFor="evaScore" className="block text-sm font-medium">
          Puntuación EVA
        </label>
        <input
          type="number"
          id="evaScore"
          min={VITAL_SIGN_CAPTURE_RANGES.evaScore.min}
          max={VITAL_SIGN_CAPTURE_RANGES.evaScore.max}
          step={VITAL_SIGN_CAPTURE_RANGES.evaScore.step}
          {...register("evaScore" as never)}
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
              ? PROCEDURE_CODES_BY_CATEGORY[category]
              : [];
          const categoryField = register(`procedures.${index}.category` as never);
          const codeField = register(`procedures.${index}.code` as never);

          return (
            <div key={field.id} className="space-y-2 rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Categoría</label>
                  <select
                    {...categoryField}
                    onChange={(event) => {
                      categoryField.onChange(event);
                      setValue(`procedures.${index}.code` as never, "" as never, {
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
                    {...register(`procedures.${index}.bodySite` as never)}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Observaciones (opcional)</label>
                  <input
                    type="text"
                    {...register(`procedures.${index}.note` as never)}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2"
                  />
                </div>
              </div>

              {(procedureErrors?.[index]?.category?.message ||
                procedureErrors?.[index]?.code?.message) && (
                <p className="text-xs text-red-600">
                  {procedureErrors[index]?.category?.message ||
                    procedureErrors[index]?.code?.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => removeProcedure(index)}
                className="text-sm text-red-600"
              >
                Eliminar
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={appendProcedure}
          className={
            compactToggles
              ? "mt-2 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
              : "inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
          }
        >
          Agregar procedimiento
        </button>
      </div>
    </>
  );
}

export const defaultProcedureFactory = createDefaultProcedure;
