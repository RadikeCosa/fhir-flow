import { beforeEach, describe, expect, it, vi } from "vitest";
import { FhirWriteError } from "../../../../../../../domain/shared/error-types";

const findByIdMock = vi.fn();
const startEncounterMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("../../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
    createEncounterRepository: () => ({
        findById: findByIdMock,
        startEncounter: startEncounterMock,
    }),
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
    plannedDate: "2026-03-20",
    plannedTime: "10:00",
    actualStartAt: undefined,
    actualEndAt: undefined,
    periodStart: "2026-03-20T10:00:00.000Z",
    periodEnd: undefined,
    durationMinutes: undefined,
    reasonCode: undefined,
    reasonDisplay: "Control programado",
    clinicalNote: undefined,
};

describe("startEncounterAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it("returns a controlled fhir-layer error when encounter does not exist", async () => {
        findByIdMock.mockResolvedValue(null);

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-404")).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Encounter not found",
                code: "ENCOUNTER_NOT_FOUND",
            },
        });

        expect(startEncounterMock).not.toHaveBeenCalled();
    });

    it("returns controlled fhir-layer error when loading encounter fails unexpectedly", async () => {
        findByIdMock.mockRejectedValue({
            name: "HttpError",
            message: "HTTP 500 Internal Server Error",
            data: undefined,
        });

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "HTTP 500 Internal Server Error",
                code: "FHIR_HTTP_ERROR",
                details: undefined,
            },
        });

        expect(startEncounterMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when encounter patient does not match route patient", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            patientId: "patient-2",
        });

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "El encuentro no pertenece al paciente indicado en la ruta",
                code: "ENCOUNTER_PATIENT_MISMATCH",
            },
        });

        expect(startEncounterMock).not.toHaveBeenCalled();
    });

    it("returns a domain-layer error when encounter is already in progress", async () => {
        findByIdMock.mockResolvedValue({
            ...baseEncounter,
            status: "in-progress" as const,
        });

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "Encounter is already in progress",
                code: "ENCOUNTER_ALREADY_IN_PROGRESS",
            },
        });

        expect(startEncounterMock).not.toHaveBeenCalled();
    });

    it("updates encounter start time and redirects on success", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-21T12:30:00.000Z"));

        findByIdMock.mockResolvedValue(baseEncounter);
        startEncounterMock.mockResolvedValue(undefined);
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).rejects.toThrow(
            "NEXT_REDIRECT"
        );

        expect(startEncounterMock).toHaveBeenCalledWith(
            "enc-123",
            "2026-03-21T12:30:00.000Z"
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

    it("returns fhir-layer errors when repository start fails", async () => {
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
        startEncounterMock.mockRejectedValue(
            new FhirWriteError(
                "No se pudo iniciar el encuentro",
                500,
                operationOutcome,
                "FHIR_WRITE_FAILED"
            )
        );

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "No se pudo iniciar el encuentro",
                code: "FHIR_WRITE_FAILED",
                details: operationOutcome,
            },
        });
    });

    it("returns a controlled fallback error for unknown failures during start", async () => {
        findByIdMock.mockResolvedValue(baseEncounter);
        startEncounterMock.mockRejectedValue(new Error("Unknown crash"));

        const { startEncounterAction } = await import("../start-encounter.action");

        await expect(startEncounterAction("patient-1", "enc-123")).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Unexpected error while starting encounter",
                code: "ENCOUNTER_START_FAILED",
            },
        });
    });
});
