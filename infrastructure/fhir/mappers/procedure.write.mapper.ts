/**
 * Build FHIR Procedure entries from FinalizeEncounterInput.
 * Pure mapper: no I/O, no side effects.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { PROCEDURE_SYSTEM } from "../../../lib/fhir/systems";
import { mapProcedureCode } from "./procedure.mapper";

export function mapToFhirProcedures(input: FinalizeEncounterInput): Array<unknown> {
    if (!Array.isArray(input.procedures) || input.procedures.length === 0) {
        return [];
    }

    return input.procedures.map((procedure) => {
        const metadata = mapProcedureCode(PROCEDURE_SYSTEM, procedure.code);

        return {
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
                            display: metadata?.display,
                        },
                    ],
                },
                ...(procedure.bodySite
                    ? {
                          bodySite: [
                              {
                                  text: procedure.bodySite,
                              },
                          ],
                      }
                    : {}),
                ...(procedure.note ? { note: [{ text: procedure.note }] } : {}),
            },
        };
    });
}
