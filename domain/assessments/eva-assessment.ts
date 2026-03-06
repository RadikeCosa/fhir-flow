import { BaseAssessment } from "./base-assessment";

/**
 * Specific assessment for EVA (pain scale).
 *
 * The `score` is a patient-reported value between 0 and 10.
 * The `type` field is narrowed to the literal "eva"
 * which allows TypeScript to discriminate when working with
 * heterogeneous assessment collections.
 */
export interface EvaAssessment extends BaseAssessment {
    type: "eva";
    /** patient-reported pain score from 0 to 10 */
    score: number;
}

/**
 * Clinical interpretation ranges for EVA scores.
 *
 * Each range has a `min`, `max`, and a human-readable `label`.
 * This constant is readonly and uses `as const` so consumers can
 * rely on the exact literal types.
 */
export const EVA_RANGES = {
    mild: { min: 1, max: 3, label: "Leve" },
    moderate: { min: 4, max: 6, label: "Moderado" },
    severe: { min: 7, max: 9, label: "Intenso" },
    worst: { min: 10, max: 10, label: "Insoportable" },
    none: { min: 0, max: 0, label: "Sin dolor" },
} as const;
