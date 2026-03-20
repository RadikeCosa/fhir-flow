import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { Practitioner } from "@/domain/practitioners/practitioner";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";

import {
    createEncounterRepository,
    createPatientRepository,
    createVitalSignRecordRepository,
    createAssessmentRepository,
    createProcedureRepository,
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
    const vitalRepo = createVitalSignRecordRepository();
    const assessmentRepo = createAssessmentRepository();
    const procedureRepo = createProcedureRepository();

    const [encounter, patient, practitioner] = await Promise.all([
        encounterRepo.findById(encounterId),
        patientRepo.findById(patientId),
        getCurrentPractitioner(),
    ]);

    // If encounter is not finished, return empty arrays for clinical data
    if (!encounter || encounter.status !== "finished") {
        return {
            encounter,
            patient,
            practitioner,
            vitalSigns: [],
            evaRecords: [],
            procedures: [],
        };
    }

    // If encounter is finished, fetch all associated clinical data
    const [vitalSigns, evaRecords, procedures] = await Promise.all([
        vitalRepo.findAllByEncounterId(encounterId),
        assessmentRepo.findEvaByEncounterId(encounterId),
        procedureRepo.findAllByEncounterId(encounterId),
    ]);

    return {
        encounter,
        patient,
        practitioner,
        vitalSigns,
        evaRecords,
        procedures,
    };
}
