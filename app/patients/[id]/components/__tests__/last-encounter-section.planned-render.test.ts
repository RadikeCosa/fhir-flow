import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Encounter } from "../../../../../domain/encounters/encounter";

vi.mock("@/app/patients/components/SectionCard", () => ({
    SectionCard: ({ title, children }: { title: string; children: React.ReactNode }) =>
        React.createElement("section", {}, [
            React.createElement("h2", { key: "title" }, title),
            children,
        ]),
}));

vi.mock("@/lib/patient/formatters", () => ({
    formatDate: (value?: string) => {
        if (value === "2026-03-22") return "22/03/2026";
        return value;
    },
    formatDateTime: (value?: string) => value,
    formatPlannedSchedule: (plannedDate?: string, plannedTime?: string) => ({
        plannedDateLabel: plannedDate === "2026-03-22" ? "22/03/2026" : plannedDate,
        plannedTimeLabel: plannedTime || "Sin horario definido",
    }),
}));

vi.mock("@/lib/patient/formatters/encounter.formatters", () => ({
    formatEncounterDuration: () => "",
    getEncounterRepresentativeStart: (encounter: Encounter) =>
        encounter.status === "finished"
            ? (encounter.actualStartAt ?? encounter.periodStart)
            : encounter.periodStart,
}));

vi.mock("@/app/patients/[id]/encounters/components/EncounterBadgesRow", () => ({
    default: () => React.createElement("div", {}, "badges"),
}));

vi.mock("@/app/patients/[id]/encounters/components/EncounterClinicalNote", () => ({
    default: () => React.createElement("div", {}, "note"),
}));

vi.mock("@/app/patients/[id]/encounters/components/EncounterVitalSignsSection", () => ({
    default: () => React.createElement("div", {}, "vitals"),
}));

vi.mock("@/app/patients/[id]/encounters/components/EncounterEvaSection", () => ({
    default: () => React.createElement("div", {}, "eva"),
}));

vi.mock("@/app/patients/[id]/encounters/components/EncounterProcedures", () => ({
    default: () => React.createElement("div", {}, "procedures"),
}));

import { LastEncounterSection } from "../LastEncounterSection";

vi.mock("next/link", () => ({
    default: ({ href, children }: { href: string; children: React.ReactNode }) =>
        React.createElement("a", { href }, children),
}));

function makePlannedEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: "enc-planned-1",
        status: "planned",
        episodeOfCareId: "ep-1",
        patientId: "pat-1",
        visitType: "follow-up",
        participant: null,
        plannedDate: "2026-03-22",
        plannedTime: "14:30",
        actualStartAt: undefined,
        actualEndAt: undefined,
        periodStart: "2099-01-01T10:00:00.000Z",
        periodEnd: undefined,
        durationMinutes: undefined,
        reasonDisplay: "Control",
        clinicalNote: undefined,
        ...overrides,
    };
}

describe("LastEncounterSection planned render", () => {
    it("renders planned date and planned time from explicit fields", () => {
        const html = renderToStaticMarkup(
            React.createElement(LastEncounterSection, {
                lastEncounter: null,
                nextPlannedEncounter: makePlannedEncounter(),
                patientId: "pat-1",
                procedures: [],
                evaRecords: [],
                vitalSigns: [],
            })
        );

        expect(html).toContain("PRÓXIMA VISITA");
        expect(html).toContain("22/03/2026");
        expect(html).toContain("14:30");
        expect(html).not.toContain("Abrir detalle clínico");
        expect(html).toContain('href="/patients/pat-1/encounters"');
        expect(html).not.toContain("2099");
        expect(html).toContain("No hay visitas registradas en el episodio activo");
    });

    it("renders 'Sin horario definido' when plannedTime is missing", () => {
        const html = renderToStaticMarkup(
            React.createElement(LastEncounterSection, {
                lastEncounter: null,
                nextPlannedEncounter: makePlannedEncounter({ plannedTime: undefined }),
                patientId: "pat-1",
                procedures: [],
                evaRecords: [],
                vitalSigns: [],
            })
        );

        expect(html).toContain("22/03/2026");
        expect(html).toContain("Sin horario definido");
        expect(html).toContain("No hay visitas registradas en el episodio activo");
    });

    it("renders encounter-summary empty state when there is no last encounter and no planned encounter", () => {
        const html = renderToStaticMarkup(
            React.createElement(LastEncounterSection, {
                lastEncounter: null,
                nextPlannedEncounter: null,
                patientId: "pat-1",
                procedures: [],
                evaRecords: [],
                vitalSigns: [],
            })
        );

        expect(html).toContain("No hay visitas registradas en el episodio activo");
        expect(html).toContain("Visita relevante");
    });
});
