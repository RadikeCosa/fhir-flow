import type { Encounter } from "@/domain/encounters/encounter";
import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";
import { createEncounterRepository } from "@/infrastructure/fhir/factories";
import {
  buildInProgressInitialValues,
  loadEncounterClinicalSnapshot,
} from "../in-progress-clinical-snapshot";

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

  const clinicalSnapshot = await loadEncounterClinicalSnapshot(encounterId);

  return {
    encounter,
    inProgressInitialValues: buildInProgressInitialValues(
      encounter,
      clinicalSnapshot,
    ),
  };
}
