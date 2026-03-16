import { EcogAssessment } from "./ecog-assessment";

/**
 * Repository contract for ECOG assessments.  Implementations in
 * the infrastructure layer will handle mapping from FHIR or other
 * persistence formats into the clean domain model.
 */
export interface EcogAssessmentRepository {
    /**
     * Return the assessment associated with a particular encounter, if any.
     */
    findByEncounterId(encounterId: string): Promise<EcogAssessment | null>;

    /**
     * Get the most recent ECOG assessment for a given patient.
     * This is useful for displaying the latest functional status.
     */
    findLatestByPatientId(patientId: string): Promise<EcogAssessment | null>;
}
