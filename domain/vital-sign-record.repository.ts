import type { VitalSignRecord } from "./vital-sign-record";

/**
 * Domain-level interface for retrieving Vital Sign records. This keeps the
 * rest of the application decoupled from the underlying FHIR Observations
 * or storage format.
 */
export interface VitalSignRecordRepository {
    /**
     * Return all vital sign records for a patient, sorted by date
     * descending. If none exist an empty array is returned.
     */
    findAllByPatientId(patientId: string): Promise<VitalSignRecord[]>;

    /**
     * Return all vital sign records associated with a specific encounter.
     * The FHIR server is queried by encounter reference; results are
     * otherwise treated identically to `findAllByPatientId`. An empty array is
     * returned when there are no records or all returned resources fail
     * schema validation.
     */
    findAllByEncounterId(encounterId: string): Promise<VitalSignRecord[]>;
}
