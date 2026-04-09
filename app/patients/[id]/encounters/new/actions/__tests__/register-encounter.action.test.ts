import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FhirMapperError, FhirWriteError } from "../../../../../../../domain/shared/error-types";

const registerMock = vi.fn();
const getCurrentPractitionerMock = vi.fn();
const findAllByPatientIdMock = vi.fn();
const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("../../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
    createEncounterRepository: () => ({
        register: registerMock,
    }),
}));

vi.mock("../../../../../../../infrastructure/fhir/factories/episode-of-care.factory", () => ({
    createEpisodeOfCareRepository: () => ({
        findAllByPatientId: findAllByPatientIdMock,
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

describe("registerEncounterAction", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-20T15:00:00.000Z"));
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("register start crea encounter in-progress sin reglas de finished", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "active" },
        ]);
        registerMock.mockResolvedValue({ id: "enc-100" });
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                clinicalNote: "",
                procedures: [],
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(registerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: "patient-1",
                completionMode: "start",
                episodeOfCareId: "episode-1",
                performerId: "kine-1",
                practitionerName: "Lic. Ramiro Perez",
                actualEndAt: undefined,
            })
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/patients/patient-1");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(2, "/patients/patient-1/encounters");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(3, "/patients/patient-1/encounters/enc-100");
    });

    it("register start puede retornar encounterId sin redirect cuando se solicita continuidad en register", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "active" },
        ]);
        registerMock.mockResolvedValue({ id: "enc-101" });

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                redirectToDetail: false,
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                procedures: [],
            })
        ).resolves.toEqual({
            success: true,
            data: { encounterId: "enc-101" },
        });

        expect(redirectMock).not.toHaveBeenCalled();
    });

    it("register start acepta vitales y EVA vacíos sin tratarlos como obligatorios", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "active" },
        ]);
        registerMock.mockResolvedValue({ id: "enc-102" });

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                redirectToDetail: false,
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                heartRate: "",
                respiratoryRate: "",
                oxygenSaturation: "",
                bodyTemperature: "",
                bloodPressureSystolic: "",
                bloodPressureDiastolic: "",
                evaScore: "",
                procedures: [],
            })
        ).resolves.toEqual({
            success: true,
            data: { encounterId: "enc-102" },
        });

        expect(registerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                heartRate: undefined,
                respiratoryRate: undefined,
                oxygenSaturation: undefined,
                bodyTemperature: undefined,
                bloodPressureSystolic: undefined,
                bloodPressureDiastolic: undefined,
                evaScore: undefined,
            })
        );
    });

    it("register complete exige reglas shared de finished", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "active" },
        ]);

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "complete",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                actualEndTime: "11:00",
                clinicalNote: "",
                procedures: [],
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(registerMock).not.toHaveBeenCalled();
    });

    it("register complete crea encounter finished y redirige al detail encounter-centric", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "active" },
        ]);
        registerMock.mockResolvedValue({ id: "enc-200" });
        redirectMock.mockImplementation(() => {
            throw new Error("NEXT_REDIRECT");
        });

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "complete",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                actualEndTime: "11:00",
                clinicalNote: "Paciente estable.",
                procedures: [],
            })
        ).rejects.toThrow("NEXT_REDIRECT");

        expect(registerMock).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: "patient-1",
                completionMode: "complete",
                episodeOfCareId: "episode-1",
                performerId: "kine-1",
                practitionerName: "Lic. Ramiro Perez",
                actualEndAt: expect.any(String),
                clinicalNote: "Paciente estable.",
            })
        );
        expect(revalidatePathMock).toHaveBeenNthCalledWith(1, "/patients/patient-1");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(2, "/patients/patient-1/encounters");
        expect(revalidatePathMock).toHaveBeenNthCalledWith(3, "/patients/patient-1/encounters/enc-200");
    });

    it("rechaza fecha y hora de inicio futuras en register", async () => {
        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-21",
                actualStartTime: "08:00",
                procedures: [],
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(registerMock).not.toHaveBeenCalled();
        expect(findAllByPatientIdMock).not.toHaveBeenCalled();
    });

    it("rechaza hora de fin futura cuando la visita se completa", async () => {
        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "complete",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "09:00",
                actualEndTime: "12:30",
                clinicalNote: "Paciente estable.",
                procedures: [],
            })
        ).resolves.toMatchObject({
            success: false,
            error: {
                layer: "validation",
                code: "FORM_VALIDATION_FAILED",
            },
        });

        expect(registerMock).not.toHaveBeenCalled();
        expect(findAllByPatientIdMock).not.toHaveBeenCalled();
    });

    it("valida server-side que el episodio exista y esté activo para ese paciente", async () => {
        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-2", status: "active" },
        ]);

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                procedures: [],
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "El episodio indicado no existe para el paciente de la ruta",
                code: "EPISODE_OF_CARE_NOT_FOUND_FOR_PATIENT",
            },
        });

        findAllByPatientIdMock.mockResolvedValue([
            { id: "episode-1", status: "finished" },
        ]);

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                procedures: [],
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "domain",
                message: "El episodio indicado no está activo",
                code: "EPISODE_OF_CARE_NOT_ACTIVE",
            },
        });
    });

    it("retorna error de capa fhir si falla register en repositorio", async () => {
        const operationOutcome = {
            resourceType: "OperationOutcome" as const,
            issue: [{ severity: "error" as const, code: "exception" as const }],
        };

        getCurrentPractitionerMock.mockResolvedValue({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
        findAllByPatientIdMock.mockResolvedValue([{ id: "episode-1", status: "active" }]);
        registerMock.mockRejectedValue(
            new FhirWriteError("Bundle failed", 500, operationOutcome, "BUNDLE_HTTP_ERROR")
        );

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                procedures: [],
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Bundle failed",
                code: "BUNDLE_HTTP_ERROR",
                details: {
                    cause: "operation_outcome",
                    operationOutcome,
                },
            },
        });
    });

    it("retorna error de capa fhir si no se puede resolver el practitioner actual", async () => {
        getCurrentPractitionerMock.mockRejectedValue(
            new FhirMapperError("Current practitioner missing", "CURRENT_PRACTITIONER_NOT_FOUND")
        );

        const { registerEncounterAction } = await import("../register-encounter.action");

        await expect(
            registerEncounterAction("patient-1", {
                completionMode: "start",
                episodeOfCareId: "episode-1",
                visitType: "follow-up",
                actualDate: "2026-03-20",
                actualStartTime: "10:30",
                procedures: [],
            })
        ).resolves.toEqual({
            success: false,
            error: {
                layer: "fhir",
                message: "Current practitioner missing",
                code: "CURRENT_PRACTITIONER_NOT_FOUND",
                details: {
                    cause: "mapper_error",
                },
            },
        });
    });
});
