import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Encounter } from "../../../../../../domain/encounters/encounter";

vi.mock("../EncounterCard", () => ({
    default: ({ encounter }: { encounter: Encounter }) =>
        React.createElement("div", { "data-encounter-id": encounter.id }, encounter.id),
}));

import EncounterList from "../EncounterList";

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: "enc-default",
        status: "finished",
        episodeOfCareId: "ep-1",
        patientId: "pat-1",
        visitType: "follow-up",
        participant: null,
        plannedDate: undefined,
        plannedTime: undefined,
        actualStartAt: "2026-03-10T12:00:00.000Z",
        actualEndAt: "2026-03-10T12:30:00.000Z",
        periodStart: "2026-03-10T12:00:00.000Z",
        periodEnd: "2026-03-10T12:30:00.000Z",
        durationMinutes: 30,
        reasonDisplay: "Control",
        clinicalNote: undefined,
        ...overrides,
    };
}

describe("EncounterList finished sorting", () => {
    it("sorts finished encounters by actualStartAt desc, falling back to periodStart", () => {
        const newerByActualStart = makeEncounter({
            id: "enc-newer-actual",
            actualStartAt: "2026-03-15T12:00:00.000Z",
            periodStart: "2026-03-01T12:00:00.000Z",
        });
        const olderByActualStart = makeEncounter({
            id: "enc-older-actual",
            actualStartAt: "2026-03-12T12:00:00.000Z",
            periodStart: "2026-03-20T12:00:00.000Z",
        });
        const fallbackLegacy = makeEncounter({
            id: "enc-fallback-period",
            actualStartAt: undefined,
            periodStart: "2026-03-14T12:00:00.000Z",
        });

        const html = renderToStaticMarkup(
            React.createElement(EncounterList, {
                encounters: [olderByActualStart, fallbackLegacy, newerByActualStart],
                proceduresByEncounterId: {},
                vitalsByEncounterId: {},
                evaByEncounterId: {},
            })
        );

        const newerIdx = html.indexOf("enc-newer-actual");
        const fallbackIdx = html.indexOf("enc-fallback-period");
        const olderIdx = html.indexOf("enc-older-actual");

        expect(newerIdx).toBeGreaterThanOrEqual(0);
        expect(fallbackIdx).toBeGreaterThanOrEqual(0);
        expect(olderIdx).toBeGreaterThanOrEqual(0);
        expect(newerIdx).toBeLessThan(fallbackIdx);
        expect(fallbackIdx).toBeLessThan(olderIdx);
    });

    it("renders in-progress encounters in their own bucket", () => {
        const inProgress = makeEncounter({
            id: "enc-in-progress",
            status: "in-progress",
            actualStartAt: "2026-03-16T08:00:00.000Z",
            periodStart: "2026-03-16T08:00:00.000Z",
        });
        const finished = makeEncounter({
            id: "enc-finished",
            status: "finished",
            actualStartAt: "2026-03-15T08:00:00.000Z",
            periodStart: "2026-03-15T08:00:00.000Z",
        });

        const html = renderToStaticMarkup(
            React.createElement(EncounterList, {
                encounters: [finished, inProgress],
                proceduresByEncounterId: {},
                vitalsByEncounterId: {},
                evaByEncounterId: {},
            })
        );

        expect(html).toContain("En curso");
        expect(html).toContain("Sesiones anteriores");
        expect(html.indexOf("En curso")).toBeLessThan(html.indexOf("Sesiones anteriores"));
    });

    it("keeps planned encounters in base input while rendering only the first planned card + summary", () => {
        const plannedFirst = makeEncounter({
            id: "enc-planned-first",
            status: "planned",
            plannedDate: "2026-03-21",
            plannedTime: "09:00",
            periodStart: "2026-03-21T09:00:00.000Z",
        });
        const plannedSecond = makeEncounter({
            id: "enc-planned-second",
            status: "planned",
            plannedDate: "2026-03-22",
            plannedTime: "09:00",
            periodStart: "2026-03-22T09:00:00.000Z",
        });
        const finished = makeEncounter({
            id: "enc-finished-context",
            status: "finished",
            actualStartAt: "2026-03-20T09:00:00.000Z",
            periodStart: "2026-03-20T09:00:00.000Z",
        });

        const baseCollection = [plannedFirst, plannedSecond, finished];
        const html = renderToStaticMarkup(
            React.createElement(EncounterList, {
                encounters: baseCollection,
                proceduresByEncounterId: {},
                vitalsByEncounterId: {},
                evaByEncounterId: {},
            })
        );

        expect(baseCollection.map((encounter) => encounter.id)).toContain(plannedFirst.id);
        expect(baseCollection.map((encounter) => encounter.id)).toContain(plannedSecond.id);
        expect(html).toContain("enc-planned-first");
        expect(html).not.toContain("enc-planned-second");
        expect(html).toContain("+ 1 sesión más programada");
    });
});
