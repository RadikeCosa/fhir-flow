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

function normalizeDateOnly(value: string): string {
    return value.slice(0, 10);
}

function isLinkedByEncounterId(
    encounterIds: Set<string>,
    encounterId?: string
): boolean {
    return typeof encounterId === "string" && encounterIds.has(encounterId);
}

function isLongitudinallyLinkedByDate(
    encounterDates: Set<string>,
    date: string
): boolean {
    return encounterDates.has(normalizeDateOnly(date));
}

/**
 * Longitudinal read mode (charts/history):
 * keep records linked either by explicit encounterId OR by same-day fallback.
 *
 * NOTE: this fallback must stay local to longitudinal surfaces and must not
 * leak into encounter-centric reads (patient detail / encounter detail).
 */
function filterLongitudinalRecordsByEpisode<T extends { date: string; encounterId?: string }>(
    records: T[],
    encounterIds: Set<string>,
    encounterDates: Set<string>
): T[] {
    return records.filter((record) =>
        isLinkedByEncounterId(encounterIds, record.encounterId)
        || isLongitudinallyLinkedByDate(encounterDates, record.date)
    );
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
    const encounterDates = new Set(
        encounters
            .map((encounter) => getEncounterRepresentativeStart(encounter).slice(0, 10))
            .filter((date) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))
    );

    // Longitudinal series for the episode charts panel (active episode only).
    const vitalSigns = filterLongitudinalRecordsByEpisode(
        episodeVitalSigns,
        encounterIds,
        encounterDates
    );
    const evaRecords = filterLongitudinalRecordsByEpisode(
        episodeEvaRecords,
        encounterIds,
        encounterDates
    );
    const procedures = episodeProcedures.filter((procedure) =>
        encounterIds.has(procedure.encounterId)
    );

    // Encounter-centric read mode:
    // these maps are intentionally strict and only accept explicit encounterId.
    // Date-based fallback is longitudinal-only (see filterLongitudinalRecordsByEpisode).
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
