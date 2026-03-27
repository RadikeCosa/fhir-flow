import { describe, expect, it } from "vitest";
import type { FinalizeEncounterInput } from "../../../../../domain/encounters/encounter.write-input";
import { mapToFhirEvaObservation } from "../assessments/eva.write.mapper";

const buildInput = (
    overrides: Partial<FinalizeEncounterInput> = {}
): FinalizeEncounterInput => ({
    encounterId: "enc-1",
    patientId: "pat-1",
    episodeOfCareId: "ep-1",
    performerId: "prac-1",
    practitionerName: "Dr. X",
    visitType: "follow-up",
    actualStartAt: "2026-03-20T10:00:00.000Z",
    actualEndAt: "2026-03-20T11:00:00.000Z",
    clinicalNote: "Nota",
    procedures: [],
    ...overrides,
});

describe("mapToFhirEvaObservation", () => {
    it("returns null when evaScore is undefined", () => {
        const result = mapToFhirEvaObservation(buildInput());

        expect(result).toBeNull();
    });

    it("maps valid evaScore into FHIR Observation with effectiveDateTime equal to actualEndAt", () => {
        const input = buildInput({ evaScore: 7 });

        const result = mapToFhirEvaObservation(input);

        expect(result).toBeTypeOf("object");
        expect(result).toHaveProperty("resource.valueInteger", 7);
        expect(result).toHaveProperty("resource.effectiveDateTime", input.actualEndAt);
        expect(result).toHaveProperty("resource.subject.reference", `Patient/${input.patientId}`);
        expect(result).toHaveProperty("resource.encounter.reference", `Encounter/${input.encounterId}`);
    });
});
