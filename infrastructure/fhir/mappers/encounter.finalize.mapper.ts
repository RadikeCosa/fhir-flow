/**
 * Build a FHIR transaction bundle entry for updating an Encounter to finished.
 *
 * The method is pure and does not perform HTTP I/O.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../lib/fhir/systems";
import { formatEncounterVisitType } from "../../../lib/patient/formatters/encounter.formatters";

export function mapToFhirEncounterUpdate(input: FinalizeEncounterInput): unknown {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new FhirMapperError("Encounter ID cannot be empty", "MISSING_ENCOUNTER_ID");
    }

    const encounterResource: Record<string, unknown> = {
        resourceType: "Encounter",
        id: input.encounterId,
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
                        code: input.visitType,
                        display: formatEncounterVisitType(input.visitType),
                    },
                ],
            },
        ],
        period: {
            start: input.actualStartAt,
            end: input.actualEndAt,
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
                    reference: `Practitioner/${input.performerId}`,
                    display: input.practitionerName,
                },
            },
        ],
    };

    if (input.reasonDisplay && input.reasonDisplay.trim() !== "") {
        encounterResource.reasonCode = [
            {
                text: input.reasonDisplay,
            },
        ];
    }

    if (input.clinicalNote && input.clinicalNote.trim() !== "") {
        encounterResource.note = [
            {
                text: input.clinicalNote,
            },
        ];

        encounterResource.extension = [
            {
                url: CLINICAL_NOTE_EXTENSION_URL,
                valueString: input.clinicalNote,
            },
        ];
    }

    return {
        request: {
            method: "PUT",
            url: `Encounter/${input.encounterId}`,
        },
        resource: encounterResource,
    };
}
