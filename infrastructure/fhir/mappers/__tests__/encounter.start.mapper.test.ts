import { describe, expect, it } from "vitest";
import { mapToStartedEncounterUpdate } from "../encounter.start.mapper";
import type { FhirEncounter } from "../../schemas/encounter.schema";
import { FhirMapperError } from "../../../../domain/shared/error-types";

describe("mapToStartedEncounterUpdate", () => {
    it("transitions encounter to in-progress and sets actual period.start without period.end", () => {
        const input: FhirEncounter = {
            resourceType: "Encounter",
            id: "enc-123",
            status: "planned",
            subject: { reference: "Patient/patient-1" },
            episodeOfCare: [{ reference: "EpisodeOfCare/episode-1" }],
            participant: [
                {
                    individual: {
                        reference: "Practitioner/prac-1",
                        display: "Lic. Ramiro Perez",
                    },
                },
            ],
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "HH",
                display: "Home health",
            },
            type: [
                {
                    coding: [{ code: "follow-up", display: "Visita de seguimiento" }],
                },
            ],
            reasonCode: [{ text: "Control programado" }],
            note: [{ text: "Nota original" }],
            extension: [{ url: "http://example.org/ext", valueString: "valor" }],
            period: {
                start: "2026-03-20T10:00:00.000Z",
                end: "2026-03-20T11:00:00.000Z",
            },
        };

        const result = mapToStartedEncounterUpdate(
            input,
            "2026-03-21T12:00:00.000Z"
        );

        expect(result).toMatchObject({
            resourceType: "Encounter",
            id: "enc-123",
            status: "in-progress",
            subject: { reference: "Patient/patient-1" },
            episodeOfCare: [{ reference: "EpisodeOfCare/episode-1" }],
            participant: [
                {
                    individual: {
                        reference: "Practitioner/prac-1",
                        display: "Lic. Ramiro Perez",
                    },
                },
            ],
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "HH",
                display: "Home health",
            },
            type: [
                {
                    coding: [{ code: "follow-up", display: "Visita de seguimiento" }],
                },
            ],
            reasonCode: [{ text: "Control programado" }],
            note: [{ text: "Nota original" }],
            extension: [{ url: "http://example.org/ext", valueString: "valor" }],
            period: {
                start: "2026-03-21T12:00:00.000Z",
            },
        });

        expect(result.period?.end).toBeUndefined();
    });

    it("throws when required preserved fields are missing", () => {
        const input: FhirEncounter = {
            resourceType: "Encounter",
            id: "enc-123",
            status: "planned",
            period: {
                start: "2026-03-20T10:00:00.000Z",
            },
        };

        expect(() =>
            mapToStartedEncounterUpdate(input, "2026-03-21T12:00:00.000Z")
        ).toThrowError(FhirMapperError);
    });
});
