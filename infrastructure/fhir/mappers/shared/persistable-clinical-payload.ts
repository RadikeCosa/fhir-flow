import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";

/**
 * Minimal persistable clinical payload needed to build Observation/Procedure
 * resources for encounter lifecycle write flows.
 */
export type PersistableClinicalPayload = Pick<
    FinalizeEncounterInput,
    | "encounterId"
    | "patientId"
    | "performerId"
    | "practitionerName"
    | "actualEndAt"
    | "heartRate"
    | "respiratoryRate"
    | "oxygenSaturation"
    | "bodyTemperature"
    | "bloodPressureSystolic"
    | "bloodPressureDiastolic"
    | "evaScore"
    | "procedures"
>;
