/**
 * Closed union of all supported assessment tools.
 *
 * The set of values grows as new assessment types are implemented.
 * Currently supported instruments are:
 * - "eva" (pain scale)
 * - "barthel" (Barthel index)
 * - "necpal" (palliative care screening)
 *
 * Add additional values here as new assessment instruments are added.
 */
export type AssessmentType = "eva" | "barthel" | "necpal" | "ecog";

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
    recordedBy?: {
        id: string;
        display: string;
    };
}
