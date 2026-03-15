/*
 * Domain model for the Barthel Index functional assessment.
 *
 * This file lives entirely within the domain layer and uses only
 * primitives and simple structures needed by application logic and UI.
 * It makes no reference to FHIR types or external representations.
 */

import type { BaseAssessment } from "./base-assessment";

/**
 * Each activity that is scored as part of the Barthel index.
 * Using a union of string literals keeps the set of activities
 * explicit and stable.
 */
export type BarthelActivityKey =
    | "feeding"
    | "bathing"
    | "grooming"
    | "dressing"
    | "bowel"
    | "bladder"
    | "toilet"
    | "transfer"
    | "mobility"
    | "stairs";

/**
 * One scored item within a Barthel assessment.
 */
export interface BarthelItem {
    activity: BarthelActivityKey;
    score: number;
    maxScore: number;
}

/**
 * Interpretation of the total Barthel score used by the application.
 */
export type BarthelFunctionalLevel =
    | "independent"
    | "mild-dependency"
    | "moderate-dependency"
    | "severe-dependency"
    | "total-dependency";

/**
 * Core domain representation of a Barthel assessment.
 */
export interface BarthelAssessment extends BaseAssessment {
    readonly type: "barthel";

    encounterId: string;

    totalScore: number;
    functionalLevel: BarthelFunctionalLevel;
    items: BarthelItem[];

    /**
     * Not all Barthel observations include a performer in FHIR, so this is
     * optional in the domain model.
     */
    recordedBy?: {
        id: string;
        display: string;
    };
}

/**
 * Pure helper for deriving the functional level from a total score.
 * Ranges are inclusive and based on Widely‑used Barthel index cutoffs.
 */
export function computeBarthelFunctionalLevel(
    score: number
): BarthelFunctionalLevel {
    if (score >= 91 && score <= 100) {
        return "independent";
    }
    if (score >= 61 && score <= 90) {
        return "mild-dependency";
    }
    if (score >= 41 && score <= 60) {
        return "moderate-dependency";
    }
    if (score >= 21 && score <= 40) {
        return "severe-dependency";
    }
    // anything below 21
    return "total-dependency";
}
