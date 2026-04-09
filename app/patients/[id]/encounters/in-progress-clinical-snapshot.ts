import type { Encounter } from "@/domain/encounters/encounter";
import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";

import {
  createAssessmentRepository,
  createProcedureRepository,
  createVitalSignRecordRepository,
} from "@/infrastructure/fhir/factories";

export interface EncounterClinicalSnapshot {
  vitalSigns: VitalSignRecord[];
  evaAssessments: EvaAssessment[];
  procedures: Procedure[];
}

export async function loadEncounterClinicalSnapshot(
  encounterId: string,
): Promise<EncounterClinicalSnapshot> {
  const vitalSignRepo = createVitalSignRecordRepository();
  const assessmentRepo = createAssessmentRepository();
  const procedureRepo = createProcedureRepository();

  const [vitalSigns, evaAssessments, procedures] = await Promise.all([
    vitalSignRepo.findAllByEncounterId(encounterId),
    assessmentRepo.findEvaByEncounterId(encounterId),
    procedureRepo.findAllByEncounterId(encounterId),
  ]);

  return {
    vitalSigns,
    evaAssessments,
    procedures,
  };
}

export function buildInProgressInitialValues(
  encounter: Encounter,
  clinicalSnapshot: EncounterClinicalSnapshot,
): InProgressEncounterDetailInitialValues {
  return {
    encounterId: encounter.id,
    clinicalNote: encounter.clinicalNote,
    reasonDisplay: encounter.reasonDisplay,
    vitalSigns: clinicalSnapshot.vitalSigns,
    evaAssessments: clinicalSnapshot.evaAssessments,
    procedures: clinicalSnapshot.procedures,
  };
}
