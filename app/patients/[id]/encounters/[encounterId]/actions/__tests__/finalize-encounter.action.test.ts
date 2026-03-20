import { beforeEach, describe, expect, it, vi } from "vitest";
import { FhirWriteError } from "../../../../../../../domain/shared/error-types";

const findByIdMock = vi.fn();
const finalizeMock = vi.fn();
const getCurrentPractitionerMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("../../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
    createEncounterRepository: () => ({
        findById: findByIdMock,
        finalize: finalizeMock,
    }),
}));

vi.mock("../../../../../../../lib/server/current-practitioner", () => ({
    getCurrentPractitioner: getCurrentPractitionerMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
    redirect: redirectMock,
}));

const baseEncounter = {
    id: "enc-123",
    status: "planned" as const,
    episodeOfCareId: "episode-1",
    patientId: "patient-1",
    visitType: "follow-up" as const,
    participant: null,
    periodStart: "2026-03-20T10:00:00.000Z",
    periodEnd: undefined,
    durationMinutes: undefined,
    reasonCode: undefined,
    reasonDisplay: "Control programado",
    clinicalNote: undefined,
};

const validFormData = {
    periodEnd: new Date("2026-03-20T11:00:00.000Z"),
    clinicalNote: "Paciente estable. Se realiza cierre de visita.",
    reasonDisplay: "Control programado",
    procedures: [],
};

describe("finalizeEncounterAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns a validation-layer error when formData is invalid", async () => {
        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", {
                periodEnd: "2026-03-20T11:00",
                clinicalNote: "Paciente estable",
                reasonDisplay: "Control programado",
                procedures: [],
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(findByIdMock).not.toHaveBeenCalled();
        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(finalizeMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when the clinical note is missing", async () => {
        findByIdMock.mockResolvedValue(baseEncounter);
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", {
                ...validFormData,
                clinicalNote: undefined,
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "La nota clínica es obligatoria",
                code: "CLINICAL_NOTE_REQUIRED",
            },
        });

        expect(findByIdMock).toHaveBeenCalledWith("enc-123");
        expect(getCurrentPractitionerMock).toHaveBeenCalledTimes(1);
        expect(finalizeMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when the encounter does not belong to the route patient", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            patientId: "patient-2",
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "El encuentro no pertenece al paciente indicado en la ruta",
                code: "ENCOUNTER_PATIENT_MISMATCH",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(finalizeMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when the encounter is cancelled", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            status: "cancelled" as const,
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "No es posible finalizar un encuentro finalizado o cancelado",
                code: "ENCOUNTER_NOT_EDITABLE",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(finalizeMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when the encounter is not editable", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            status: "finished" as const,
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "No es posible finalizar un encuentro finalizado o cancelado",
                code: "ENCOUNTER_NOT_EDITABLE",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(finalizeMock).not.toHaveBeenCalled();
    });

    it("keeps allowing planned encounters during the transitional lifecycle", async () => {
        findByIdMock.mockResolvedValue(baseEncounter);
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });
        finalizeMock.mockResolvedValue(undefined);
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(finalizeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                encounterId: "enc-123",
                patientId: "patient-1",
                visitType: "follow-up",
                periodStart: "2026-03-20T10:00:00.000Z",
                periodEnd: "2026-03-20T11:00:00.000Z",
            })
        );
    });

    it("redirects to the encounter detail page when finalization succeeds", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            status: "in-progress" as const,
        });
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });
        finalizeMock.mockResolvedValue(undefined);
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(finalizeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                encounterId: "enc-123",
                patientId: "patient-1",
                episodeOfCareId: "episode-1",
                performerId: "prac-1",
                practitionerName: "Lic. Ramiro Perez",
                visitType: "follow-up",
                periodStart: "2026-03-20T10:00:00.000Z",
                periodEnd: "2026-03-20T11:00:00.000Z",
                clinicalNote: "Paciente estable. Se realiza cierre de visita.",
                reasonDisplay: "Control programado",
                procedures: [],
            })
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/patients/patient-1");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(
            2,
            "/patients/patient-1/encounters/enc-123"
        );
        expect(redirectMock).toHaveBeenCalledWith(
            "/patients/patient-1/encounters/enc-123"
        );
    });

    it("preserves the encounter clinical context when the form omits optional narrative fields", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            visitType: "discharge",
            reasonDisplay: "Motivo original",
            clinicalNote: "Nota original",
        });
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });
        finalizeMock.mockResolvedValue(undefined);
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", {
                ...validFormData,
                clinicalNote: undefined,
                reasonDisplay: undefined,
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(finalizeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                encounterId: "enc-123",
                patientId: "patient-1",
                visitType: "discharge",
                clinicalNote: "Nota original",
                reasonDisplay: "Motivo original",
            })
        );
    });

    it("returns an fhir-layer error when repository finalization fails", async () => {
        const operationOutcome = {
            resourceType: "OperationOutcome" as const,
            issue: [
                {
                    severity: "error" as const,
                    code: "exception" as const,
                    diagnostics: "FHIR write failed",
                },
            ],
        };

        findByIdMock.mockResolvedValue(baseEncounter);
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });
        finalizeMock.mockRejectedValue(
            new FhirWriteError(
                "No se pudo guardar el cierre del encuentro",
                500,
                operationOutcome,
                "FHIR_WRITE_FAILED"
            )
        );

        const { finalizeEncounterAction } = await import("../finalize-encounter.action");

        await expect(
            finalizeEncounterAction("patient-1", "enc-123", validFormData)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "No se pudo guardar el cierre del encuentro",
                code: "FHIR_WRITE_FAILED",
                details: operationOutcome,
            },
        });
    });
});
