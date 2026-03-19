import { describe, expect, it } from "vitest";

import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";
import { mapToFhirVitalSignObservations } from "../vital-sign-record.write.mapper";

function makeInput(overrides: Partial<FinalizeEncounterInput> = {}): FinalizeEncounterInput {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        periodStart: "2026-03-20T10:00:00.000Z",
        periodEnd: "2026-03-20T11:00:00.000Z",
        clinicalNote: "Paciente estable. Se finaliza visita.",
        reasonDisplay: "Control programado",
        procedures: [],
        ...overrides,
    };
}

describe("mapToFhirVitalSignObservations", () => {
    it("adds the vital-signs category to every generated observation without changing core references", () => {
        const result = mapToFhirVitalSignObservations(
            makeInput({
                heartRate: 78,
                respiratoryRate: 18,
                oxygenSaturation: 97,
                bodyTemperature: 36.8,
                bloodPressureSystolic: 120,
                bloodPressureDiastolic: 80,
            })
        ) as Array<{ resource: Record<string, unknown> }>;

        expect(result).toHaveLength(5);

        for (const entry of result) {
            expect(entry.resource).toMatchObject({
                resourceType: "Observation",
                status: "final",
                category: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                                code: "vital-signs",
                                display: "Vital Signs",
                            },
                        ],
                    },
                ],
                subject: {
                    reference: "Patient/patient-1",
                },
                encounter: {
                    reference: "Encounter/enc-123",
                },
                performer: [
                    {
                        reference: "Practitioner/prac-1",
                        display: "Lic. Ramiro Perez",
                    },
                ],
                effectiveDateTime: "2026-03-20T11:00:00.000Z",
            });
        }
    });
});
