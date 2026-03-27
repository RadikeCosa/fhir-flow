import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    validateEncounterRules,
    validateFinalizeEncounterRules,
    validateFinalizeEncounterStatus,
    validateStartEncounterStatus,
} from "../domain-rules.validator";
import { DomainRuleError } from "../error-types";
import type {
    CreateEncounterInput,
    FinalizeEncounterInput,
} from "../../encounters/encounter.write-input";

function makeInput(overrides: Partial<CreateEncounterInput> = {}): CreateEncounterInput {
    return {
        patientId: "patient-1",
        practitionerName: "Lic. Ramiro Perez",
        performerId: "kine-1",
        episodeOfCareId: "episode-1",
        plannedSchedule: {
            kind: "datetime",
            plannedDate: "2026-03-20",
            plannedTime: "10:00",
            plannedAtUtc: "2026-03-20T13:00:00.000Z",
        },
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
            validateEncounterRules(
                makeInput({
                    plannedSchedule: {
                        kind: "date",
                        plannedDate: "2026-03-20",
                    },
                })
            )
        ).not.toThrow();
    });

    it("throws for invalid planned datetime payload", () => {
        expect(() =>
            validateEncounterRules(
                makeInput({
                    plannedSchedule: {
                        kind: "datetime",
                        plannedDate: "2026-03-20",
                        plannedTime: "10:00",
                        plannedAtUtc: "invalid",
                    },
                })
            )
        ).toThrowError(DomainRuleError);
    });
});

describe("validateFinalizeEncounterRules", () => {
    function makeFinalize(overrides: Partial<FinalizeEncounterInput> = {}): FinalizeEncounterInput {
        return {
            encounterId: "enc-1",
            patientId: "pat-1",
            actualStartAt: "2026-03-20T10:00:00.000Z",
            actualEndAt: "2026-03-20T11:00:00.000Z",
            clinicalNote: "Nota clínica",
            evaScore: 5,
            procedures: [],
            ...overrides,
        } as FinalizeEncounterInput;
    }

    it("rejects non-integer EVA value", () => {
        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ evaScore: 4.5 as unknown as number }))
        ).toThrowError(DomainRuleError);
    });

    it("rejects EVA out of range", () => {
        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ evaScore: 11 }))
        ).toThrowError(DomainRuleError);
    });

    it("rejects incomplete blood pressure", () => {
        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ bloodPressureSystolic: 120, bloodPressureDiastolic: undefined }))
        ).toThrowError(DomainRuleError);

        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ bloodPressureSystolic: undefined, bloodPressureDiastolic: 80 }))
        ).toThrowError(DomainRuleError);
    });

    it("rejects diastolic >= systolic", () => {
        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ bloodPressureSystolic: 100, bloodPressureDiastolic: 110 }))
        ).toThrowError(DomainRuleError);
    });

    it("accepts valid finalize input", () => {
        expect(() =>
            validateFinalizeEncounterRules(makeFinalize({ bloodPressureSystolic: 120, bloodPressureDiastolic: 80, evaScore: 3 }))
        ).not.toThrow();
    });
});

describe("validateFinalizeEncounterStatus", () => {
    it("accepts in-progress encounters", () => {
        expect(() => validateFinalizeEncounterStatus("in-progress")).not.toThrow();
    });

    it.each(["planned", "finished", "cancelled"] as const)(
        "rejects %s encounters",
        (status) => {
            expect(() => validateFinalizeEncounterStatus(status)).toThrowError(
                "Solo se puede finalizar un encuentro en curso"
            );
        }
    );
});

describe("validateStartEncounterStatus", () => {
    it("accepts planned encounters", () => {
        expect(() => validateStartEncounterStatus("planned")).not.toThrow();
    });

    it("rejects in-progress encounters with a specific message", () => {
        expect(() => validateStartEncounterStatus("in-progress")).toThrowError(
            "Encounter is already in progress"
        );
    });

    it("rejects non-planned statuses", () => {
        expect(() => validateStartEncounterStatus("finished")).toThrowError(
            "Only planned encounters can be started"
        );
    });
});
