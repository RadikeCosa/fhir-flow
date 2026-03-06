/**
 * Closed union of all supported assessment tools.
 *
 * The set of values will grow as new assessment types are
 * implemented. Each value corresponds to a specific clinical
 * assessment tool and is used as a discriminator in the
 * domain model.
 */
export type AssessmentType = "eva";

/**
 * Shared base model for all assessments.
 *
 * Specific assessment types extend this interface with fields
 * relevant to that tool. The `type` field serves as a
 * discriminator, allowing TypeScript to narrow on the concrete
 * assessment type in a type-safe manner.
 */
export interface BaseAssessment {
    id: string;
    patientId: string;
    /** ISO date string in YYYY-MM-DD format */
    date: string;
    type: AssessmentType;
    recordedBy: {
        id: string;
        display: string;
    };
}
