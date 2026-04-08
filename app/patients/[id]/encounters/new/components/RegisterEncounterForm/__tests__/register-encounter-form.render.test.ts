import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../actions/register-encounter.action", () => ({
    registerEncounterAction: vi.fn(),
}));
vi.mock("../../../../[encounterId]/actions/save-encounter-progress.action", () => ({
    saveEncounterProgressAction: vi.fn(),
}));
vi.mock("../../../../[encounterId]/actions/finalize-encounter.action", () => ({
    finalizeEncounterAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => "/patients/pat-1/encounters/register",
}));

import { RegisterEncounterForm } from "../index";

describe("RegisterEncounterForm render", () => {
    it("renders single-surface clinical fields and explicit intent actions", () => {
        const html = renderToStaticMarkup(
            React.createElement(RegisterEncounterForm, {
                patientId: "pat-1",
                episodeOfCareId: "ep-1",
                practitionerName: "Lic. Ramiro Perez",
            }),
        );

        expect(html).toContain("Tipo de visita");
        expect(html).toContain("Fecha");
        expect(html).toContain("Motivo de la visita");
        expect(html).toContain("Hora de entrada");
        expect(html).toContain("Hora de salida");
        expect(html).toContain("Nota clínica");
        expect(html).toContain("Signos vitales");
        expect(html).toContain("EVA");
        expect(html).toContain("Procedimientos");
        expect(html).toContain("Registrado por");
        expect(html).toContain("Lic. Ramiro Perez");
        expect(html).toContain("Guardado parcial");
        expect(html).toContain("Registrar");
    });
});
