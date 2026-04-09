import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";
import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";

import {
    createEncounterRepository,
    createPatientRepository,
} from "@/infrastructure/fhir/factories";

import { getCurrentPractitioner } from "@/lib/server/current-practitioner";
import {
    buildInProgressInitialValues,
    loadEncounterClinicalSnapshot,
} from "../in-progress-clinical-snapshot";

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
        const clinicalSnapshot = await loadEncounterClinicalSnapshot(encounterId);

        vitalSigns = clinicalSnapshot.vitalSigns;
        evaRecords = clinicalSnapshot.evaAssessments;
        procedures = clinicalSnapshot.procedures;
    }

    const inProgressInitialValues: InProgressEncounterDetailInitialValues | undefined =
        isInProgressEncounter
            ? buildInProgressInitialValues(normalizedEncounter, {
                  vitalSigns,
                  evaAssessments: evaRecords,
                  procedures,
              })
            : undefined;

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
