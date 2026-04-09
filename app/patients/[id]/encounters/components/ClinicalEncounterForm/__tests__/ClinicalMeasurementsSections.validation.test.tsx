import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClinicalMeasurementsSections } from "../ClinicalMeasurementsSections";

type FormValues = {
  procedures: Array<{
    category: "" | "rehabilitacion-respiratoria";
    code: "" | "ejercicios-respiratorios";
    bodySite?: string;
    note?: string;
  }>;
};

function createRegisterSpy() {
  const optionsByName = new Map<string, unknown>();
  const register = vi.fn((name: string, options?: unknown) => {
    optionsByName.set(name, options);
    return {
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    };
  });

  return { register, optionsByName };
}

describe("ClinicalMeasurementsSections validation UX", () => {
  it("shows inline error feedback for real blood-pressure and EVA errors", () => {
    const { register } = createRegisterSpy();

    const html = renderToStaticMarkup(
      <ClinicalMeasurementsSections<FormValues>
        register={register as never}
        formState={{
          errors: {
            bloodPressureDiastolic: {
              message:
                "Si se indica presión arterial, debe completarse tanto sistólica como diastólica.",
            },
            evaScore: {
              message: "Invalid input: expected number, received NaN",
            },
          } as never,
        }}
        setValue={vi.fn() as never}
        fields={[]}
        watchProcedures={[]}
        appendProcedure={vi.fn()}
        removeProcedure={vi.fn()}
      />,
    );

    expect(html).toContain(
      "Si se indica presión arterial, debe completarse tanto sistólica como diastólica.",
    );
    expect(html).toContain("Invalid input: expected number, received NaN");
  });

  it("registers numeric fields with setValueAs and keeps empty values as absence", () => {
    const { register, optionsByName } = createRegisterSpy();

    const html = renderToStaticMarkup(
      <ClinicalMeasurementsSections<FormValues>
        register={register as never}
        formState={{ errors: {} as never }}
        setValue={vi.fn() as never}
        fields={[]}
        watchProcedures={[]}
        appendProcedure={vi.fn()}
        removeProcedure={vi.fn()}
      />,
    );

    expect(html).not.toContain("Invalid input: expected number");

    const numericFields = [
      "heartRate",
      "respiratoryRate",
      "oxygenSaturation",
      "bodyTemperature",
      "bloodPressureSystolic",
      "bloodPressureDiastolic",
      "evaScore",
    ];

    for (const field of numericFields) {
      const options = optionsByName.get(field) as
        | { setValueAs?: (value: unknown) => unknown }
        | undefined;
      expect(options?.setValueAs).toBeTypeOf("function");
      expect(options?.setValueAs?.("")).toBeUndefined();
    }
  });
});

