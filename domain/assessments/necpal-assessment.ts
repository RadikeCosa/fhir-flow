/*
 * Domain model for the NECPAL palliative care screening tool.
 *
 * This file lives entirely within the domain layer and uses only
 * primitives and simple structures needed by application logic and UI.
 * It makes no reference to FHIR types or external representations.
 */

/**
 * Set of indicators used by the NECPAL screening tool.
 */
export interface NecpalIndicator {
    /**
     * "Surprise question" response.
     * false = "no me sorprendería" (positive screen)
     */
    surpriseQuestion: boolean;

    /**
     * The patient/family explicitly express needs or request palliative care.
     */
    demandIndicator: boolean;

    /**
     * Presence of uncontrolled symptoms or functional decline.
     */
    needIndicator: boolean;

    /**
     * Specific disease-related indicators (e.g., advanced cancer, organ failure).
     */
    diseaseIndicator: boolean;
}

/**
 * Final NECPAL screening result.
 */
export type NecpalResult = "positive" | "negative";

/**
 * Core domain representation of a NECPAL screening assessment.
 */
export interface NecpalAssessment {
    id: string;
    encounterId: string;
    patientId: string;
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    result: NecpalResult;
    /** true when surpriseQuestion is false ("no me sorprendería") */
    positiveScreen: boolean;
    indicators: NecpalIndicator;
    recordedBy?: {
        id: string;
        display: string;
    };
}

/**
 * Compute the NECPAL screening result from the "surprise question".
 *
 * The surprise question asks: "Would you be surprised if this patient died in the
 * next 12 months?" A "no" answer (surpriseQuestion=false) triggers a positive
 * NECPAL screen, meaning palliative needs are likely present.
 */
export function computeNecpalResult(surpriseQuestion: boolean): NecpalResult {
    return surpriseQuestion ? "negative" : "positive";
}
