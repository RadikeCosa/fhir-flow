/**
 * Maps a `CreateEncounterInput` into a FHIR Encounter resource payload.
 *
 * The mapper is responsible for adding required clinical references and static
 * values (status, class, performer, etc.), while the input contains only the
 * user-provided fields.
 *
 * If required references are missing, a `FhirMapperError` is thrown.
 */
import type { CreateEncounterInput } from "../../../domain/encounters/encounter.write-input";
import type { FhirEncounter } from "../schemas/encounter.schema";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { currentPractitionerId } from "../../../config/fhir.config";

export function mapToFhirEncounter(input: CreateEncounterInput): FhirEncounter {
    // Required references: patient, episode of care, and performer (from config)
    if (!input.patientId || input.patientId.trim() === "") {
        throw new FhirMapperError("Patient ID cannot be empty", "MISSING_PATIENT_ID");
    }
    if (!input.episodeOfCareId || input.episodeOfCareId.trim() === "") {
        throw new FhirMapperError("Episode of care ID cannot be empty", "MISSING_EPISODE_ID");
    }
    if (!currentPractitionerId || currentPractitionerId.trim() === "") {
        throw new FhirMapperError(
            "Performer ID (from config) cannot be empty",
            "MISSING_PERFORMER_ID"
        );
    }

    const fhirEncounter = {
        resourceType: "Encounter",
        status: "planned",
        class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "HH",
            display: "Home health",
        },
        subject: {
            reference: `Patient/${input.patientId}`,
        },
        episodeOfCare: [
            {
                reference: `EpisodeOfCare/${input.episodeOfCareId}`,
            },
        ],
        participant: [
            {
                individual: {
                    reference: `Practitioner/${currentPractitionerId}`,
                },
            },
        ],
        period: {
            start: input.plannedAt,
        },
    } as unknown as FhirEncounter;

    if (input.note && input.note.trim() !== "") {
        fhirEncounter.note = [
            {
                text: input.note,
            },
        ];
    }

    return fhirEncounter;
}
