import type {
    EncounterProgressClinicalPayload,
    FinishedEncounterClinicalPayload,
    SaveEncounterProgressInput,
    FinalizeEncounterInput,
} from "../../../../domain/encounters/encounter.write-input";

/**
 * Clinical data that can be persisted independently of encounter lifecycle
 * transitions (e.g. observation/procedure content from the finalize form).
 */
export type PersistableClinicalPayload = Pick<
    FinishedEncounterClinicalPayload & EncounterProgressClinicalPayload,
    | "heartRate"
    | "respiratoryRate"
    | "oxygenSaturation"
    | "bodyTemperature"
    | "bloodPressureSystolic"
    | "bloodPressureDiastolic"
    | "evaScore"
    | "procedures"
>;

/**
 * Technical references required to bind clinical resources to the current
 * encounter/patient/practitioner context.
 */
export type ClinicalResourceContext = Pick<
    FinalizeEncounterInput,
    "encounterId" | "patientId" | "performerId" | "practitionerName"
>;

export interface ClinicalResourceEffectiveContext {
    effectiveDateTime: string;
}

/**
 * Full input required by write mappers that persist clinical resources.
 */
export type PersistableClinicalResourceInput = PersistableClinicalPayload &
    ClinicalResourceContext &
    ClinicalResourceEffectiveContext;

export type PersistableClinicalProgressResourceInput = PersistableClinicalPayload &
    Pick<
        SaveEncounterProgressInput,
        "encounterId" | "patientId" | "performerId" | "practitionerName" | "recordedAt"
    >;
