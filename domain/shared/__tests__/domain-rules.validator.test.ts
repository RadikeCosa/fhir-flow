import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { validateEncounterRules } from "../domain-rules.validator";
import { DomainRuleError } from "../error-types";
import type { CreateEncounterInput } from "../../encounters/encounter.write-input";

function makeInput(overrides: Partial<CreateEncounterInput> = {}): CreateEncounterInput {
    return {
        patientId: "patient-1",
        practitionerName: "Lic. Ramiro Perez",
        performerId: "kine-1",
        episodeOfCareId: "episode-1",
        plannedDate: "2026-03-20",
        plannedTime: "10:00",
        visitType: "follow-up",
        reasonDisplay: "Control",
        note: "Visita planificada",
        ...overrides,
    };
}

describe("validateEncounterRules", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-20T09:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("throws when practitionerName is empty", () => {
        expect(() =>
            validateEncounterRules(makeInput({ practitionerName: "   " }))
        ).toThrowError(DomainRuleError);

        expect(() =>
            validateEncounterRules(makeInput({ practitionerName: "   " }))
        ).toThrowError("Practitioner name is required");
    });

    it("accepts valid practitionerName", () => {
        expect(() =>
            validateEncounterRules(makeInput({ practitionerName: "Lic. Maria Lopez" }))
        ).not.toThrow();
    });

    it("accepts planned date without planned time", () => {
        expect(() =>
            validateEncounterRules(makeInput({ plannedDate: "2026-03-20", plannedTime: undefined }))
        ).not.toThrow();
    });

    it("throws for invalid planned time format", () => {
        expect(() =>
            validateEncounterRules(makeInput({ plannedTime: "25:70" }))
        ).toThrowError(DomainRuleError);
    });
});
