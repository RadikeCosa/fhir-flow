import type { Encounter } from "@/domain/encounters/encounter";
import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";
import {
  createAssessmentRepository,
  createEncounterRepository,
  createProcedureRepository,
  createVitalSignRecordRepository,
} from "@/infrastructure/fhir/factories";

export interface RegisterEncounterContinuationData {
  encounter: Encounter;
  inProgressInitialValues: InProgressEncounterDetailInitialValues;
}

export async function getRegisterEncounterContinuationData(
  patientId: string,
  encounterId: string,
): Promise<RegisterEncounterContinuationData | null> {
  const encounterRepo = createEncounterRepository();
  const encounter = await encounterRepo.findById(encounterId);

  if (!encounter) return null;
  if (encounter.patientId !== patientId) return null;
  if (encounter.status !== "in-progress") return null;

  const vitalSignRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();
  const procedureRepo = createProcedureRepository();

  const [vitalSigns, evaAssessments, procedures] = await Promise.all([
    vitalSignRepo.findAllByEncounterId(encounterId),
    assessmentRepo.findEvaByEncounterId(encounterId),
    procedureRepo.findAllByEncounterId(encounterId),
  ]);

  return {
    encounter,
    inProgressInitialValues: {
      encounterId: encounter.id,
      clinicalNote: encounter.clinicalNote,
      reasonDisplay: encounter.reasonDisplay,
      vitalSigns,
      evaAssessments,
      procedures,
    },
  };
}
