import { FhirClient } from "../../lib/fhir/fhir-client";
import {
    safeGetEntries,
} from "../../lib/fhir/bundle-utils";
import {
    fhirEpisodeOfCareSchema,
    FhirEpisodeOfCare,
    fhirConditionSchema,
    FhirCondition,
    fhirCoverageSchema,
    FhirCoverage,
    fhirPractitionerSchema,
    FhirPractitioner,
} from "./schemas/episode-of-care.schema";
import {
    mapFhirEpisodeOfCareToDomain,
} from "./mappers/episode-of-care.mapper";

import type {
    EpisodeOfCareRepository,
} from "../../domain/episode-of-care.repository";
import type { EpisodeOfCare } from "../../domain/episode-of-care";


export class EpisodeOfCareFhirRepository implements EpisodeOfCareRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    /* helpers for validation/mapping */
    private parseEpisode(obj: unknown): FhirEpisodeOfCare | null {
        const parsed = fhirEpisodeOfCareSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    private parseCondition(obj: unknown): FhirCondition | null {
        const parsed = fhirConditionSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    private parseCoverage(obj: unknown): FhirCoverage | null {
        const parsed = fhirCoverageSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    private parsePractitioner(obj: unknown): FhirPractitioner | null {
        const parsed = fhirPractitionerSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    public async findActiveByPatientId(patientId: string): Promise<EpisodeOfCare | null> {
        const bundle = await this.client.search<unknown>("EpisodeOfCare", {
            patient: patientId,
            status: "active",
            _include: "EpisodeOfCare:condition",
        });

        const entries = safeGetEntries(bundle);
        if (entries.length === 0) return null;

        const episodeEntry = entries.find(
            (e) => e.resource?.resourceType === "EpisodeOfCare"
        );
        const conditionEntry = entries.find(
            (e) => e.resource?.resourceType === "Condition"
        );

        if (!episodeEntry?.resource || !conditionEntry?.resource) return null;

        const ep = this.parseEpisode(episodeEntry.resource);
        const cond = this.parseCondition(conditionEntry.resource);
        if (!ep || !cond) return null;

        // fetch coverage separately
        let cov: FhirCoverage | undefined;
        try {
            const covBundle = await this.client.search<unknown>("Coverage", {
                patient: patientId,
                status: "active",
            });
            const covEntries = safeGetEntries(covBundle);
            const first = covEntries.find((e) => e.resource)?.resource;
            if (first) {
                const parsedCov = this.parseCoverage(first);
                if (parsedCov) cov = parsedCov;
            }
        } catch {
            // tolerate missing coverage by leaving `cov` undefined
        }

        // optionally resolve practitioner
        let prac: FhirPractitioner | undefined;
        if (typeof ep.careManager?.reference === "string") {
            const parts = ep.careManager.reference.split("/");
            const id = parts[parts.length - 1];
            try {
                const res = await this.client.read<FhirPractitioner>(
                    "Practitioner",
                    id
                );
                const parsedPr = this.parsePractitioner(res);
                if (parsedPr) prac = parsedPr;
            } catch {
                // ignore errors retrieving practitioner
            }
        }

        return mapFhirEpisodeOfCareToDomain(ep, cond, cov, prac);
    }

    public async findAllByPatientId(patientId: string): Promise<EpisodeOfCare[]> {
        const bundle = await this.client.search<unknown>("EpisodeOfCare", {
            patient: patientId,
            _sort: "-date",
            _include: "EpisodeOfCare:condition",
        });

        const entries = safeGetEntries(bundle);
        if (entries.length === 0) return [];

        // pre-fetch active coverage once
        let cov: FhirCoverage | undefined;
        try {
            const covBundle = await this.client.search<unknown>("Coverage", {
                patient: patientId,
                status: "active",
            });
            const covEntries = safeGetEntries(covBundle);
            const first = covEntries.find((e) => e.resource)?.resource;
            if (first) {
                const parsedCov = this.parseCoverage(first);
                if (parsedCov) cov = parsedCov;
            }
        } catch {
            // swallow
        }

        // group conditions by reference id for easy lookup
        const conditionMap: Record<string, FhirCondition> = {};
        for (const e of entries) {
            if (e.resource?.resourceType === "Condition") {
                const c = this.parseCondition(e.resource);
                if (c) conditionMap[c.id] = c;
            }
        }

        const results: EpisodeOfCare[] = [];

        for (const e of entries) {
            if (e.resource?.resourceType !== "EpisodeOfCare") continue;
            const ep = this.parseEpisode(e.resource);
            if (!ep) continue;

            // try to find matching condition via diagnosis reference
            let cond: FhirCondition | undefined;
            const ref = ep.diagnosis?.[0]?.condition?.reference;
            if (typeof ref === "string") {
                const parts = ref.split("/");
                const id = parts[parts.length - 1];
                cond = conditionMap[id];
            }
            if (!cond) continue; // skip episodes missing condition

            // optionally fetch practitioner per episode
            let prac: FhirPractitioner | undefined;
            if (typeof ep.careManager?.reference === "string") {
                const parts = ep.careManager.reference.split("/");
                const id = parts[parts.length - 1];
                try {
                    const res = await this.client.read<FhirPractitioner>(
                        "Practitioner",
                        id
                    );
                    const parsedPr = this.parsePractitioner(res);
                    if (parsedPr) prac = parsedPr;
                } catch {
                    /* ignore */
                }
            }

            results.push(mapFhirEpisodeOfCareToDomain(ep, cond, cov, prac));
        }

        return results;
    }
}
