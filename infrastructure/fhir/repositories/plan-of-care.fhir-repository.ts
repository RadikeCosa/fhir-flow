import { FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetEntries } from "../../../lib/fhir/bundle-utils";
import {
    fhirCarePlanSchema,
    FhirCarePlan,
    fhirGoalSchema,
    FhirGoal,
} from "../schemas/plan-of-care.schema";
import { mapFhirCarePlanToDomain } from "../mappers/plan-of-care.mapper";

import type { PlanOfCareRepository } from "../../../domain/plan-of-care/plan-of-care.repository";
import type { PlanOfCare } from "../../../domain/plan-of-care/plan-of-care";

/**
 * FHIR-based implementation of the `PlanOfCareRepository` contract.
 */
export class PlanOfCareFhirRepository implements PlanOfCareRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    private parseCarePlan(obj: unknown): FhirCarePlan | null {
        const parsed = fhirCarePlanSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    private parseGoal(obj: unknown): FhirGoal | null {
        const parsed = fhirGoalSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    private async resolveGoals(carePlan: FhirCarePlan): Promise<FhirGoal[]> {
        if (!Array.isArray(carePlan.goal) || carePlan.goal.length === 0) return [];

        // Goals are resolved best-effort — a partial plan is better than no plan
        // when individual Goal resources fail to fetch.
        try {
            const goalIds = carePlan.goal
                .map((g) => (typeof g?.reference === "string" ? g.reference.split("/").pop() : ""))
                .filter((id): id is string => !!id);

            const fetched = await Promise.all(
                goalIds.map(async (id) => {
                    try {
                        const raw = await this.client.read<FhirGoal>("Goal", id);
                        return this.parseGoal(raw);
                    } catch {
                        return null;
                    }
                })
            );

            return fetched.filter((g): g is FhirGoal => g !== null);
        } catch {
            return [];
        }
    }

    public async findByEncounterId(encounterId: string): Promise<PlanOfCare | null> {
        try {
            const bundle = await this.client.search<unknown>("CarePlan", {
                encounter: `Encounter/${encounterId}`,
                status: "active,draft",
                _sort: "-date",
                _count: "1",
            });

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const cp = this.parseCarePlan(e.resource);
                if (!cp) continue;

                const goals = await this.resolveGoals(cp);
                return mapFhirCarePlanToDomain(cp, goals);
            }

            return null;
        } catch {
            throw new Error(`Failed to fetch plan of care for encounter: ${encounterId}`);
        }
    }

    public async findByEpisodeOfCareId(episodeOfCareId: string): Promise<PlanOfCare | null> {
        try {
            // Note: the episode-of-care search param depends on the write
            // implementation storing the reference correctly — verify param
            // name against the HAPI FHIR server when write phase is implemented
            const bundle = await this.client.search<unknown>("CarePlan", {
                "care-plan-episode-of-care": `EpisodeOfCare/${episodeOfCareId}`,
                status: "active",
                _sort: "-date",
                _count: "1",
            });

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const cp = this.parseCarePlan(e.resource);
                if (!cp) continue;

                const goals = await this.resolveGoals(cp);
                return mapFhirCarePlanToDomain(cp, goals);
            }

            return null;
        } catch {
            throw new Error(`Failed to fetch plan of care for episode: ${episodeOfCareId}`);
        }
    }
}
