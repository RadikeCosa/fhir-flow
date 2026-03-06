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
}
