import type { Patient } from "@/domain/patients/patient";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Procedure } from "@/domain/procedures/procedure";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "@/domain/assessments/necpal-assessment";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";

import {
    createPatientRepository,
    createEpisodeOfCareRepository,
    createEncounterRepository,
    createVitalSignRecordRepository,
    createAssessmentRepository,
    createProcedureRepository,
    createBarthelAssessmentRepository,
    createNecpalAssessmentRepository,
    createPlanOfCareRepository,
} from "@/infrastructure/fhir/factories";

import { currentPractitionerId } from "@/config/fhir.config";

export class PatientNotFoundError extends Error {
    constructor(patientId: string) {
        super(`Patient not found: ${patientId}`);
        this.name = "PatientNotFoundError";
    }
}

export interface PatientDetailData {
    patient: Patient;
    episodes: EpisodeOfCare[];
    lastEncounter: Encounter | null;
    nextPlannedEncounter: Encounter | null;
    initialEncounter: Encounter | null;
    lastEncounterProcedures: Procedure[];
    lastEncounterEvaRecords: EvaAssessment[];
    lastEncounterVitalSigns: VitalSignRecord[];
    barthelAssessment: BarthelAssessment | null;
    necpalAssessment: NecpalAssessment | null;
    planOfCare: PlanOfCare | null;
}

export async function getPatientDetailData(
    patientId: string
): Promise<PatientDetailData> {
    const patientRepo = createPatientRepository();
    const episodeRepo = createEpisodeOfCareRepository();
    const encounterRepo = createEncounterRepository();
    const vitalRepo = createVitalSignRecordRepository();
    const assessmentRepo = createAssessmentRepository();
    const procedureRepo = createProcedureRepository();
    const barthelRepo = createBarthelAssessmentRepository();
    const necpalRepo = createNecpalAssessmentRepository();
    const planRepo = createPlanOfCareRepository();

    const [patient, episodes] = await Promise.all([
        patientRepo.findById(patientId),
        episodeRepo.findAllByPatientId(patientId),
    ]);

    if (!patient) {
        throw new PatientNotFoundError(patientId);
    }

    const activeEpisode = episodes.find((episode) => episode.status === "active");

    const [lastEncounter, nextPlannedEncounter, initialEncounter] = await Promise.all([
        encounterRepo.findLastByPatientIdAndPractitionerId(
            patientId,
            currentPractitionerId
        ),
        encounterRepo.findNextPlannedByPatientIdAndPractitionerId(
            patientId,
            currentPractitionerId
        ),
        activeEpisode
            ? encounterRepo.findInitialByEpisodeOfCareId(activeEpisode.id)
            : Promise.resolve<Encounter | null>(null),
    ]);

    const [
        lastEncounterProcedures,
        lastEncounterEvaRecords,
        lastEncounterVitalSigns,
    ] = await Promise.all([
        lastEncounter
            ? procedureRepo.findAllByEncounterId(lastEncounter.id)
            : Promise.resolve<Procedure[]>([]),
        lastEncounter
            ? assessmentRepo.findEvaByEncounterId(lastEncounter.id)
            : Promise.resolve<EvaAssessment[]>([]),
        lastEncounter
            ? vitalRepo.findAllByEncounterId(lastEncounter.id)
            : Promise.resolve<VitalSignRecord[]>([]),
    ]);

    const [barthelAssessment, necpalAssessment, planOfCare] = await Promise.all([
        initialEncounter
            ? barthelRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<BarthelAssessment | null>(null),
        initialEncounter
            ? necpalRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<NecpalAssessment | null>(null),
        initialEncounter
            ? planRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<PlanOfCare | null>(null),
    ]);

    return {
        patient,
        episodes,
        lastEncounter,
        nextPlannedEncounter,
        initialEncounter,
        lastEncounterProcedures,
        lastEncounterEvaRecords,
        lastEncounterVitalSigns,
        barthelAssessment,
        necpalAssessment,
        planOfCare,
    };
}
