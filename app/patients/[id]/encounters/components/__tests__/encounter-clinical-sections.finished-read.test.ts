import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import EncounterVitalSignsSection from "../EncounterVitalSignsSection";
import EncounterEvaSection from "../EncounterEvaSection";
import EncounterProcedures from "../EncounterProcedures";

import type { VitalSignRecord } from "../../../../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../../../../domain/assessments/eva-assessment";
import type { Procedure } from "../../../../../../domain/procedures/procedure";

const vitalRecord1: VitalSignRecord = {
  id: "vital-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  date: "2026-03-10",
  heartRate: 82,
};

const vitalRecord2: VitalSignRecord = {
  id: "vital-2",
  patientId: "pat-1",
  encounterId: "enc-1",
  date: "2026-03-10",
  heartRate: 90,
};

const evaRecord: EvaAssessment = {
  id: "eva-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  type: "eva",
  date: "2026-03-10",
  score: 4,
};

const procedureRecord: Procedure = {
  id: "proc-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  type: "manual-therapy",
  status: "completed",
  code: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "386053000",
      },
    ],
  },
  performedDateTime: "2026-03-10T12:15:00.000Z",
};

describe("Encounter clinical sections for finished read", () => {
  it("vital signs section renders explicit empty state when there are no records", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterVitalSignsSection, {
        records: [],
      }),
    );

    expect(html).toContain("Signos vitales");
    expect(html).toContain("No hay registros de signos vitales");
  });

  it("vital signs section renders all records", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterVitalSignsSection, {
        records: [vitalRecord1, vitalRecord2],
      }),
    );

    expect(html).toContain("Registro 1");
    expect(html).toContain("Registro 2");
    expect(html).toContain("82 lpm");
    expect(html).toContain("90 lpm");
  });

  it("eva section renders explicit empty state when there are no records", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterEvaSection, { records: [] }),
    );

    expect(html).toContain("Dolor (EVA)");
    expect(html).toContain("Sin evaluaciones EVA");
  });

  it("procedures section renders explicit empty state when there are no procedures", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterProcedures, { procedures: [] }),
    );

    expect(html).toContain("Procedimientos");
    expect(html).toContain("Sin procedimientos registrados");
  });

  it("eva section keeps populated render behavior", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterEvaSection, { records: [evaRecord] }),
    );

    expect(html).toContain("Dolor (EVA)");
    expect(html).not.toContain("Sin evaluaciones EVA");
  });

  it("procedures section keeps populated render behavior", () => {
    const html = renderToStaticMarkup(
      React.createElement(EncounterProcedures, {
        procedures: [procedureRecord],
      }),
    );

    expect(html).toContain("Procedimientos");
    expect(html).not.toContain("Sin procedimientos registrados");
  });
});
