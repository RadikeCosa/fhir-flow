import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { Practitioner } from "@/domain/practitioners/practitioner";

import {
    createEncounterRepository,
    createPatientRepository,
} from "@/infrastructure/fhir/factories";

import { getCurrentPractitioner } from "@/lib/server/current-practitioner";

export interface EncounterDetailData {
    encounter: Encounter | null;
    patient: Patient | null;
    practitioner: Practitioner;
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

    return {
        encounter: normalizedEncounter,
        patient,
        practitioner,
    };
}
