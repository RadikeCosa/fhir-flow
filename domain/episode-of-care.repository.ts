import type { EpisodeOfCare } from "./episode-of-care";

/**
 * Domain-level interface for retrieving episode of care data.  This keeps the
 * rest of the application decoupled from whatever underlying storage or
 * transport layer is used (FHIR, database, etc.).
 */
export interface EpisodeOfCareRepository {
    /**
     * Return all episodes for a patient, sorted by start date descending.  If
     * none exist an empty array is returned.
     */
    findAllByPatientId(patientId: string): Promise<EpisodeOfCare[]>;
}
