import { FhirClient } from "../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../lib/logger";
import {
    safeGetEntries,
} from "../../../lib/fhir/bundle-utils";
import {
    fhirEpisodeOfCareSchema,
    FhirEpisodeOfCare,
    fhirConditionSchema,
    FhirCondition,
    fhirCoverageSchema,
    FhirCoverage,
    fhirServiceRequestSchema,
    FhirServiceRequest,
} from "../schemas/episode-of-care.schema";
import {
    mapFhirEpisodeOfCareToDomain,
} from "../mappers/episode-of-care.mapper";

import type {
    EpisodeOfCareRepository,
} from "../../../domain/episode-of-care/episode-of-care.repository";
import type { EpisodeOfCare } from "../../../domain/episode-of-care/episode-of-care";


export class EpisodeOfCareFhirRepository implements EpisodeOfCareRepository {
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    /* helpers for validation/mapping */
    private parseEpisode(obj: unknown): FhirEpisodeOfCare | null {
        const parsed = fhirEpisodeOfCareSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EpisodeOfCareFhirRepository] EpisodeOfCare validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    private parseCondition(obj: unknown): FhirCondition | null {
        const parsed = fhirConditionSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EpisodeOfCareFhirRepository] Condition validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    private parseCoverage(obj: unknown): FhirCoverage | null {
        const parsed = fhirCoverageSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EpisodeOfCareFhirRepository] Coverage validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    private parseServiceRequest(obj: unknown): FhirServiceRequest | null {
        const parsed = fhirServiceRequestSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EpisodeOfCareFhirRepository] ServiceRequest validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    public async findActiveByPatientId(patientId: string): Promise<EpisodeOfCare | null> {
        const bundle = await this.client.search<unknown>("EpisodeOfCare", {
            patient: patientId,
            status: "active",
            // include the linked Condition and any incoming referral ServiceRequest
            _include: ["EpisodeOfCare:condition", "EpisodeOfCare:incoming-referral"],
        });

        const entries = safeGetEntries(bundle);
        if (entries.length === 0) return null;


        const episodeEntry = entries.find((e) => e.resource?.resourceType === "EpisodeOfCare");
        const conditionEntry = entries.find((e) => e.resource?.resourceType === "Condition");
        // find an included ServiceRequest (incoming referral) when present
        const serviceRequestEntry = entries.find((e) => e.resource?.resourceType === "ServiceRequest");

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

        const parsedSR = serviceRequestEntry?.resource ? this.parseServiceRequest(serviceRequestEntry.resource) : null;

        return mapFhirEpisodeOfCareToDomain(ep, cond, cov, parsedSR ?? undefined);
    }

    public async findAllByPatientId(patientId: string): Promise<EpisodeOfCare[]> {
        const bundle = await this.client.search<unknown>("EpisodeOfCare", {
            patient: patientId,
            _sort: "-date",
            // include the linked Condition and any incoming referral ServiceRequest
            _include: ["EpisodeOfCare:condition", "EpisodeOfCare:incoming-referral"],
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
        // also collect ServiceRequest resources keyed by id so episodes can resolve their referral
        const serviceRequestMap: Record<string, FhirServiceRequest> = {};
        for (const e of entries) {
            if (e.resource?.resourceType === "Condition") {
                const c = this.parseCondition(e.resource);
                if (c) conditionMap[c.id] = c;
            }
            if (e.resource?.resourceType === "ServiceRequest") {
                const sr = this.parseServiceRequest(e.resource);
                if (sr) serviceRequestMap[sr.id] = sr;
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

            // resolve the episode's referral ServiceRequest (if any)
            let resolvedSR: FhirServiceRequest | undefined;
            const referralRef = ep.referralRequest?.[0]?.reference;
            if (typeof referralRef === "string") {
                const parts = referralRef.split("/");
                const id = parts[parts.length - 1];
                resolvedSR = serviceRequestMap[id];
            }

            results.push(mapFhirEpisodeOfCareToDomain(ep, cond, cov, resolvedSR));
        }

        return results;
    }
}
