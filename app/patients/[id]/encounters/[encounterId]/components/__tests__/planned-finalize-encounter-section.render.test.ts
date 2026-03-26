import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../FinalizeEncounterForm", () => ({
  default: () => React.createElement("div", null, "Finalize form mock"),
}));

vi.mock("../../actions/start-encounter.action", () => ({
  startEncounterAction: vi.fn(),
}));

import PlannedFinalizeEncounterSection from "../PlannedFinalizeEncounterSection";

describe("PlannedFinalizeEncounterSection render", () => {
  it("shows editable real start date/time and the primary action", () => {
    const html = renderToStaticMarkup(
      React.createElement(PlannedFinalizeEncounterSection, {
        patientId: "patient-1",
        encounterId: "encounter-1",
        plannedDate: "2026-03-20",
        plannedTime: "10:00",
      }),
    );

    expect(html).toContain("Visita pendiente");
    expect(html).toContain("Fecha real");
    expect(html).toContain("Hora real");
    expect(html).toContain("Iniciar visita");
  });
});
