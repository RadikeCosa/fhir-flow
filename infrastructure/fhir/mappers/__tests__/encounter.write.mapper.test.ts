import { afterEach, describe, expect, it, vi } from "vitest";

import type { CreateEncounterInput } from "../../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../../domain/shared/error-types";

const ORIGINAL_ENV = { ...process.env };

async function loadMapperModule() {
    vi.resetModules();
    return import("../encounter.write.mapper");
}

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
});

function makeInput(overrides: Partial<CreateEncounterInput> = {}): CreateEncounterInput {
    return {
        patientId: "patient-1",
        practitionerName: "Lic. Ramiro Perez",
        performerId: "kine-1",
        episodeOfCareId: "episode-1",
        plannedAt: "2026-03-20T10:00:00.000Z",
        visitType: "follow-up",
        reasonDisplay: "Control programado",
        note: "Paciente estable",
        ...overrides,
    };
}

describe("mapToFhirEncounter", () => {
    it("writes practitioner display in participant individual", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        const { mapToFhirEncounter } = await loadMapperModule();
        const result = mapToFhirEncounter(makeInput());

        expect(result.participant?.[0]?.individual?.display).toBe("Lic. Ramiro Perez");
    });


    it("throws a typed error when performerId is blank", async () => {
        const { mapToFhirEncounter } = await loadMapperModule();

        expect(() => mapToFhirEncounter(makeInput({ performerId: "   " }))).toThrowError(
            new FhirMapperError(
                "Performer ID (from server action) cannot be empty",
                "MISSING_PERFORMER_ID"
            )
        );
    });

    it("throws a typed error when patientId is blank", async () => {
        const { mapToFhirEncounter } = await loadMapperModule();

        expect(() => mapToFhirEncounter(makeInput({ patientId: "" }))).toThrowError(
            new FhirMapperError("Patient ID cannot be empty", "MISSING_PATIENT_ID")
        );
    });

    it("throws a typed error when episodeOfCareId is blank", async () => {
        const { mapToFhirEncounter } = await loadMapperModule();

        expect(() =>
            mapToFhirEncounter(makeInput({ episodeOfCareId: "   " }))
        ).toThrowError(
            new FhirMapperError(
                "Episode of care ID cannot be empty",
                "MISSING_EPISODE_ID"
            )
        );
    });

    it("throws when practitionerName is blank", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        const { mapToFhirEncounter } = await loadMapperModule();

        expect(() =>
            mapToFhirEncounter(makeInput({ practitionerName: "   " }))
        ).toThrowError("Performer name (from server action) cannot be empty");
    });
});
