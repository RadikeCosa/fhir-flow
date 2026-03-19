import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BarthelAssessment } from '@/domain/assessments/barthel-assessment';
import type { EcogAssessment } from '@/domain/assessments/ecog-assessment';
import type { EvaAssessment } from '@/domain/assessments/eva-assessment';
import type { NecpalAssessment } from '@/domain/assessments/necpal-assessment';
import type { Encounter } from '@/domain/encounters/encounter';
import type { EpisodeOfCare } from '@/domain/episode-of-care/episode-of-care';
import type { Patient } from '@/domain/patients/patient';
import type { PlanOfCare } from '@/domain/plan-of-care/plan-of-care';
import type { Procedure } from '@/domain/procedures/procedure';
import type { VitalSignRecord } from '@/domain/vital-sign-record/vital-sign-record';

const repositories = vi.hoisted(() => ({
    patientRepo: {
        findById: vi.fn(),
    },
    episodeRepo: {
        findAllByPatientId: vi.fn(),
    },
    encounterRepo: {
        findLastByPatientIdAndPractitionerId: vi.fn(),
        findNextPlannedByPatientIdAndPractitionerId: vi.fn(),
        findInitialByEpisodeOfCareId: vi.fn(),
        findAllByEpisodeOfCareId: vi.fn(),
    },
    vitalRepo: {
        findAllByEncounterId: vi.fn(),
    },
    assessmentRepo: {
        findEvaByEncounterId: vi.fn(),
    },
    procedureRepo: {
        findAllByEncounterId: vi.fn(),
    },
    barthelRepo: {
        findByEncounterId: vi.fn(),
    },
    necpalRepo: {
        findByEncounterId: vi.fn(),
    },
    ecogRepo: {
        findByEncounterId: vi.fn(),
    },
    planRepo: {
        findByEncounterId: vi.fn(),
    },
}));

vi.mock('@/infrastructure/fhir/factories', () => ({
    createPatientRepository: () => repositories.patientRepo,
    createEpisodeOfCareRepository: () => repositories.episodeRepo,
    createEncounterRepository: () => repositories.encounterRepo,
    createVitalSignRecordRepository: () => repositories.vitalRepo,
    createAssessmentRepository: () => repositories.assessmentRepo,
    createProcedureRepository: () => repositories.procedureRepo,
    createBarthelAssessmentRepository: () => repositories.barthelRepo,
    createNecpalAssessmentRepository: () => repositories.necpalRepo,
    createEcogAssessmentRepository: () => repositories.ecogRepo,
    createPlanOfCareRepository: () => repositories.planRepo,
}));

vi.mock('@/infrastructure/fhir/factories/ecog-assessment.factory', () => ({
    createEcogAssessmentRepository: () => repositories.ecogRepo,
}));

vi.mock('@/config/fhir.config', () => ({
    currentPractitionerId: 'prac-001',
}));

import { getPatientDetailData } from '../data';

const patientFixture: Patient = {
    id: 'patient-001',
    identifier: '12345678',
    name: {
        given: 'Ana',
        family: 'Gomez',
    },
    active: true,
};

const activeEpisodeFixture: EpisodeOfCare = {
    id: 'episode-001',
    identifier: 'episode-identifier',
    status: 'active',
    type: ['motora'],
    startDate: '2026-01-10',
    condition: {
        code: 'M54.5',
        description: 'Dolor lumbar',
    },
    patientId: patientFixture.id,
};

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
    return {
        id: 'encounter-default',
        status: 'finished',
        episodeOfCareId: activeEpisodeFixture.id,
        patientId: patientFixture.id,
        visitType: 're-assessment',
        participant: null,
        periodStart: '2026-03-15T09:00:00.000Z',
        ...overrides,
    };
}

function makeBarthel(encounterId: string): BarthelAssessment {
    return {
        id: `barthel-${encounterId}`,
        patientId: patientFixture.id,
        encounterId,
        date: '2026-03-15',
        type: 'barthel',
        totalScore: 70,
        functionalLevel: 'mild-dependency',
        items: [],
    };
}

