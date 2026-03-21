import { describe, expect, it } from "vitest";

import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";
import { mapToFhirEncounterUpdate } from "../encounter.finalize.mapper";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../../lib/fhir/systems";

function makeInput(
    overrides: Partial<FinalizeEncounterInput> = {}
): FinalizeEncounterInput {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        visitType: "follow-up",
        actualStartAt: "2026-03-20T10:00:00.000Z",
        actualEndAt: "2026-03-20T11:00:00.000Z",
        clinicalNote: "Paciente estable. Se finaliza visita.",
        reasonDisplay: "Control programado",
        procedures: [],
        ...overrides,
    };
}

describe("mapToFhirEncounterUpdate", () => {
    it("preserves the clinical references required by the PUT payload", () => {
        const result = mapToFhirEncounterUpdate(makeInput()) as {
            resource: Record<string, unknown>;
        };

        expect(result.resource).toMatchObject({
            resourceType: "Encounter",
            id: "enc-123",
            status: "finished",
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "HH",
                display: "Home health",
            },
            type: [
                {
                    coding: [
                        {
                            code: "follow-up",
                            display: "Visita de seguimiento",
                        },
                    ],
                },
            ],
            subject: {
                reference: "Patient/patient-1",
            },
            episodeOfCare: [
                {
                    reference: "EpisodeOfCare/episode-1",
                },
            ],
            participant: [
                {
                    individual: {
                        reference: "Practitioner/prac-1",
                        display: "Lic. Ramiro Perez",
                    },
                },
            ],
            period: {
                start: "2026-03-20T10:00:00.000Z",
                end: "2026-03-20T11:00:00.000Z",
            },
            reasonCode: [
                {
                    text: "Control programado",
                },
            ],
            note: [
                {
                    text: "Paciente estable. Se finaliza visita.",
                },
            ],
            extension: [
                {
                    url: CLINICAL_NOTE_EXTENSION_URL,
                    valueString: "Paciente estable. Se finaliza visita.",
                },
            ],
        });
    });

    it("omits optional narrative fields when they are blank", () => {
        const result = mapToFhirEncounterUpdate(
            makeInput({
                clinicalNote: "   ",
                reasonDisplay: "",
            })
        ) as { resource: Record<string, unknown> };

        expect(result.resource.reasonCode).toBeUndefined();
        expect(result.resource.note).toBeUndefined();
        expect(result.resource.extension).toBeUndefined();
    });

    it("preserves the original visit type in the PUT payload", () => {
        const result = mapToFhirEncounterUpdate(
            makeInput({
                visitType: "discharge",
            })
        ) as { resource: Record<string, unknown> };

        expect(result.resource.type).toEqual([
            {
                coding: [
                    {
                        code: "discharge",
                        display: "Alta",
                    },
                ],
            },
        ]);
    });
});
