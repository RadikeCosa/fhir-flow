import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import EncounterCard from "../EncounterCard";
import type { Encounter } from "../../../../../../domain/encounters/encounter";

function makeFinishedEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: "enc-finished-1",
        status: "finished",
        episodeOfCareId: "ep-1",
        patientId: "pat-1",
        visitType: "follow-up",
        participant: null,
        plannedDate: "2026-03-21",
        plannedTime: "10:00",
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

describe("EncounterCard finished render", () => {
    it("renders finished title using actualStartAt", () => {
        const html = renderToStaticMarkup(
            React.createElement(EncounterCard, {
                encounter: makeFinishedEncounter(),
                procedures: [],
                vitalSigns: [],
                evaRecords: [],
                barthelAssessment: null,
                necpalAssessment: null,
                ecogAssessment: null,
            })
        );

        expect(html).toContain("22/03/2026");
        expect(html).not.toContain("10/03/2026");
    });

    it("falls back to periodStart when actualStartAt is missing", () => {
        const html = renderToStaticMarkup(
            React.createElement(EncounterCard, {
                encounter: makeFinishedEncounter({
                    actualStartAt: undefined,
                    periodStart: "2026-03-11T10:00:00.000Z",
                }),
                procedures: [],
                vitalSigns: [],
                evaRecords: [],
                barthelAssessment: null,
                necpalAssessment: null,
                ecogAssessment: null,
            })
        );

        expect(html).toContain("11/03/2026");
    });
});
