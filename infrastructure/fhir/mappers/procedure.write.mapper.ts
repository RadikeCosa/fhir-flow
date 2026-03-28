/**
 * Build FHIR Procedure entries from PersistableClinicalPayload.
 * Pure mapper: no I/O, no side effects.
 */
import type {
    ClinicalResourceContext,
    PersistableClinicalPayload,
} from "./shared/persistable-clinical-payload";
import { PROCEDURE_SYSTEM } from "../../../lib/fhir/systems";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { mapProcedureCode } from "./procedure.mapper";
import { FHIR_FLOW_OWNERSHIP_TAG } from "../shared/ownership";

function hasContent(value?: string): value is string {
    return typeof value === "string" && value.trim() !== "";
}

type ProcedureWriteInput = ClinicalResourceContext & Pick<PersistableClinicalPayload, "procedures">;

export function mapToFhirProcedures(input: ProcedureWriteInput): Array<unknown> {
    if (!Array.isArray(input.procedures) || input.procedures.length === 0) {
        return [];
    }

    return input.procedures.map((procedure) => {
        const metadata = mapProcedureCode(PROCEDURE_SYSTEM, procedure.code);

        if (!metadata?.display) {
            throw new FhirMapperError(
                `Procedure metadata could not be resolved for code: ${procedure.code}`,
                "MISSING_PROCEDURE_METADATA"
            );
        }

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
                            display: metadata.display,
                        },
                    ],
                },
                meta: {
                    tag: [FHIR_FLOW_OWNERSHIP_TAG],
                },
                ...(hasContent(procedure.bodySite)
                    ? {
                          bodySite: [
                              {
                                  text: procedure.bodySite,
                              },
                          ],
                      }
                    : {}),
                ...(hasContent(procedure.note) ? { note: [{ text: procedure.note }] } : {}),
            },
        };
    });
}
