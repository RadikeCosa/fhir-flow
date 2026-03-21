import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import EncounterCard from "../EncounterCard";
import type { Encounter } from "../../../../../../domain/encounters/encounter";

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

describe("EncounterCard planned render", () => {
    it("renders planned date and time in title", () => {
        const html = renderToStaticMarkup(
            React.createElement(EncounterCard, {
                encounter: makePlannedEncounter(),
                procedures: [],
                vitalSigns: [],
                evaRecords: [],
                barthelAssessment: null,
                necpalAssessment: null,
                ecogAssessment: null,
            })
        );

        expect(html).toContain("22/03/2026");
        expect(html).toContain("14:30");
        expect(html).not.toContain("2099");
    });

    it("renders 'Sin horario definido' when planned time is absent", () => {
        const html = renderToStaticMarkup(
            React.createElement(EncounterCard, {
                encounter: makePlannedEncounter({ plannedTime: undefined }),
                procedures: [],
                vitalSigns: [],
                evaRecords: [],
                barthelAssessment: null,
                necpalAssessment: null,
                ecogAssessment: null,
            })
        );

        expect(html).toContain("22/03/2026");
        expect(html).toContain("Sin horario definido");
    });
});
