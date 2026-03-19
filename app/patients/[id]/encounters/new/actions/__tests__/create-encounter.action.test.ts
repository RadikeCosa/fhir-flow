import { beforeEach, describe, expect, it, vi } from "vitest";
import { FhirMapperError } from "../../../../../../../domain/shared/error-types";

const createMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();
const getCurrentPractitionerMock = vi.fn();

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
        vi.clearAllMocks();
    });

    it("resolves the practitioner name from FHIR before creating the encounter", async () => {
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
        expect(revalidatePathMock).toHaveBeenCalledWith("/patients/patient-1");
        expect(redirectMock).toHaveBeenCalledWith("/patients/patient-1/encounters");
    });

    it("returns an fhir-layer error when the current practitioner cannot be resolved", async () => {
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
});
