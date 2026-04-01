import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";

import {
    createEncounterRepository,
    createVitalSignRecordRepository,
    createAssessmentRepository,
    createProcedureRepository,
    createPatientRepository,
} from "@/infrastructure/fhir/factories";

import { getCurrentPractitioner } from "@/lib/server/current-practitioner";

export interface EncounterDetailData {
    encounter: Encounter | null;
    patient: Patient | null;
    practitionerName: string | null;
    vitalSigns: VitalSignRecord[];
    evaRecords: EvaAssessment[];
    procedures: Procedure[];
    inProgressInitialValues?: InProgressEncounterDetailInitialValues;
}

export async function getEncounterDetailData(
    patientId: string,
    encounterId: string
): Promise<EncounterDetailData> {
    const encounterRepo = createEncounterRepository();
    const patientRepo = createPatientRepository();

    const [encounter, patient] = await Promise.all([
        encounterRepo.findById(encounterId),
        patientRepo.findById(patientId),
    ]);

    // Evita rendering de encounters de otro paciente: ruta inconsistente
    const normalizedEncounter =
        encounter && encounter.patientId !== patientId ? null : encounter;

    if (!normalizedEncounter) {
        return {
            encounter: null,
            patient,
            practitionerName: null,
            vitalSigns: [],
            evaRecords: [],
            procedures: [],
            inProgressInitialValues: undefined,
        };
    }

    const isInProgressEncounter = normalizedEncounter.status === "in-progress";

    const practitionerName = isInProgressEncounter
        ? (await getCurrentPractitioner()).displayName
        : null;

    let vitalSigns: VitalSignRecord[] = [];
    let evaRecords: EvaAssessment[] = [];
    let procedures: Procedure[] = [];

    const shouldLoadEncounterClinicalData =
        normalizedEncounter.status === "finished" ||
        normalizedEncounter.status === "in-progress";

    if (shouldLoadEncounterClinicalData) {
        const vitalSignRepo = createVitalSignRecordRepository();
        const assessmentRepo = createAssessmentRepository();
        const procedureRepo = createProcedureRepository();

        [vitalSigns, evaRecords, procedures] = await Promise.all([
            vitalSignRepo.findAllByEncounterId(encounterId),
            assessmentRepo.findEvaByEncounterId(encounterId),
            procedureRepo.findAllByEncounterId(encounterId),
        ]);
        console.info("[eva-read][loader][evaRecords]", {
            encounterId,
            count: evaRecords.length,
            items: evaRecords.map((item) => ({
                id: item.id,
                date: item.date,
                score: item.score,
                encounterId: item.encounterId,
            })),
        });
    }

    const inProgressInitialValues: InProgressEncounterDetailInitialValues | undefined =
        isInProgressEncounter
            ? {
                  encounterId: normalizedEncounter.id,
                  clinicalNote: normalizedEncounter.clinicalNote,
                  reasonDisplay: normalizedEncounter.reasonDisplay,
                  vitalSigns,
                  evaAssessments: evaRecords,
                  procedures,
              }
            : undefined;

    if (inProgressInitialValues) {
        console.info("[eva-read][loader][initial-evaAssessments]", {
            encounterId,
            count: inProgressInitialValues.evaAssessments.length,
            items: inProgressInitialValues.evaAssessments.map((item) => ({
                id: item.id,
                date: item.date,
                score: item.score,
                encounterId: item.encounterId,
            })),
        });
    }

    return {
        encounter: normalizedEncounter,
        patient,
        practitionerName,
        vitalSigns,
        evaRecords,
        procedures,
        inProgressInitialValues,
    };
}
