import { afterEach, describe, expect, it, vi } from "vitest";

import type { CreateEncounterInput } from "../../../../domain/encounters/encounter.write-input";

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
        process.env.CURRENT_PRACTITIONER_ID = "kine-1";

        const { mapToFhirEncounter } = await loadMapperModule();
        const result = mapToFhirEncounter(makeInput());

        expect(result.participant?.[0]?.individual?.display).toBe("Lic. Ramiro Perez");
    });

    it("throws when practitionerName is blank", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        process.env.CURRENT_PRACTITIONER_ID = "kine-1";

        const { mapToFhirEncounter } = await loadMapperModule();

        expect(() =>
            mapToFhirEncounter(makeInput({ practitionerName: "   " }))
        ).toThrowError("Performer name (from server action) cannot be empty");
    });
});
