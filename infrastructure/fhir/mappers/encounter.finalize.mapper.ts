/**
 * Build a FHIR transaction bundle entry for updating an Encounter to finished.
 *
 * The method is pure and does not perform HTTP I/O.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../lib/fhir/systems";

export function mapToFhirEncounterUpdate(input: FinalizeEncounterInput): unknown {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new FhirMapperError("Encounter ID cannot be empty", "MISSING_ENCOUNTER_ID");
    }

    const encounterResource: Record<string, unknown> = {
        resourceType: "Encounter",
        id: input.encounterId,
        status: "finished",
        period: {
            start: input.periodStart,
            end: input.periodEnd,
        },
        subject: {
            reference: `Patient/${input.patientId}`,
        },
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
