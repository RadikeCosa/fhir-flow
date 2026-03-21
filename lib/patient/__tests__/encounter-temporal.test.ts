import { describe, expect, it } from "vitest";

import {
    getEncounterRepresentativeEnd,
    getEncounterRepresentativeStart,
} from "../formatters/encounter.formatters";

describe("encounter temporal compatibility", () => {
    it("uses actual start/end for finished when available", () => {
        const encounter = {
            status: "finished" as const,
            actualStartAt: "2026-03-22T17:30:00.000Z",
            actualEndAt: "2026-03-22T18:00:00.000Z",
            periodStart: "2026-03-10T10:00:00.000Z",
            periodEnd: "2026-03-10T10:30:00.000Z",
        };

        expect(getEncounterRepresentativeStart(encounter)).toBe(
            "2026-03-22T17:30:00.000Z",
        );
        expect(getEncounterRepresentativeEnd(encounter)).toBe(
            "2026-03-22T18:00:00.000Z",
        );
    });

    it("falls back to period aliases for finished legacy resources", () => {
        const encounter = {
            status: "finished" as const,
            actualStartAt: undefined,
            actualEndAt: undefined,
            periodStart: "2026-03-10T10:00:00.000Z",
            periodEnd: "2026-03-10T10:30:00.000Z",
        };

        expect(getEncounterRepresentativeStart(encounter)).toBe(
            "2026-03-10T10:00:00.000Z",
        );
        expect(getEncounterRepresentativeEnd(encounter)).toBe(
            "2026-03-10T10:30:00.000Z",
        );
    });

    it("returns period fields for non-finished states", () => {
        const encounter = {
            status: "planned" as const,
            actualStartAt: "2026-03-22T17:30:00.000Z",
            actualEndAt: "2026-03-22T18:00:00.000Z",
            periodStart: "2026-03-25",
            periodEnd: undefined,
        };

        expect(getEncounterRepresentativeStart(encounter)).toBe("2026-03-25");
        expect(getEncounterRepresentativeEnd(encounter)).toBeUndefined();
    });
});