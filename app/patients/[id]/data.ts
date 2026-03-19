import type { Patient } from "@/domain/patients/patient";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Procedure } from "@/domain/procedures/procedure";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "@/domain/assessments/necpal-assessment";
import type { EcogAssessment } from "@/domain/assessments/ecog-assessment";
import type { PlanOfCare } from "@/domain/plan-of-care/plan-of-care";
import type { ReAssessmentEntry } from "@/app/patients/components/detail/ReAssessmentSection";

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
import { createEcogAssessmentRepository } from "@/infrastructure/fhir/factories/ecog-assessment.factory";

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
    ecogAssessment: EcogAssessment | null;
    planOfCare: PlanOfCare | null;
    reAssessmentEntries: ReAssessmentEntry[];
}

function isPastEncounterDate(periodStart: string, now: Date): boolean {
    const timestamp = Date.parse(periodStart);
    return !Number.isNaN(timestamp) && timestamp < now.getTime();
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
    const ecogRepo = createEcogAssessmentRepository();
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

    const [barthelAssessment, necpalAssessment, ecogAssessment, planOfCare] = await Promise.all([
        initialEncounter
            ? barthelRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<BarthelAssessment | null>(null),
        initialEncounter
            ? necpalRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<NecpalAssessment | null>(null),
        initialEncounter
            ? ecogRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<EcogAssessment | null>(null),
        initialEncounter
            ? planRepo.findByEncounterId(initialEncounter.id)
            : Promise.resolve<PlanOfCare | null>(null),
    ]);

    const now = new Date();

    const reAssessmentEncounters = activeEpisode
        ? (
            await encounterRepo.findAllByEpisodeOfCareId(activeEpisode.id)
        )
            .filter(
                (e) =>
                    e.visitType === "re-assessment"
                    && e.status === "finished"
                    && isPastEncounterDate(e.periodStart, now)
            )
            .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
        : [];

    const reAssessmentEntries: ReAssessmentEntry[] = (
        await Promise.all(
            reAssessmentEncounters.map(async (encounter) => {
                const [barthel, planOfCare] = await Promise.all([
                    barthelRepo.findByEncounterId(encounter.id),
                    planRepo.findByEncounterId(encounter.id),
                ]);
                return {
                    encounter,
                    assessments: barthel ? [barthel] : [],
                    planOfCare,
                };
            })
        )
    ).filter(
        (entry) => entry.assessments.length > 0 || entry.planOfCare !== null
    );

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
        ecogAssessment,
        planOfCare,
        reAssessmentEntries,
    };
}
