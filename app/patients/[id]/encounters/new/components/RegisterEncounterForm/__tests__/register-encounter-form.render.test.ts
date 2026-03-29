import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../actions/register-encounter.action", () => ({
    registerEncounterAction: vi.fn(),
}));

import { RegisterEncounterForm } from "../index";

describe("RegisterEncounterForm render", () => {
    it("renders the minimum register fields and the two explicit submit actions", () => {
        const html = renderToStaticMarkup(
            React.createElement(RegisterEncounterForm, {
                patientId: "pat-1",
                episodeOfCareId: "ep-1",
                practitionerName: "Lic. Ramiro Perez",
            }),
        );

        expect(html).toContain("Episodio de cuidado");
        expect(html).toContain("Tipo de visita");
        expect(html).toContain("Fecha real");
        expect(html).toContain("Hora real de inicio");
        expect(html).toContain("Hora real de fin");
        expect(html).toContain("Nota clínica");
        expect(html).toContain("Guardar e iniciar");
        expect(html).toContain("Registrar visita completa");
    });
});