/*
 * Domain model for the ECOG Performance Status assessment.
 *
 * This file lives entirely within the domain layer and uses only
 * primitives and simple structures needed by application logic and UI.
 * It makes no reference to FHIR types or external representations.
 */

import type { BaseAssessment } from "./base-assessment";

/**
 * Interpretation of the ECOG score used by the application.
 */
export type EcogPerformanceLevel =
    | "fully-active"
    | "restricted"
    | "ambulatory"
    | "limited-self-care"
    | "disabled";

/**
 * Core domain representation of an ECOG assessment.
 */
export interface EcogAssessment extends BaseAssessment {
    readonly type: "ecog";

    encounterId: string;

    /** ECOG score from 0 (best) to 4 (worst). */
    score: number;
    performanceLevel: EcogPerformanceLevel;

    /**
     * Not all ECOG observations include a performer in FHIR, so this is
     * optional in the domain model.
     */
    recordedBy?: {
        id: string;
        display: string;
    };
}

/**
 * Pure helper for deriving the ECOG performance level from a score.
 * Cutoffs are inclusive and map directly to ECOG values 0 through 4.
 */
export function computeEcogPerformanceLevel(
    score: number
): EcogPerformanceLevel {
    if (score === 0) {
        return "fully-active";
    }
    if (score === 1) {
        return "restricted";
    }
    if (score === 2) {
        return "ambulatory";
    }
    if (score === 3) {
        return "limited-self-care";
    }
    if (score === 4) {
        return "disabled";
    }
    // Safe fallback for invalid values outside 0-4.
    return "disabled";
}
