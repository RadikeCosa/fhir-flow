import { describe, expect, it } from "vitest";

import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../../domain/shared/error-types";
import { mapToFhirProcedures } from "../procedure.write.mapper";
import { PROCEDURE_SYSTEM } from "../../../../lib/fhir/systems";

function makeInput(
    overrides: Partial<FinalizeEncounterInput> = {}
): FinalizeEncounterInput {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        visitType: "follow-up",
        actualStartAt: "2026-03-20T10:00:00.000Z",
        actualEndAt: "2026-03-20T11:00:00.000Z",
        clinicalNote: "Paciente estable. Se finaliza visita.",
        reasonDisplay: "Control programado",
        procedures: [
            {
                category: "terapia-manual",
                code: "masoterapia",
                bodySite: "Hombro derecho",
                note: "Sin incidencias",
            },
        ],
        ...overrides,
    };
}

describe("mapToFhirProcedures", () => {
    it("maps coding.display to the human-readable procedure name and keeps bodySite separate", () => {
        const result = mapToFhirProcedures(makeInput()) as Array<{
            resource: Record<string, unknown>;
        }>;

        expect(result).toHaveLength(1);
        expect(result[0]?.resource).toMatchObject({
            resourceType: "Procedure",
            status: "completed",
            subject: {
                reference: "Patient/patient-1",
            },
            encounter: {
                reference: "Encounter/enc-123",
            },
            performer: [
                {
                    actor: {
                        reference: "Practitioner/prac-1",
                        display: "Lic. Ramiro Perez",
                    },
                },
            ],
            code: {
                coding: [
                    {
                        system: PROCEDURE_SYSTEM,
                        code: "masoterapia",
                        display: "Masoterapia",
                    },
                ],
            },
            bodySite: [
                {
                    text: "Hombro derecho",
                },
            ],
            note: [
                {
                    text: "Sin incidencias",
                },
            ],
        });
    });

    it("does not leak bodySite into coding.display when both values are present", () => {
        const result = mapToFhirProcedures(
            makeInput({
                procedures: [
                    {
                        category: "fisioterapia",
                        code: "laser",
                        bodySite: "Rodilla izquierda",
                    },
                ],
            })
        ) as Array<{ resource: { code: { coding: Array<{ display?: string }> }; bodySite?: unknown } }>;

        expect(result[0]?.resource.code.coding[0]?.display).toBe("Láser terapéutico");
        expect(result[0]?.resource.code.coding[0]?.display).not.toBe("Rodilla izquierda");
        expect(result[0]?.resource.bodySite).toEqual([
            {
                text: "Rodilla izquierda",
            },
        ]);
    });

    it("omits bodySite when the procedure does not include an anatomical location", () => {
        const result = mapToFhirProcedures(
            makeInput({
                procedures: [
                    {
                        category: "educacion",
                        code: "educacion-paciente",
                        note: "Se entregan indicaciones domiciliarias",
                    },
                ],
            })
        ) as Array<{ resource: Record<string, unknown> }>;

        expect(result[0]?.resource.code).toEqual({
            coding: [
                {
                    system: PROCEDURE_SYSTEM,
                    code: "educacion-paciente",
                    display: "Educación al paciente",
                },
            ],
        });
        expect(result[0]?.resource.bodySite).toBeUndefined();
    });

    it("throws a typed error when procedure metadata cannot be resolved", () => {
        expect(() =>
            mapToFhirProcedures(
                makeInput({
                    procedures: [
                        {
                            category: "terapia-manual",
                            code: "codigo-inexistente" as never,
                        },
                    ],
                })
            )
        ).toThrowError(
            new FhirMapperError(
                "Procedure metadata could not be resolved for code: codigo-inexistente",
                "MISSING_PROCEDURE_METADATA"
            )
        );
    });

    it("omits bodySite and note when they are empty strings", () => {
        const result = mapToFhirProcedures(
            makeInput({
                procedures: [
                    {
                        category: "terapia-manual",
                        code: "masoterapia",
                        bodySite: "",
                        note: "",
                    },
                ],
            })
        ) as Array<{ resource: Record<string, unknown> }>;

        expect(result[0]?.resource.bodySite).toBeUndefined();
        expect(result[0]?.resource.note).toBeUndefined();
    });

});
