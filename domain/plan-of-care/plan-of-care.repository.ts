import { PlanOfCare } from "./plan-of-care";

/**
 * Read-only repository contract for Plan of Care.
 *
 * Write methods (create, update) will be added in the global write phase
 * alongside all other write repositories.
 */
export interface PlanOfCareRepository {
    /**
     * Returns the plan of care created during the given encounter, or null if none exists yet.
     */
    findByEncounterId(encounterId: string): Promise<PlanOfCare | null>;

    /**
     * Returns the active plan of care for the given episode, or null if none exists.
     * Used by follow-up encounter views to display the plan as context.
     */
    findByEpisodeOfCareId(episodeOfCareId: string): Promise<PlanOfCare | null>;
}
