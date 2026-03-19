import { describe, expect, it } from "vitest";

import { validateEncounterRules } from "../domain-rules.validator";
import { DomainRuleError } from "../error-types";
import type { CreateEncounterInput } from "../../encounters/encounter.write-input";

function makeInput(overrides: Partial<CreateEncounterInput> = {}): CreateEncounterInput {
    return {
        patientId: "patient-1",
        practitionerName: "Lic. Ramiro Perez",
        performerId: "kine-1",
        episodeOfCareId: "episode-1",
        plannedAt: "2026-03-20T10:00:00.000Z",
        visitType: "follow-up",
        reasonDisplay: "Control",
        note: "Visita planificada",
        ...overrides,
    };
}

describe("validateEncounterRules", () => {
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
});
