/*
 * Domain model for the Plan of Care.
 *
 * This file lives entirely within the domain layer and uses only primitives
 * and simple structures needed by application logic and UI. It makes no
 * reference to FHIR types or external representations.
 */

/**
 * The Plan of Care is established during the initial evaluation encounter and
 * serves as the clinical reference for all subsequent follow-up visits.
 * Goals and activities are resolved and embedded here — the UI never needs to
 * fetch them separately.
 */
export interface PlanOfCare {
    id: string;
    status: PlanOfCareStatus;
    patientId: string;
    episodeOfCareId: string;
    /** The initial encounter where the plan was created */
    encounterId: string;
    /** ISO date string representing the start of the plan period */
    periodStart: string;
    /** ISO date string representing the planned end of treatment */
    periodEnd?: string;
    goals: CareGoal[];
    activities: PlannedActivity[];
    /** Free text: clinician's rationale for the plan */
    clinicalReasoning?: string;
    authorId?: string;
    authorName?: string;
    /** ISO datetime string when the plan was created */
    createdAt: string;
}

export type PlanOfCareStatus =
    | "draft"
    | "active"
    | "completed"
    | "cancelled";

export type CareGoalStatus =
    | "proposed"
    | "accepted"
    | "active"
    | "completed"
    | "cancelled";

export type CareGoalCategory = "short-term" | "long-term";

export interface CareGoal {
    id: string;
    description: string;
    category: CareGoalCategory;
    status: CareGoalStatus;
    /** ISO date string for expected achievement */
    targetDate?: string;
}

export type ActivityStatus =
    | "not-started"
    | "in-progress"
    | "completed"
    | "cancelled";

export interface PlannedActivity {
    id: string;
    description: string;
    frequencyPerWeek?: number;
    status: ActivityStatus;
}
