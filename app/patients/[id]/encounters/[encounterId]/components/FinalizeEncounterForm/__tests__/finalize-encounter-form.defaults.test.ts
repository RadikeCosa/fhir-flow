import { describe, expect, it, vi } from "vitest";
import {
    buildFinalizeEncounterFormDefaultValues,
    resolveInitialActualDate,
    resolveInitialActualTiming,
} from "../finalize-encounter-form.defaults";

describe("finalize-encounter-form.defaults", () => {
    it("uses plannedDate as initial actualDate when available", () => {
        const now = new Date("2026-03-21T12:00:00.000Z");
        const result = resolveInitialActualDate("2026-03-20", now);
        expect(result).toBe("2026-03-20");
    });

    it("uses today when plannedDate is missing", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-21T12:00:00.000Z"));

        const result = resolveInitialActualDate(undefined);
        expect(result).toBe("2026-03-21");

        vi.useRealTimers();
    });

    it("uses persisted actual start as finalize temporal reference", () => {
        const result = resolveInitialActualTiming("2026-03-21T13:30:00.000Z", "2026-03-20");

        expect(result).toEqual({
            actualDate: "2026-03-21",
            actualStartTime: "10:30",
        });
    });

    it("falls back to planned context when persisted start is missing", () => {
        const now = new Date("2026-03-21T12:00:00.000Z");
        const result = resolveInitialActualTiming(undefined, "2026-03-20", now);

        expect(result).toEqual({
            actualDate: "2026-03-20",
            actualStartTime: "",
        });
    });

    it("builds default form values with in-progress clinical initial values", () => {
        const defaults = buildFinalizeEncounterFormDefaultValues(
            {
                actualDate: "2026-03-21",
                actualStartTime: "10:30",
            },
            {
                clinicalNote: "Nota previa",
                reasonDisplay: "Dolor lumbar",
                evaScore: 5,
                heartRate: 84,
                respiratoryRate: 18,
                oxygenSaturation: 96,
                bodyTemperature: 36.5,
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80,
                procedures: [
                    {
                        category: "fisioterapia",
                        code: "laser",
                        bodySite: "lumbar",
                        note: "sin eventos",
                    },
                ],
            }
        );

        expect(defaults).toEqual({
            actualDate: "2026-03-21",
            actualStartTime: "10:30",
            actualEndTime: "",
            clinicalNote: "Nota previa",
            reasonDisplay: "Dolor lumbar",
            evaScore: 5,
            heartRate: 84,
            respiratoryRate: 18,
            oxygenSaturation: 96,
            bodyTemperature: 36.5,
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 80,
            procedures: [
                {
                    category: "fisioterapia",
                    code: "laser",
                    bodySite: "lumbar",
                    note: "sin eventos",
                },
            ],
        });
    });

    it("keeps missing persisted fields as missing in partial rehydration", () => {
        const defaults = buildFinalizeEncounterFormDefaultValues(
            {
                actualDate: "2026-03-21",
                actualStartTime: "10:30",
            },
            {
                clinicalNote: "Solo nota",
                reasonDisplay: "",
                procedures: [],
            }
        );

        expect(defaults).toEqual({
            actualDate: "2026-03-21",
            actualStartTime: "10:30",
            actualEndTime: "",
            clinicalNote: "Solo nota",
            reasonDisplay: "",
            evaScore: undefined,
            bloodPressureSystolic: undefined,
            bloodPressureDiastolic: undefined,
            heartRate: undefined,
            respiratoryRate: undefined,
            oxygenSaturation: undefined,
            bodyTemperature: undefined,
            procedures: [],
        });
    });

});
