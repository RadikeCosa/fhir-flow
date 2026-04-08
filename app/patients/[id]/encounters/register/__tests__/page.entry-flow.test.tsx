import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../new/actions/register-encounter.action", () => ({
  registerEncounterAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/patients/pat-1/encounters/register",
}));

vi.mock("../../new/data", () => ({
  getNewEncounterPageData: vi.fn(async () => ({
    patientName: "Paciente Demo",
    practitionerName: "Lic. Demo",
    activeEpisodes: [{ id: "ep-1", status: "active" }],
  })),
}));
vi.mock("../data", () => ({
  getRegisterEncounterContinuationData: vi.fn(async () => null),
}));

import RegisterEncounterPage from "../page";

describe("RegisterEncounterPage entry flow", () => {
  it("renders direct unified clinical form without a pre-step gate", async () => {
    const element = await RegisterEncounterPage({
      params: Promise.resolve({ id: "pat-1" }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Registrar visita");
    expect(html).toContain("Datos de la visita");
    expect(html).toContain("Tipo de visita");
    expect(html).toContain("Fecha");
    expect(html).toContain("Hora de entrada");
    expect(html).toContain("Guardado parcial");
    expect(html).toContain("Registrar");

    expect(html).not.toContain("Iniciar visita");
    expect(html).not.toContain("Finalizar directamente");
  });
});
