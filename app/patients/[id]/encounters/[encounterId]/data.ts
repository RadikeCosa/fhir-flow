import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { Practitioner } from "@/domain/practitioners/practitioner";

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
    practitioner: Practitioner;
    vitalSigns: VitalSignRecord[];
    evaRecords: EvaAssessment[];
    procedures: Procedure[];
}

export async function getEncounterDetailData(
    patientId: string,
    encounterId: string
): Promise<EncounterDetailData> {
    const encounterRepo = createEncounterRepository();
    const patientRepo = createPatientRepository();

    const [encounter, patient, practitioner] = await Promise.all([
        encounterRepo.findById(encounterId),
        patientRepo.findById(patientId),
        getCurrentPractitioner(),
    ]);

    // Evita rendering de encounters de otro paciente: ruta inconsistente
    const normalizedEncounter =
        encounter && encounter.patientId !== patientId ? null : encounter;

    if (!normalizedEncounter) {
        return {
            encounter: null,
            patient,
            practitioner,
            vitalSigns: [],
            evaRecords: [],
            procedures: [],
        };
    }

    let vitalSigns: VitalSignRecord[] = [];
    let evaRecords: EvaAssessment[] = [];
    let procedures: Procedure[] = [];

    if (normalizedEncounter.status === "finished") {
        const vitalSignRepo = createVitalSignRecordRepository();
        const assessmentRepo = createAssessmentRepository();
        const procedureRepo = createProcedureRepository();

        [vitalSigns, evaRecords, procedures] = await Promise.all([
            vitalSignRepo.findAllByEncounterId(encounterId),
            assessmentRepo.findEvaByEncounterId(encounterId),
            procedureRepo.findAllByEncounterId(encounterId),
        ]);
    }

    return {
        encounter: normalizedEncounter,
        patient,
        practitioner,
        vitalSigns,
        evaRecords,
        procedures,
    };
}
