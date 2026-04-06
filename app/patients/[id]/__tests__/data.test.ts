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

import { PatientNotFoundError, getPatientDetailData } from '../data';

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

    it('uses actualStartAt as representative timestamp for finished encounter filtering/sorting', async () => {
        const now = new Date('2026-03-18T12:00:00.000Z');
        vi.setSystemTime(now);

        const includedByActualStart = makeEncounter({
            id: 'enc-included-by-actual',
            periodStart: '2026-03-25T10:00:00.000Z',
            actualStartAt: '2026-03-17T10:00:00.000Z',
        });

        const excludedByActualStart = makeEncounter({
            id: 'enc-excluded-by-actual',
            periodStart: '2026-03-10T10:00:00.000Z',
            actualStartAt: '2026-03-20T10:00:00.000Z',
        });

        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            excludedByActualStart,
            includedByActualStart,
        ]);

        repositories.barthelRepo.findByEncounterId.mockImplementation(async (encounterId: string) => {
            if (encounterId === includedByActualStart.id) {
                return makeBarthel(encounterId);
            }
            return null;
        });

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.reAssessmentEntries.map((entry) => entry.encounter.id)).toEqual([
            includedByActualStart.id,
        ]);
        expect(repositories.barthelRepo.findByEncounterId).toHaveBeenCalledWith(
            includedByActualStart.id
        );
        expect(repositories.barthelRepo.findByEncounterId).not.toHaveBeenCalledWith(
            excludedByActualStart.id
        );
    });

    it('uses the in-progress encounter as the unique clinical source when both encounters exist', async () => {
        const finishedLast = makeEncounter({
            id: 'enc-finished-last',
            status: 'finished',
            periodStart: '2026-03-12T09:00:00.000Z',
        });
        const inProgress = makeEncounter({
            id: 'enc-in-progress-current',
            status: 'in-progress',
            periodStart: '2026-03-10T09:00:00.000Z',
            actualStartAt: '2026-03-18T11:30:00.000Z',
        });

        repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(finishedLast);
        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([inProgress]);

        const inProgressVital: VitalSignRecord = {
            id: 'vs-in-progress',
            patientId: patientFixture.id,
            encounterId: inProgress.id,
            date: '2026-03-18T11:35:00.000Z',
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
            heartRate: 88,
        };
        const inProgressEva: EvaAssessment = {
            id: 'eva-in-progress',
            patientId: patientFixture.id,
            encounterId: inProgress.id,
            type: 'eva',
            date: '2026-03-18T11:40:00.000Z',
            score: 4,
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
        };
        const inProgressProcedure: Procedure = {
            id: 'proc-in-progress',
            patientId: patientFixture.id,
            encounterId: inProgress.id,
            status: 'completed',
            category: 'fisioterapia',
            code: 'ultrasonido-terapeutico',
            display: 'Curación',
            bodySite: 'Zona lumbar',
            note: 'Sin incidencias',
        };
        const finishedVital: VitalSignRecord = {
            id: 'vs-finished',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            date: '2026-03-12T09:05:00.000Z',
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
            heartRate: 72,
        };
        const finishedEva: EvaAssessment = {
            id: 'eva-finished',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            type: 'eva',
            date: '2026-03-12T09:10:00.000Z',
            score: 2,
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
        };
        const finishedProcedure: Procedure = {
            id: 'proc-finished',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            status: 'completed',
            category: 'fisioterapia',
            code: 'ultrasonido-terapeutico',
            display: 'Procedimiento finished',
            bodySite: 'Zona lumbar',
            note: 'Sin incidencias',
        };

        repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgress.id
                ? [inProgressVital]
                : encounterId === finishedLast.id
                    ? [finishedVital]
                    : []
        );
        repositories.assessmentRepo.findEvaByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgress.id
                ? [inProgressEva]
                : encounterId === finishedLast.id
                    ? [finishedEva]
                    : []
        );
        repositories.procedureRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgress.id
                ? [inProgressProcedure]
                : encounterId === finishedLast.id
                    ? [finishedProcedure]
                    : []
        );

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.inProgressEncounter?.id).toBe(inProgress.id);
        expect(result.lastEncounter?.id).toBe(inProgress.id);
        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgress.id);
        expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(inProgress.id);
        expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgress.id);
        expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalledWith(finishedLast.id);
        expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalledWith(finishedLast.id);
        expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalledWith(finishedLast.id);
        expect(result.lastEncounterVitalSigns).toEqual([inProgressVital]);
        expect(result.lastEncounterEvaRecords).toEqual([inProgressEva]);
        expect(result.lastEncounterProcedures).toEqual([inProgressProcedure]);
    });

    it('loads clinical datasets from inProgressEncounter instead of lastFinishedEncounter when both exist', async () => {
        const inProgressEncounter = makeEncounter({
            id: 'enc-in-progress-priority',
            status: 'in-progress',
            periodStart: '2026-03-19T09:00:00.000Z',
            actualStartAt: '2026-03-19T09:05:00.000Z',
        });
        const lastFinishedEncounter = makeEncounter({
            id: 'enc-finished-secondary',
            status: 'finished',
            periodStart: '2026-03-18T09:00:00.000Z',
            actualStartAt: '2026-03-18T09:05:00.000Z',
        });

        repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(
            lastFinishedEncounter
        );
        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            inProgressEncounter,
            lastFinishedEncounter,
        ]);

        const expectedVital: VitalSignRecord = {
            id: 'vs-priority',
            patientId: patientFixture.id,
            encounterId: inProgressEncounter.id,
            date: '2026-03-19T09:10:00.000Z',
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
            heartRate: 81,
        };
        const expectedEva: EvaAssessment = {
            id: 'eva-priority',
            patientId: patientFixture.id,
            encounterId: inProgressEncounter.id,
            type: 'eva',
            date: '2026-03-19T09:11:00.000Z',
            score: 5,
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
        };
        const expectedProcedure: Procedure = {
            id: 'proc-priority',
            patientId: patientFixture.id,
            encounterId: inProgressEncounter.id,
            status: 'completed',
            category: 'fisioterapia',
            code: 'ultrasonido-terapeutico',
            display: 'Procedimiento prioritario',
            bodySite: 'Zona lumbar',
            note: 'Sin incidencias',
        };

        repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgressEncounter.id ? [expectedVital] : []
        );
        repositories.assessmentRepo.findEvaByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgressEncounter.id ? [expectedEva] : []
        );
        repositories.procedureRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
            encounterId === inProgressEncounter.id ? [expectedProcedure] : []
        );

        const result = await getPatientDetailData(patientFixture.id);

        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgressEncounter.id);
        expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(
            inProgressEncounter.id
        );
        expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(
            inProgressEncounter.id
        );
        expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalledWith(
            lastFinishedEncounter.id
        );
        expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalledWith(
            lastFinishedEncounter.id
        );
        expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalledWith(
            lastFinishedEncounter.id
        );
        expect(result.lastEncounter?.id).toBe(inProgressEncounter.id);
        expect(result.lastEncounterVitalSigns).toEqual([expectedVital]);
        expect(result.lastEncounterEvaRecords).toEqual([expectedEva]);
        expect(result.lastEncounterProcedures).toEqual([expectedProcedure]);
    });

    it('falls back to latest finished encounter from active episode when there is no in-progress encounter', async () => {
        const finishedLast = makeEncounter({
            id: 'enc-finished-last-only',
            status: 'finished',
            periodStart: '2026-03-12T09:00:00.000Z',
        });

        repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(
            makeEncounter({
                id: 'enc-finished-outside-episode',
                status: 'finished',
                episodeOfCareId: 'episode-other',
                periodStart: '2026-03-19T09:00:00.000Z',
            })
        );
        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([finishedLast]);

        const finishedVital: VitalSignRecord = {
            id: 'vs-finished-last-only',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            date: '2026-03-12T09:05:00.000Z',
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
            heartRate: 75,
        };
        const finishedEva: EvaAssessment = {
            id: 'eva-finished-last-only',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            type: 'eva',
            date: '2026-03-12T09:10:00.000Z',
            score: 3,
            recordedBy: { id: 'prac-001', display: 'Dr. Test' },
        };
        const finishedProcedure: Procedure = {
            id: 'proc-finished-last-only',
            patientId: patientFixture.id,
            encounterId: finishedLast.id,
            status: 'completed',
            category: 'fisioterapia',
            code: 'ultrasonido-terapeutico',
            display: 'Procedimiento finished only',
            bodySite: 'Zona lumbar',
            note: 'Sin incidencias',
        };

        repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([finishedVital]);
        repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([finishedEva]);
        repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([finishedProcedure]);

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.inProgressEncounter).toBeNull();
        expect(result.lastEncounter?.id).toBe(finishedLast.id);
        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(finishedLast.id);
        expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(finishedLast.id);
        expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(finishedLast.id);
        expect(result.lastEncounterVitalSigns).toEqual([finishedVital]);
        expect(result.lastEncounterEvaRecords).toEqual([finishedEva]);
        expect(result.lastEncounterProcedures).toEqual([finishedProcedure]);
    });

    it('selects the most recent finished encounter using end timestamp', async () => {
        const finishedOlder = makeEncounter({
            id: 'enc-finished-older',
            status: 'finished',
            periodStart: '2026-03-12T09:00:00.000Z',
            actualEndAt: '2026-03-10T10:00:00.000Z',
        });
        const finishedNewest = makeEncounter({
            id: 'enc-finished-newest',
            status: 'finished',
            periodStart: '2026-03-10T09:00:00.000Z',
            actualEndAt: '2026-03-12T10:00:00.000Z',
        });
        const finishedMiddle = makeEncounter({
            id: 'enc-finished-middle',
            status: 'finished',
            periodStart: '2026-03-11T09:00:00.000Z',
            actualEndAt: '2026-03-11T10:00:00.000Z',
        });

        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            finishedOlder,
            finishedNewest,
            finishedMiddle,
        ]);

        repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([]);
        repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([]);
        repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([]);

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.inProgressEncounter).toBeNull();
        expect(result.lastEncounter?.id).toBe(finishedNewest.id);
        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(finishedNewest.id);
        expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(finishedNewest.id);
        expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(finishedNewest.id);
    });

    it('uses deterministic id tie-break when finished encounters share equal end timestamp', async () => {
        const finishedA = makeEncounter({
            id: 'enc-finished-a',
            status: 'finished',
            actualEndAt: '2026-03-12T10:00:00.000Z',
        });
        const finishedB = makeEncounter({
            id: 'enc-finished-b',
            status: 'finished',
            actualEndAt: '2026-03-12T10:00:00.000Z',
        });

        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            finishedA,
            finishedB,
        ]);
        repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([]);
        repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([]);
        repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([]);

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.inProgressEncounter).toBeNull();
        expect(result.lastEncounter?.id).toBe(finishedB.id);
        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(finishedB.id);
    });

    it('guard: with same-date sibling finished data present, patient detail must keep in-progress encounter as clinical source', async () => {
        const inProgress = makeEncounter({
            id: 'enc-in-progress-guard',
            status: 'in-progress',
            periodStart: '2026-03-20T09:00:00.000Z',
            actualStartAt: '2026-03-20T09:05:00.000Z',
        });
        const siblingFinished = makeEncounter({
            id: 'enc-finished-sibling-same-date',
            status: 'finished',
            periodStart: '2026-03-20T12:00:00.000Z',
            actualStartAt: '2026-03-20T12:05:00.000Z',
        });

        repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(siblingFinished);
        repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
            inProgress,
            siblingFinished,
        ]);

        repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) => {
            if (encounterId === inProgress.id) {
                return [];
            }

            if (encounterId === siblingFinished.id) {
                return [{
                    id: 'vs-sibling-should-not-leak',
                    patientId: patientFixture.id,
                    encounterId: siblingFinished.id,
                    date: '2026-03-20T12:10:00.000Z',
                    recordedBy: { id: 'prac-001', display: 'Dr. Test' },
                    heartRate: 999,
                }];
            }

            return [];
        });
        repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([]);
        repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([]);

        const result = await getPatientDetailData(patientFixture.id);

        expect(result.inProgressEncounter?.id).toBe(inProgress.id);
        expect(result.lastEncounter?.id).toBe(inProgress.id);
        expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgress.id);
        expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalledWith(
            siblingFinished.id
        );
        expect(result.lastEncounterVitalSigns).toEqual([]);
    });

    it('fails closed when route patient is missing and does not load encounter-scoped clinical datasets', async () => {
        repositories.patientRepo.findById.mockResolvedValue(null);
        repositories.episodeRepo.findAllByPatientId.mockResolvedValue([]);

        await expect(getPatientDetailData('patient-foreign')).rejects.toBeInstanceOf(PatientNotFoundError);

        expect(repositories.episodeRepo.findAllByPatientId).toHaveBeenCalledWith('patient-foreign');
        expect(repositories.encounterRepo.findNextPlannedByPatientIdAndPractitionerId).not.toHaveBeenCalled();
        expect(repositories.encounterRepo.findInitialByEpisodeOfCareId).not.toHaveBeenCalled();
        expect(repositories.encounterRepo.findAllByEpisodeOfCareId).not.toHaveBeenCalled();
        expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalled();
        expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalled();
        expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalled();
    });
});
