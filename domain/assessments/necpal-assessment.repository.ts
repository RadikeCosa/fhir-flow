import { NecpalAssessment } from "./necpal-assessment";

/**
 * Repository contract for NECPAL screening assessments.
 *
 * Implementations in the infrastructure layer will handle mapping from FHIR
 * or other persistence formats into the clean domain model.
 */
export interface NecpalAssessmentRepository {
    /**
     * Return the assessment associated with a particular encounter, if any.
     */
    findByEncounterId(encounterId: string): Promise<NecpalAssessment | null>;

    /**
     * Get the most recent NECPAL assessment for a given patient.
     */
    findLatestByPatientId(patientId: string): Promise<NecpalAssessment | null>;
}
