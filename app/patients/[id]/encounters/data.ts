import type { Patient } from "@/domain/patients/patient";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Procedure } from "@/domain/procedures/procedure";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { BarthelAssessment } from "@/domain/assessments/barthel-assessment";
import type { NecpalAssessment } from "@/domain/assessments/necpal-assessment";
import type { EcogAssessment } from "@/domain/assessments/ecog-assessment";

import {
    createPatientRepository,
    createEpisodeOfCareRepository,
    createEncounterRepository,
    createVitalSignRecordRepository,
    createAssessmentRepository,
    createProcedureRepository,
    createBarthelAssessmentRepository,
    createNecpalAssessmentRepository,
    createEcogAssessmentRepository,
} from "@/infrastructure/fhir/factories";

import { PatientNotFoundError } from "../data";

export { PatientNotFoundError };

export interface EncountersPageData {
    patient: Patient;
    activeEpisode: EpisodeOfCare | null;
    encounters: Encounter[];
    vitalSigns: VitalSignRecord[];
    evaRecords: EvaAssessment[];
    vitalsByEncounterId: Record<string, VitalSignRecord[]>;
    evaByEncounterId: Record<string, EvaAssessment[]>;
    barthelByEncounterId: Record<string, BarthelAssessment | null>;
    necpalByEncounterId: Record<string, NecpalAssessment | null>;
    ecogByEncounterId: Record<string, EcogAssessment | null>;
    proceduresByEncounterId: Record<string, Procedure[]>;
}

export async function getEncountersPageData(
    patientId: string
): Promise<EncountersPageData> {
    const patientRepo = createPatientRepository();
    const episodeRepo = createEpisodeOfCareRepository();
    const encounterRepo = createEncounterRepository();
    const vitalRepo = createVitalSignRecordRepository();
    const assessmentRepo = createAssessmentRepository();
    const procedureRepo = createProcedureRepository();
    const barthelRepo = createBarthelAssessmentRepository();
    const necpalRepo = createNecpalAssessmentRepository();
    const ecogRepo = createEcogAssessmentRepository();

    const [patient, episodes] = await Promise.all([
        patientRepo.findById(patientId),
        episodeRepo.findAllByPatientId(patientId),
    ]);

    if (!patient) {
        throw new PatientNotFoundError(patientId);
    }

    const activeEpisode = episodes.find((e) => e.status === "active") ?? null;

    if (!activeEpisode) {
        return {
            patient,
            activeEpisode: null,
            encounters: [],
            vitalSigns: [],
            evaRecords: [],
            vitalsByEncounterId: {},
            evaByEncounterId: {},
            barthelByEncounterId: {},
            necpalByEncounterId: {},
            ecogByEncounterId: {},
            proceduresByEncounterId: {},
        };
    }

    const encountersRaw = await encounterRepo.findAllByEpisodeOfCareId(
        activeEpisode.id
    );

    // Sort encounters newest first
    const encounters = [...encountersRaw].sort((a, b) =>
        a.periodStart < b.periodStart ? 1 : a.periodStart > b.periodStart ? -1 : 0
    );

    const [
        vitalArrays,
        evaArrays,
        procedureArrays,
        barthelArrays,
        necpalArrays,
        ecogArrays,
    ] = await Promise.all([
        Promise.all(encounters.map((e) => vitalRepo.findAllByEncounterId(e.id))),
        Promise.all(encounters.map((e) => assessmentRepo.findEvaByEncounterId(e.id))),
        Promise.all(encounters.map((e) => procedureRepo.findAllByEncounterId(e.id))),
        Promise.all(encounters.map((e) => barthelRepo.findByEncounterId(e.id))),
        Promise.all(encounters.map((e) => necpalRepo.findByEncounterId(e.id))),
        Promise.all(encounters.map((e) => ecogRepo.findByEncounterId(e.id))),
    ]);

    // Longitudinal series for the episode charts panel
    const vitalSigns = vitalArrays.flat();
    const evaRecords = evaArrays.flat();

    // Per-encounter maps
    const vitalsByEncounterId: Record<string, VitalSignRecord[]> = {};
    const evaByEncounterId: Record<string, EvaAssessment[]> = {};
    const barthelByEncounterId: Record<string, BarthelAssessment | null> = {};
    const necpalByEncounterId: Record<string, NecpalAssessment | null> = {};
    const ecogByEncounterId: Record<string, EcogAssessment | null> = {};
    const proceduresByEncounterId: Record<string, Procedure[]> = {};

    encounters.forEach((enc, i) => {
        vitalsByEncounterId[enc.id] = vitalArrays[i];
        evaByEncounterId[enc.id] = evaArrays[i];
        barthelByEncounterId[enc.id] = barthelArrays[i];
        necpalByEncounterId[enc.id] = necpalArrays[i];
        ecogByEncounterId[enc.id] = ecogArrays[i];
        proceduresByEncounterId[enc.id] = procedureArrays[i];
    });

    return {
        patient,
        activeEpisode,
        encounters,
        vitalSigns,
        evaRecords,
        vitalsByEncounterId,
        evaByEncounterId,
        barthelByEncounterId,
        necpalByEncounterId,
        ecogByEncounterId,
        proceduresByEncounterId,
    };
}
