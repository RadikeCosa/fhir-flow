/**
 * Build a FHIR Observation entry for EVA score if present.
 * Pure mapper: no side effects.
 */
import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";

type EvaPayload = Pick<FinalizeEncounterInput, "evaScore">;
type EvaContext = Pick<
    FinalizeEncounterInput,
    "encounterId" | "patientId" | "performerId" | "practitionerName" | "actualEndAt"
>;
export type EvaResourceInput = EvaContext & EvaPayload;

export function mapToFhirEvaObservation(input: EvaResourceInput): unknown | null {
    if (typeof input.evaScore !== "number") {
        return null;
    }

    const observation = {
        request: {
            method: "POST",
            url: "Observation",
        },
        resource: {
            resourceType: "Observation",
            status: "final",
            category: [
                {
                    coding: [
                        {
                            system: "http://terminology.hl7.org/CodeSystem/observation-category",
                            code: "survey",
                            display: "Survey",
                        },
                    ],
                },
            ],
            code: {
                coding: [
                    {
                        system: "http://loinc.org",
                        code: "72514-3",
                        display: "Pain severity",
                    },
                ],
            },
            valueInteger: input.evaScore,
            subject: {
                reference: `Patient/${input.patientId}`,
            },
            encounter: {
                reference: `Encounter/${input.encounterId}`,
            },
            performer: [
                {
                    reference: `Practitioner/${input.performerId}`,
                    display: input.practitionerName,
                },
            ],
            effectiveDateTime: input.actualEndAt,
        },
    };

    return observation;
}
