import { EvaAssessment } from "./eva-assessment";

/**
 * Repository interface for accessing assessment records.
 *
 * Each method returns data sorted by date in descending order.
 * When no records exist for the query, an empty array must be
 * returned. New methods will be added here as additional
 * assessment types are implemented.
 */
export interface AssessmentRepository {
    findEvaByPatientId(patientId: string): Promise<EvaAssessment[]>;

    /**
     * Retrieve EVA assessments linked to a specific encounter.  Returned
     * results are sorted by date descending.  An empty array is produced if
     * no matching observations exist or if all resources fail validation.
     */
    findEvaByEncounterId(encounterId: string): Promise<EvaAssessment[]>;
}