function makePlanOfCare(encounterId: string): PlanOfCare {
    return {
        id: `plan-${encounterId}`,
        status: 'active',
        patientId: patientFixture.id,
        episodeOfCareId: activeEpisodeFixture.id,
        encounterId,
        periodStart: '2026-03-15',
        goals: [],
        activities: [],
        createdAt: '2026-03-15T10:00:00.000Z',
    };
}

describe('getPatientDetailData re-assessment filtering', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-18T12:00:00.000Z'));
        vi.clearAllMocks();

        repositories.patientRepo.findById.mockResolvedValue(patientFixture);
        repositories.episodeRepo.findAllByPatientId.mockResolvedValue([activeEpisodeFixture]);
        repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(null);
        repositories.encounterRepo.findNextPlannedByPatientIdAndPractitionerId.mockResolvedValue(null);
        repositories.encounterRepo.findInitialByEpisodeOfCareId.mockResolvedValue(null);
        repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([] satisfies VitalSignRecord[]);
        repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([] satisfies EvaAssessment[]);
        repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([] satisfies Procedure[]);
        repositories.necpalRepo.findByEncounterId.mockResolvedValue(null as NecpalAssessment | null);
        repositories.ecogRepo.findByEncounterId.mockResolvedValue(null as EcogAssessment | null);
        repositories.barthelRepo.findByEncounterId.mockResolvedValue(null as BarthelAssessment | null);
        repositories.planRepo.findByEncounterId.mockResolvedValue(null as PlanOfCare | null);
    });

    it('includes only finished past re-assessments with visible data', async () => {
        const visibleWithBarthel = makeEncounter({
            id: 'enc-finished-past-barthel',
            periodStart: '2026-03-10T09:00:00.000Z',
        });
        const plannedPast = makeEncounter({
            id: 'enc-planned-past',
            status: 'planned',
            periodStart: '2026-03-11T09:00:00.000Z',
        });
        const finishedFuture = makeEncounter({
            id: 'enc-finished-future',
            periodStart: '2026-03-20T09:00:00.000Z',
        });
        const finishedPastWithoutData = makeEncounter({
            id: 'enc-finished-past-empty',
            periodStart: '2026-03-12T09:00:00.000Z',
        });
        const visibleWithPlan = makeEncounter({
            id: 'enc-finished-past-plan',
            periodStart: '2026-03-13T09:00:00.000Z',
        });
        const followUpPast = makeEncounter({
            id: 'enc-follow-up-past',
            visitType: 'follow-up',
            periodStart: '2026-03-09T09:00:00.000Z',
        });

        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            visibleWithPlan,
            plannedPast,
            finishedFuture,
            followUpPast,
            finishedPastWithoutData,
            visibleWithBarthel,
        ]);

        repositories.barthelRepo.findByEncounterId.mockImplementation(async (encounterId: string) => {
            if (encounterId === visibleWithBarthel.id) {
                return makeBarthel(encounterId);
            }
            return null;
        });

        repositories.planRepo.findByEncounterId.mockImplementation(async (encounterId: string) => {
            if (encounterId === visibleWithPlan.id) {
                return makePlanOfCare(encounterId);
            }
            return null;
        });

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.reAssessmentEntries.map((entry) => entry.encounter.id)).toEqual([
            visibleWithBarthel.id,
            visibleWithPlan.id,
        ]);
        expect(repositories.barthelRepo.findByEncounterId).toHaveBeenCalledTimes(3);
        expect(repositories.planRepo.findByEncounterId).toHaveBeenCalledTimes(3);
        expect(repositories.barthelRepo.findByEncounterId).not.toHaveBeenCalledWith(plannedPast.id);
        expect(repositories.barthelRepo.findByEncounterId).not.toHaveBeenCalledWith(finishedFuture.id);
        expect(repositories.barthelRepo.findByEncounterId).not.toHaveBeenCalledWith(followUpPast.id);
    });

    it('excludes encounters whose periodStart is invalid', async () => {
        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            makeEncounter({
                id: 'enc-invalid-date',
                periodStart: 'not-a-date',
            }),
        ]);

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.reAssessmentEntries).toEqual([]);
        expect(repositories.barthelRepo.findByEncounterId).not.toHaveBeenCalled();
        expect(repositories.planRepo.findByEncounterId).not.toHaveBeenCalled();
    });
});