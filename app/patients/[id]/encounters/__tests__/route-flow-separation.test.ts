import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../new/actions/create-encounter.action", () => ({
  createEncounterAction: vi.fn(),
}));

vi.mock("../new/actions/register-encounter.action", () => ({
  registerEncounterAction: vi.fn(),
}));

vi.mock("../new/components/CreateEncounterForm", () => ({
  CreateEncounterForm: () => React.createElement("div", null, "CreateEncounterFormMock"),
}));

vi.mock("../new/components/RegisterEncounterForm", () => ({
  RegisterEncounterForm: () => React.createElement("div", null, "RegisterEncounterFormMock"),
}));

vi.mock("../new/data", () => ({
  getNewEncounterPageData: vi.fn(async () => ({
    patientName: "Paciente Demo",
    practitionerName: "Lic. Demo",
    activeEpisodes: [{ id: "ep-1", status: "active" }],
  })),
}));

import NewEncounterPage from "../new/page";
import RegisterEncounterPage from "../register/page";

describe("encounters route flow separation", () => {
  it("renders create planned UI on /encounters/new", async () => {
    const element = await NewEncounterPage({
      params: Promise.resolve({ id: "pat-1" }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Planificar visita");
    expect(html).toContain("Datos de planificación");
    expect(html).toContain("CreateEncounterFormMock");
  });

  it("renders register UI on /encounters/register", async () => {
    const element = await RegisterEncounterPage({
      params: Promise.resolve({ id: "pat-1" }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Registrar visita");
    expect(html).toContain("Datos de la visita");
    expect(html).toContain("RegisterEncounterFormMock");
  });
});
