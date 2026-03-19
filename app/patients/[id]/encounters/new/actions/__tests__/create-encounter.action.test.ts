import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FhirMapperError } from "../../../../../../../domain/shared/error-types";

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
                plannedAt: new Date("2026-03-20T10:00:00.000Z"),
                visitType: "follow-up",
                reasonDisplay: "Control programado",
                note: "Paciente estable",
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(getCurrentPractitionerMock).toHaveBeenCalledTimes(1);
        expect(createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                practitionerName: "Lic. Ramiro Perez",
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
                plannedAt: new Date("2026-03-20T10:00:00.000Z"),
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

    it("returns a validation error when plannedAt is earlier than the current datetime", async () => {
        const { createEncounterAction } = await import("../create-encounter.action");

        await expect(
            createEncounterAction("patient-1", "episode-1", {
                plannedAt: new Date("2026-03-20T09:59:00.000Z"),
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
