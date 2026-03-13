import { BarthelAssessment } from "./barthel-assessment";

/**
 * Repository contract for Barthel assessments.  Implementations in
 * the infrastructure layer will handle mapping from FHIR or other
 * persistence formats into the clean domain model.
 */
export interface BarthelAssessmentRepository {
    /**
     * Return the assessment associated with a particular encounter, if any.
     */
    findByEncounterId(encounterId: string): Promise<BarthelAssessment | null>;

    /**
     * Get the most recent Barthel assessment for a given patient.
     * This is useful for displaying the latest functional status.
     */
    findLatestByPatientId(patientId: string): Promise<BarthelAssessment | null>;
}
