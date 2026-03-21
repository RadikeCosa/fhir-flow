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
    formatDateTime: (value?: string) => {
        if (value === "2026-03-22T17:30:00.000Z") return "22/03/2026 14:30";
        if (value === "2026-03-10T10:00:00.000Z") return "10/03/2026 07:00";
        return value;
    },
    formatPlannedSchedule: (plannedDate?: string, plannedTime?: string) => ({
        plannedDateLabel: plannedDate,
        plannedTimeLabel: plannedTime || "Sin horario definido",
    }),
}));

vi.mock("@/lib/patient/formatters/encounter.formatters", () => ({
    formatEncounterDuration: (value?: number) =>
        typeof value === "number" ? `${value} min` : null,
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

vi.mock("next/link", () => ({
    default: ({ href, children }: { href: string; children: React.ReactNode }) =>
        React.createElement("a", { href }, children),
}));

import { LastEncounterSection } from "../LastEncounterSection";

function makeFinishedEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: "enc-finished-1",
        status: "finished",
        episodeOfCareId: "ep-1",
        patientId: "pat-1",
        visitType: "follow-up",
        participant: null,
        plannedDate: undefined,
        plannedTime: undefined,
        actualStartAt: "2026-03-22T17:30:00.000Z",
        actualEndAt: "2026-03-22T18:00:00.000Z",
        periodStart: "2026-03-10T10:00:00.000Z",
        periodEnd: "2026-03-10T10:30:00.000Z",
        durationMinutes: 30,
        reasonDisplay: "Control",
        clinicalNote: undefined,
        ...overrides,
    };
}

describe("LastEncounterSection finished render", () => {
    it("renders last encounter timestamp from actualStartAt", () => {
        const html = renderToStaticMarkup(
            React.createElement(LastEncounterSection, {
                lastEncounter: makeFinishedEncounter(),
                nextPlannedEncounter: null,
                patientId: "pat-1",
                procedures: [],
                evaRecords: [],
                vitalSigns: [],
            })
        );

        expect(html).toContain("ÚLTIMA VISITA");
        expect(html).toContain("22/03/2026 14:30");
        expect(html).toContain("30 min");
        expect(html).not.toContain("10/03/2026 07:00");
    });

    it("falls back to periodStart when actualStartAt is missing", () => {
        const html = renderToStaticMarkup(
            React.createElement(LastEncounterSection, {
                lastEncounter: makeFinishedEncounter({ actualStartAt: undefined }),
                nextPlannedEncounter: null,
                patientId: "pat-1",
                procedures: [],
                evaRecords: [],
                vitalSigns: [],
            })
        );

        expect(html).toContain("10/03/2026 07:00");
    });
});
