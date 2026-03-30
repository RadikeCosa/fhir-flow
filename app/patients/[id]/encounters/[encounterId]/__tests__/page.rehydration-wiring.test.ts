import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("a", {}, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/patients/pat-1/encounters/enc-1",
}));

vi.mock("@/lib/breadcrumbs/breadcrumbs", () => ({
  buildBreadcrumbs: () => [{ label: "Inicio", current: true }],
  BreadcrumbItem: undefined,
}));

vi.mock("../components/FinalizeEncounterForm", () => ({
  default: ({ initialValues }: { initialValues?: { clinicalNote?: string } }) =>
    React.createElement(
      "section",
      {},
      `finalize:${initialValues?.clinicalNote ?? "none"}`,
    ),
}));

vi.mock("../components/PlannedFinalizeEncounterSection", () => ({
  default: () => React.createElement("section", {}, "planned-finalize"),
}));

vi.mock("../components/EncounterClinicalNote", () => ({
  default: () => React.createElement("section", {}, "clinical-note"),
}));

vi.mock("../components/EncounterVitalSignsSection", () => ({
  default: () => React.createElement("section", {}, "vitals"),
}));

vi.mock("../components/EncounterEvaSection", () => ({
  default: () => React.createElement("section", {}, "eva"),
}));

vi.mock("../components/EncounterProcedures", () => ({
  default: () => React.createElement("section", {}, "procedures"),
}));

const mapperMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/patient/mappers/in-progress-encounter-detail.mapper", () => ({
  mapInProgressEncounterDetailToFormInitialValues: mapperMock,
}));

vi.mock("../data", () => ({
  getEncounterDetailData: vi.fn(),
}));

vi.mock("@/lib/patient/formatters", () => ({
  formatDateTime: () => "fecha",
  formatPatientName: () => "Ana Perez",
  formatPlannedSchedule: () => ({ plannedDateLabel: "2026-03-20", plannedTimeLabel: "10:00" }),
}));

vi.mock("@/lib/patient/formatters/encounter.formatters", () => ({
  formatEncounterVisitType: () => "Seguimiento",
  formatEncounterDuration: () => "30 min",
  getEncounterRepresentativeEnd: () => "end",
  getEncounterRepresentativeStart: () => "start",
  getEncounterStatusBadge: () => ({ label: "Estado", colorClass: "badge" }),
}));

import Page from "../page";
import { getEncounterDetailData } from "../data";

const baseData = {
  encounter: {
    id: "enc-1",
    status: "in-progress",
    episodeOfCareId: "ep-1",
    patientId: "pat-1",
    visitType: "follow-up",
    participant: null,
    periodStart: "2026-03-20T10:00:00.000Z",
    plannedDate: "2026-03-20",
    plannedTime: "10:00",
  },
  patient: {
    id: "pat-1",
    identifier: "123",
    active: true,
    name: { given: "Ana", family: "Perez" },
  },
  practitionerName: "Doc",
  vitalSigns: [],
  evaRecords: [],
  procedures: [],
  inProgressInitialValues: {
    encounterId: "enc-1",
    clinicalNote: "nota rehidratada",
    reasonDisplay: "control",
    vitalSigns: [],
    evaAssessments: [],
    procedures: [],
  },
};

describe("Encounter detail page rehydration wiring", () => {
  beforeEach(() => {
    mapperMock.mockReset();
  });

  it("in-progress: passes mapper output into FinalizeEncounterForm", async () => {
    mapperMock.mockReturnValue({
      clinicalNote: "nota mapeada",
      reasonDisplay: "control",
      procedures: [],
    });
    vi.mocked(getEncounterDetailData).mockResolvedValue(baseData as never);

    const element = await Page({
      params: Promise.resolve({ id: "pat-1", encounterId: "enc-1" }),
    });
    const html = renderToStaticMarkup(element);

    expect(mapperMock).toHaveBeenCalledWith(baseData.inProgressInitialValues);
    expect(html).toContain("finalize:nota mapeada");
  });

  it("planned: does not execute rehydration path", async () => {
    vi.mocked(getEncounterDetailData).mockResolvedValue({
      ...baseData,
      encounter: { ...baseData.encounter, status: "planned" },
      inProgressInitialValues: undefined,
    } as never);

    const element = await Page({
      params: Promise.resolve({ id: "pat-1", encounterId: "enc-1" }),
    });
    const html = renderToStaticMarkup(element);

    expect(mapperMock).not.toHaveBeenCalled();
    expect(html).toContain("planned-finalize");
    expect(html).not.toContain("finalize:");
  });

  it("finished: keeps read-only flow and does not execute rehydration", async () => {
    vi.mocked(getEncounterDetailData).mockResolvedValue({
      ...baseData,
      encounter: {
        ...baseData.encounter,
        status: "finished",
        periodEnd: "2026-03-20T10:30:00.000Z",
        durationMinutes: 30,
      },
      inProgressInitialValues: undefined,
    } as never);

    const element = await Page({
      params: Promise.resolve({ id: "pat-1", encounterId: "enc-1" }),
    });
    const html = renderToStaticMarkup(element);

    expect(mapperMock).not.toHaveBeenCalled();
    expect(html).toContain("Esta visita está finalizada");
    expect(html).not.toContain("finalize:");
  });
});
