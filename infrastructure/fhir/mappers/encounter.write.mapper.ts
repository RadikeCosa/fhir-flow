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
import { FhirMapperError } from "../../../domain/shared/error-types";
import type { FhirResource } from "../../../lib/fhir/fhir-client";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../lib/fhir/systems";
import { formatEncounterVisitType } from "../../../lib/patient/formatters/encounter.formatters";

type EncounterWritePayload = FhirResource & {
    resourceType: "Encounter";
    participant?: Array<{
        individual?: {
            reference?: string;
            display?: string;
        };
    }>;
    reasonCode?: Array<{
        text: string;
    }>;
    extension?: Array<{
        url: string;
        valueString: string;
    }>;
    note?: Array<{
        text: string;
    }>;
};

export function mapToFhirEncounter(input: CreateEncounterInput): EncounterWritePayload {
    // Required references: patient, episode of care, and performer (from config)
    if (!input.patientId || input.patientId.trim() === "") {
        throw new FhirMapperError("Patient ID cannot be empty", "MISSING_PATIENT_ID");
    }
    if (!input.episodeOfCareId || input.episodeOfCareId.trim() === "") {
        throw new FhirMapperError("Episode of care ID cannot be empty", "MISSING_EPISODE_ID");
    }
    if (!input.performerId || input.performerId.trim() === "") {
        throw new FhirMapperError(
            "Performer ID (from server action) cannot be empty",
            "MISSING_PERFORMER_ID"
        );
    }
    if (!input.practitionerName || input.practitionerName.trim() === "") {
        throw new FhirMapperError(
            "Performer name (from server action) cannot be empty",
            "MISSING_PERFORMER_NAME"
        );
    }

    const fhirEncounter: EncounterWritePayload = {
        resourceType: "Encounter",
        status: "planned",
        class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "HH",
            display: "Home health",
        },
        type: [
            {
                coding: [
                    {
                        code: input.visitType,
                        display: formatEncounterVisitType(input.visitType),
                    },
                ],
            },
        ],
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
                    reference: `Practitioner/${input.performerId}`,
                    display: input.practitionerName,
                },
            },
        ],
        period: {
            start: input.plannedAt,
        },
    };

    if (input.reasonDisplay && input.reasonDisplay.trim() !== "") {
        fhirEncounter.reasonCode = [
            {
                text: input.reasonDisplay,
            },
        ];
    }

    if (input.note && input.note.trim() !== "") {
        fhirEncounter.extension = [
            {
                url: CLINICAL_NOTE_EXTENSION_URL,
                valueString: input.note,
            },
        ];

        fhirEncounter.note = [
            {
                text: input.note,
            },
        ];
    }

    return fhirEncounter;
}
