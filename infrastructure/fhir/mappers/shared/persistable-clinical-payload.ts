import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";

/**
 * Context required to reference existing resources when building persistable
 * clinical resources.
 */
export type ClinicalResourceContext = Pick<
    FinalizeEncounterInput,
    | "encounterId"
    | "patientId"
    | "performerId"
    | "practitionerName"
    | "actualEndAt"
>;

/**
 * Minimal persistable clinical payload (data captured during the encounter),
 * intentionally excluding lifecycle/identity fields.
 */
export type PersistableClinicalPayload = Pick<
    FinalizeEncounterInput,
    | "heartRate"
    | "respiratoryRate"
    | "oxygenSaturation"
    | "bodyTemperature"
    | "bloodPressureSystolic"
    | "bloodPressureDiastolic"
    | "evaScore"
    | "procedures"
>;
