import { beforeEach, describe, expect, it, vi } from "vitest";
import { FhirWriteError } from "../../../../../../../domain/shared/error-types";

const findByIdMock = vi.fn();
const saveProgressMock = vi.fn();
const getCurrentPractitionerMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("../../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
    createEncounterRepository: () => ({
        findById: findByIdMock,
        saveProgress: saveProgressMock,
    }),
}));

vi.mock("../../../../../../../lib/server/current-practitioner", () => ({
    getCurrentPractitioner: getCurrentPractitionerMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

const baseEncounter = {
    id: "enc-123",
    status: "in-progress" as const,
    episodeOfCareId: "episode-1",
    patientId: "patient-1",
    visitType: "follow-up" as const,
    participant: null,
    plannedDate: "2026-03-20",
    plannedTime: "10:00",
    actualStartAt: "2026-03-20T09:15:00.000Z",
    actualEndAt: undefined,
    periodStart: "2026-03-20T10:00:00.000Z",
    periodEnd: undefined,
    durationMinutes: undefined,
    reasonCode: undefined,
    reasonDisplay: "Control programado",
    clinicalNote: undefined,
};

const baseSaveProgressPayload = {
    actualDate: "2026-03-20",
    actualStartTime: "09:15",
};

describe("saveEncounterProgressAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns a validation-layer error when formData is invalid", async () => {
        const { saveEncounterProgressAction } = await import("../save-encounter-progress.action");

        await expect(
            saveEncounterProgressAction("patient-1", "enc-123", {
                bloodPressureSystolic: 120,
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
        expect(saveProgressMock).not.toHaveBeenCalled();
    });

    it("returns a controlled fhir-layer error when the encounter cannot be found", async () => {
        findByIdMock.mockResolvedValue(null);

        const { saveEncounterProgressAction } = await import("../save-encounter-progress.action");

        await expect(
            saveEncounterProgressAction("patient-1", "enc-404", baseSaveProgressPayload)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Encounter not found",
                code: "ENCOUNTER_NOT_FOUND",
                details: {
                    cause: "not_found",
                },
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(saveProgressMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when encounter status is not in-progress", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            status: "planned",
        });

        const { saveEncounterProgressAction } = await import("../save-encounter-progress.action");

        await expect(
            saveEncounterProgressAction("patient-1", "enc-123", baseSaveProgressPayload)
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "Solo se puede guardar progreso en un encuentro en curso",
                code: "ENCOUNTER_NOT_IN_PROGRESS",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(saveProgressMock).not.toHaveBeenCalled();
    });

    it("returns success without redirect when save progress succeeds", async () => {
        findByIdMock.mockResolvedValue(baseEncounter);
        getCurrentPractitionerMock.mockResolvedValue({
            id: "prac-1",
            displayName: "Lic. Ramiro Perez",
        });
        saveProgressMock.mockResolvedValue(undefined);

        const { saveEncounterProgressAction } = await import("../save-encounter-progress.action");

        await expect(
            saveEncounterProgressAction("patient-1", "enc-123", {
                ...baseSaveProgressPayload,
                clinicalNote: "Paciente estable durante sesión",
                heartRate: 80,
                procedures: [],
            })
        ).resolves.toEqual({
            success: true,
        });

        expect(saveProgressMock).toHaveBeenCalledWith(
            expect.objectContaining({
                encounterId: "enc-123",
                patientId: "patient-1",
                episodeOfCareId: "episode-1",
                performerId: "prac-1",
                practitionerName: "Lic. Ramiro Perez",
                visitType: "follow-up",
                actualStartAt: "2026-03-20T12:15:00.000Z",
                clinicalNote: "Paciente estable durante sesión",
                heartRate: 80,
                procedures: [],
            })
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/patients/patient-1");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(2, "/patients/patient-1/encounters");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(3, "/patients/patient-1/encounters/enc-123");
    });

    it("returns an fhir-layer error when repository save fails", async () => {
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
        saveProgressMock.mockRejectedValue(
            new FhirWriteError(
                "No se pudo guardar el progreso del encuentro",
                500,
                operationOutcome,
                "FHIR_WRITE_FAILED"
            )
        );

        const { saveEncounterProgressAction } = await import("../save-encounter-progress.action");

        await expect(
            saveEncounterProgressAction("patient-1", "enc-123", {
                ...baseSaveProgressPayload,
                procedures: [],
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "No se pudo guardar el progreso del encuentro",
                code: "FHIR_WRITE_FAILED",
                details: {
                    cause: "operation_outcome",
                    operationOutcome,
                },
            },
        });
    });
});
