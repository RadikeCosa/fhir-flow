import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Patient } from "@/domain/patients/patient";

const repositories = vi.hoisted(() => ({
    patientRepo: {
        findById: vi.fn(),
    },
    episodeRepo: {
        findAllByPatientId: vi.fn(),
    },
    encounterRepo: {
        findAllByEpisodeOfCareId: vi.fn(),
    },
    vitalRepo: {
        findAllByPatientId: vi.fn(),
        findAllByEncounterId: vi.fn(),
    },
    assessmentRepo: {
        findEvaByPatientId: vi.fn(),
        findEvaByEncounterId: vi.fn(),
    },
    procedureRepo: {
        findAllByPatientId: vi.fn(),
        findAllByEncounterId: vi.fn(),
    },
}));

vi.mock("@/infrastructure/fhir/factories", () => ({
    createPatientRepository: () => repositories.patientRepo,
    createEpisodeOfCareRepository: () => repositories.episodeRepo,
    createEncounterRepository: () => repositories.encounterRepo,
    createVitalSignRecordRepository: () => repositories.vitalRepo,
    createAssessmentRepository: () => repositories.assessmentRepo,
    createProcedureRepository: () => repositories.procedureRepo,
}));

vi.mock("../../data", () => ({
    PatientNotFoundError: class PatientNotFoundError extends Error { },
}));

const patientFixture: Patient = {
    id: "patient-001",
    identifier: "12345678",
    name: {
        given: "Ana",
        family: "Gomez",
    },
    active: true,
};

const activeEpisodeFixture: EpisodeOfCare = {
    id: "episode-001",
    identifier: "episode-identifier",
    status: "active",
    type: ["motora"],
    startDate: "2026-01-10",
    condition: {
        code: "M54.5",
        description: "Dolor lumbar",
    },
    patientId: patientFixture.id,
};

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: "encounter-default",
        status: "finished",
        episodeOfCareId: activeEpisodeFixture.id,
        patientId: patientFixture.id,
        visitType: "follow-up",
        participant: null,
        plannedDate: undefined,
        plannedTime: undefined,
        actualStartAt: "2026-03-10T12:00:00.000Z",
        actualEndAt: "2026-03-10T12:30:00.000Z",
        periodStart: "2026-03-10T12:00:00.000Z",
        periodEnd: "2026-03-10T12:30:00.000Z",
        durationMinutes: 30,
        reasonDisplay: "Control",
        clinicalNote: undefined,
        ...overrides,
    };
}

describe("getEncountersPageData sorting", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        repositories.patientRepo.findById.mockResolvedValue(patientFixture);
        repositories.episodeRepo.findAllByPatientId.mockResolvedValue([
            activeEpisodeFixture,
        ]);
        repositories.vitalRepo.findAllByPatientId.mockResolvedValue([]);
        repositories.assessmentRepo.findEvaByPatientId.mockResolvedValue([]);
        repositories.procedureRepo.findAllByPatientId.mockResolvedValue([]);
    });

    it("sorts finished encounters by actualStartAt with fallback compatibility", async () => {
        const newerByActual = makeEncounter({
            id: "enc-newer-actual",
            actualStartAt: "2026-03-15T12:00:00.000Z",
            periodStart: "2026-03-01T12:00:00.000Z",
        });

        const olderByActual = makeEncounter({
            id: "enc-older-actual",
            actualStartAt: "2026-03-12T12:00:00.000Z",
            periodStart: "2026-03-20T12:00:00.000Z",
        });

        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            olderByActual,
            newerByActual,
        ]);

        const { getEncountersPageData } = await import("../data");
        const result = await getEncountersPageData(patientFixture.id);

        expect(result.encounters.map((encounter) => encounter.id)).toEqual([
            newerByActual.id,
            olderByActual.id,
        ]);
    });
});
