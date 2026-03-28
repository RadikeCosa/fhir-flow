import type { RegisterEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../lib/fhir/systems";
import { formatEncounterVisitType } from "../../../lib/patient/formatters/encounter.formatters";

export function mapToRegisterEncounterEntry(
    encounterId: string,
    input: RegisterEncounterInput
): unknown {
    if (!encounterId || encounterId.trim() === "") {
        throw new FhirMapperError("Encounter ID cannot be empty", "MISSING_ENCOUNTER_ID");
    }

    const encounterResource: Record<string, unknown> = {
        resourceType: "Encounter",
        id: encounterId,
        status: input.completionMode === "complete" ? "finished" : "in-progress",
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
        period:
            input.completionMode === "complete"
                ? {
                      start: input.actualStartAt,
                      end: input.actualEndAt,
                  }
                : {
                      start: input.actualStartAt,
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
        encounterResource.reasonCode = [{ text: input.reasonDisplay.trim() }];
    }

    if (input.clinicalNote && input.clinicalNote.trim() !== "") {
        const note = input.clinicalNote.trim();
        encounterResource.note = [{ text: note }];
        /**
         * Current deliberate behavior:
         * we set only the clinical note extension owned by this mapper.
         * If register later needs to preserve or merge other Encounter extensions,
         * this section can evolve to merge with pre-existing extension arrays.
         */
        encounterResource.extension = [
            {
                url: CLINICAL_NOTE_EXTENSION_URL,
                valueString: note,
            },
        ];
    }

    return {
        request: {
            /**
             * Architectural decision (deliberate):
             * register creates Encounter via PUT + client-generated id so the id
             * is known before bundle execution and can be referenced consistently
             * by Observation/Procedure entries in the same transaction.
             * This keeps Encounter + clinical snapshot persistence atomic.
             *
             * Follow-up (non-blocking):
             * Re-evaluate whether to migrate to POST-based creation with server IDs
             * if/when we introduce a stable strategy for intra-bundle references
             * compatible with our target FHIR servers.
             */
            method: "PUT",
            url: `Encounter/${encounterId}`,
        },
        resource: encounterResource,
    };
}
