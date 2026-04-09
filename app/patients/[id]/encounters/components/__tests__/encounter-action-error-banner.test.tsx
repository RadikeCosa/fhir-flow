import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EncounterActionErrorBanner } from "../EncounterActionErrorBanner";

describe("EncounterActionErrorBanner", () => {
  it("maps validation layer title and shows code", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterActionErrorBanner, {
        error: {
          layer: "validation",
          message: "Faltan datos obligatorios",
          code: "MISSING_FIELDS",
          details: { formErrors: [], fieldErrors: {} },
        },
      }),
    );

    expect(html).toContain("Error de validación");
    expect(html).toContain("Faltan datos obligatorios");
    expect(html).toContain("MISSING_FIELDS");
  });

  it("maps domain and fhir layer titles", () => {
    const domainHtml = renderToStaticMarkup(
      React.createElement(EncounterActionErrorBanner, {
        error: {
          layer: "domain",
          message: "Regla clínica inválida",
        },
      }),
    );
    const fhirHtml = renderToStaticMarkup(
      React.createElement(EncounterActionErrorBanner, {
        error: {
          layer: "fhir",
          message: "Error servidor",
        },
      }),
    );

    expect(domainHtml).toContain("Error de reglas clínicas");
    expect(fhirHtml).toContain("Error al guardar en el servidor");
  });
});
