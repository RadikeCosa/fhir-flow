import type { Patient } from "@/domain/patients/patient";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Procedure } from "@/domain/procedures/procedure";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";

import {
    createPatientRepository,
    createEpisodeOfCareRepository,
    createEncounterRepository,
    createVitalSignRecordRepository,
    createAssessmentRepository,
    createProcedureRepository,
} from "@/infrastructure/fhir/factories";
import { getEncounterRepresentativeStart } from "../../../../lib/patient/formatters/encounter.formatters";

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
            proceduresByEncounterId: {},
        };
    }

    const encountersRaw = await encounterRepo.findAllByEpisodeOfCareId(
        activeEpisode.id
    );

    // Sort encounters newest first using representative start semantics.
    const encounters = [...encountersRaw].sort(
        (a, b) =>
            new Date(getEncounterRepresentativeStart(b)).getTime() -
            new Date(getEncounterRepresentativeStart(a)).getTime()
    );

    const [episodeVitalSigns, episodeEvaRecords, episodeProcedures] = await Promise.all([
        vitalRepo.findAllByPatientId(patientId),
        assessmentRepo.findEvaByPatientId(patientId),
        procedureRepo.findAllByPatientId(patientId),
    ]);

    const encounterIds = new Set(encounters.map((encounter) => encounter.id));

    // Longitudinal series for the episode charts panel (active episode only).
    const vitalSigns = episodeVitalSigns.filter(
        (record) =>
            typeof record.encounterId === "string" &&
            encounterIds.has(record.encounterId)
    );
    const evaRecords = episodeEvaRecords.filter(
        (record) =>
            typeof record.encounterId === "string" &&
            encounterIds.has(record.encounterId)
    );
    const procedures = episodeProcedures.filter((procedure) =>
        encounterIds.has(procedure.encounterId)
    );

    // Per-encounter maps
    const vitalsByEncounterId: Record<string, VitalSignRecord[]> = {};
    const evaByEncounterId: Record<string, EvaAssessment[]> = {};
    const proceduresByEncounterId: Record<string, Procedure[]> = {};

    encounters.forEach((encounter) => {
        vitalsByEncounterId[encounter.id] = [];
        evaByEncounterId[encounter.id] = [];
        proceduresByEncounterId[encounter.id] = [];
    });

    vitalSigns.forEach((record) => {
        if (!record.encounterId) return;
        vitalsByEncounterId[record.encounterId]?.push(record);
    });

    evaRecords.forEach((record) => {
        if (!record.encounterId) return;
        evaByEncounterId[record.encounterId]?.push(record);
    });

    procedures.forEach((procedure) => {
        proceduresByEncounterId[procedure.encounterId]?.push(procedure);
    });

    return {
        patient,
        activeEpisode,
        encounters,
        vitalSigns,
        evaRecords,
        vitalsByEncounterId,
        evaByEncounterId,
        proceduresByEncounterId,
    };
}
