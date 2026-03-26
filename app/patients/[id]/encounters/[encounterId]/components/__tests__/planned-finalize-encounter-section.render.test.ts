import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../FinalizeEncounterForm", () => ({
  default: () => React.createElement("div", null, "Finalize form mock"),
}));

import PlannedFinalizeEncounterSection from "../PlannedFinalizeEncounterSection";

describe("PlannedFinalizeEncounterSection render", () => {
  it("shows the primary action and keeps the form hidden by default", () => {
    const html = renderToStaticMarkup(
      React.createElement(PlannedFinalizeEncounterSection, {
        patientId: "patient-1",
        encounterId: "encounter-1",
        practitionerName: "Doc",
        plannedDate: "2026-03-20",
        plannedTime: "10:00",
      }),
    );

    expect(html).toContain("Visita pendiente");
    expect(html).toContain("Completar cierre");
    expect(html).not.toContain("Finalize form mock");
    expect(html).not.toContain("Formulario de finalización desplegado.");
  });
});