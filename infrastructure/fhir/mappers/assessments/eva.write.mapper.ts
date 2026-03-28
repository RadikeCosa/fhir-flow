/**
 * Build a FHIR Observation entry for EVA score if present.
 * Pure mapper: no side effects.
 */
import type {
    ClinicalResourceContext,
    PersistableClinicalPayload,
} from "../shared/persistable-clinical-payload";

type EvaObservationInput = ClinicalResourceContext &
    {
        effectiveDateTime?: string;
        actualEndAt?: string;
    } &
    Pick<PersistableClinicalPayload, "evaScore">;

export function mapToFhirEvaObservation(input: EvaObservationInput): unknown | null {
    if (typeof input.evaScore !== "number") {
        return null;
    }

    const effectiveDateTime = input.effectiveDateTime ?? input.actualEndAt;

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
            effectiveDateTime,
        },
    };

    return observation;
}
