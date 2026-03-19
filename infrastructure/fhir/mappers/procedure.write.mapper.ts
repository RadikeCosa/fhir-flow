/**
 * Build FHIR Procedure entries from FinalizeEncounterInput.
 * Pure mapper: no I/O, no side effects.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { PROCEDURE_SYSTEM } from "../../../lib/fhir/systems";

export function mapToFhirProcedures(input: FinalizeEncounterInput): Array<unknown> {
    if (!Array.isArray(input.procedures) || input.procedures.length === 0) {
        return [];
    }

    return input.procedures.map((procedure) => ({
        request: { method: "POST", url: "Procedure" },
        resource: {
            resourceType: "Procedure",
            status: "completed",
            subject: {
                reference: `Patient/${input.patientId}`,
            },
            encounter: {
                reference: `Encounter/${input.encounterId}`,
            },
            performer: [
                {
                    actor: {
                        reference: `Practitioner/${input.performerId}`,
                        display: input.practitionerName,
                    },
                },
            ],
            code: {
                coding: [
                    {
                        system: PROCEDURE_SYSTEM,
                        code: procedure.code,
                        display: procedure.bodySite ?? undefined,
                    },
                ],
            },
            ...(procedure.bodySite ? { bodySite: { text: procedure.bodySite } } : {}),
            ...(procedure.note ? { note: [{ text: procedure.note }] } : {}),
        },
    }));
}
