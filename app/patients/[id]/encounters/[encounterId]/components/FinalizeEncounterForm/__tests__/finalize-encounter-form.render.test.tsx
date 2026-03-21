import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../actions/finalize-encounter.action", () => ({
  finalizeEncounterAction: vi.fn(),
}));

import FinalizeEncounterForm, { createDefaultProcedure } from "../index";

describe("FinalizeEncounterForm render", () => {
  it("shows EVA section expanded by default with helper text", () => {
    const html = renderToStaticMarkup(
      React.createElement(FinalizeEncounterForm, {
        patientId: "patient-1",
        encounterId: "encounter-1",
        patientName: "Pacient",
        practitionerName: "Doc",
        plannedDate: "2026-03-20",
        plannedTime: "10:00",
      }),
    );

    expect(html).toContain("Puntuación EVA");
    expect(html).toContain("0 = sin dolor · 10 = peor dolor imaginable");
    expect(html).toContain("Frecuencia cardíaca (lpm)");
  });

  it("keeps procedure default entry with empty category/code and placeholders", () => {
    const defaultProcedure = createDefaultProcedure();
    expect(defaultProcedure.category).toBe("");
    expect(defaultProcedure.code).toBe("");

    const html = renderToStaticMarkup(
      React.createElement(FinalizeEncounterForm, {
        patientId: "patient-1",
        encounterId: "encounter-1",
        patientName: "Pacient",
        practitionerName: "Doc",
        plannedDate: "2026-03-20",
        plannedTime: "10:00",
      }),
    );

    expect(html).toContain("Seleccionar categoría");
    expect(html).toContain("Seleccionar procedimiento");
    expect(html).toContain("Región anatómica (opcional)");
    expect(html).toContain("Tensión arterial (mmHg)");
  });
});
