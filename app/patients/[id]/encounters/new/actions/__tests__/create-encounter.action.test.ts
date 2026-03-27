import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FhirMapperError, FhirWriteError } from "../../../../../../../domain/shared/error-types";

const createMock = vi.fn();
const getCurrentPractitionerMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("../../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
    createEncounterRepository: () => ({
        create: createMock,
    }),
}));

vi.mock("@/lib/server/current-practitioner", () => ({
    getCurrentPractitioner: getCurrentPractitionerMock,
}));

vi.mock("next/cache", () => ({
    revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
    redirect: redirectMock,
}));

describe("createEncounterAction", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-20T10:00:00.000Z"));
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("resolves the practitioner name from the shared helper before creating the encounter", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        createMock.mockResolvedValue({ id: "enc-123" });
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-20",
                plannedTime: "10:00",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(getCurrentPractitionerMock).toHaveBeenCalledTimes(1);
        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                practitionerName: "Lic. Ramiro Perez",
                performerId: "kine-1",
                plannedDate: "2026-03-20",
                plannedTime: "10:00",
            })
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/patients/patient-1");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(
            2,
            "/patients/patient-1/encounters"
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(
            3,
            "/patients/patient-1/encounters/enc-123"
        );
        expect(redirectMock).toHaveBeenCalledWith(
            "/patients/patient-1/encounters/enc-123"
        );
    });

    it("returns an fhir-layer error when the shared practitioner helper cannot resolve the current practitioner", async () => {
        getCurrentPractitionerMock.mockRejectedValue(
            new FhirMapperError(
                "Current practitioner kine-1 could not be resolved from FHIR",
                "CURRENT_PRACTITIONER_NOT_FOUND"
            )
        );

        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-20",
                plannedTime: "10:00",
                visitType: "follow-up",
                reasonDisplay: "",
                note: "",
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Current practitioner kine-1 could not be resolved from FHIR",
                code: "CURRENT_PRACTITIONER_NOT_FOUND",
                details: undefined,
            },
        });
        expect(createMock).not.toHaveBeenCalled();
    });


    it("returns a controlled fhir-layer ActionResult when repository create fails with FhirWriteError", async () => {
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

        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        createMock.mockRejectedValue(
            new FhirWriteError(
                "No se pudo crear el encuentro",
                500,
                operationOutcome,
                "FHIR_WRITE_FAILED"
            )
        );

        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-20",
                plannedTime: "10:00",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "No se pudo crear el encuentro",
                code: "FHIR_WRITE_FAILED",
                details: operationOutcome,
            },
        });
    });

    it("returns a validation error when planned datetime is earlier than now", async () => {
        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-20",
                plannedTime: "06:59",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(createMock).not.toHaveBeenCalled();
    });

    it("allows planned date without time when date is today", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        createMock.mockResolvedValue({ id: "enc-123" });
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-20",
                plannedTime: "",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                plannedDate: "2026-03-20",
                plannedTime: undefined,
            })
        );
    });

    it("returns validation error when planned date without time is before today", async () => {
        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-19",
                plannedTime: "",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(createMock).not.toHaveBeenCalled();
    });

    it("returns validation error when planning window exceeds 10 days", async () => {
        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedDate: "2026-03-31",
                plannedTime: "",
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(getCurrentPractitionerMock).not.toHaveBeenCalled();
        expect(createMock).not.toHaveBeenCalled();
    });
});
