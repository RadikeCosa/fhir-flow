import { HttpError, FhirClient } from "../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../lib/logger";
import { safeGetResources } from "../../../lib/fhir/bundle-utils";
import type { FhirEncounter } from "../schemas/encounter.schema";
import { fhirEncounterSchema } from "../schemas/encounter.schema";
import { mapFhirEncounterToEncounter } from "../mappers/encounter.mapper";
import { mapToFhirEncounter } from "../mappers/encounter.write.mapper";

import type { CreateEncounterInput } from "../../../domain/encounters/encounter.write-input";
import type { EncounterRepository } from "../../../domain/encounters/encounter.repository";
import type { Encounter } from "../../../domain/encounters/encounter";

/**
 * FHIR-based implementation of the `EncounterRepository` domain contract.
 *
 * All network interaction, validation and mapping is encapsulated here.  The
 * class never exposes raw FHIR objects; invalid entries are quietly dropped
 * and missing resources result in `null`/`[]` rather than thrown errors.
 */
export class EncounterFhirRepository implements EncounterRepository {
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    /**
     * Validate a raw value against the encounter schema, returning the typed
     * resource or `null` when validation fails.
     */
    private parseEncounter(obj: unknown): FhirEncounter | null {
        const parsed = fhirEncounterSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EncounterFhirRepository] Encounter validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    public async findAllByEpisodeOfCareId(episodeOfCareId: string): Promise<Encounter[]> {
        const bundle = await this.client.search<unknown>("Encounter", {
            "episode-of-care": `EpisodeOfCare/${episodeOfCareId}`,
            _sort: "-date",
        });

        const resources = safeGetResources(bundle);
        const results: Encounter[] = [];

        for (const res of resources) {
            const enc = this.parseEncounter(res);
            if (enc) {
                results.push(mapFhirEncounterToEncounter(enc));
            }
        }

        return results;
    }

    public async findById(id: string): Promise<Encounter | null> {
        try {
            const res = await this.client.read<FhirEncounter>("Encounter", id);
            const enc = this.parseEncounter(res);
            return enc ? mapFhirEncounterToEncounter(enc) : null;
        } catch (err: unknown) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }

    public async findLastByPatientIdAndPractitionerId(
        patientId: string,
        practitionerId: string
    ): Promise<Encounter | null> {
        const bundle = await this.client.search<unknown>("Encounter", {
            patient: `Patient/${patientId}`,
            participant: `Practitioner/${practitionerId}`,
            status: "finished",
            _sort: "-date",
            _count: "1",
        });

        const resources = safeGetResources(bundle);
        if (resources.length === 0) {
            return null;
        }

        const first = resources[0];
        const enc = this.parseEncounter(first);
        return enc ? mapFhirEncounterToEncounter(enc) : null;
    }

    public async findNextPlannedByPatientIdAndPractitionerId(
        patientId: string,
        practitionerId: string
    ): Promise<Encounter | null> {
        const bundle = await this.client.search<unknown>("Encounter", {
            patient: `Patient/${patientId}`,
            participant: `Practitioner/${practitionerId}`,
            status: "planned",
            _sort: "date",
            _count: "1",
        });

        const resources = safeGetResources(bundle);
        if (resources.length === 0) {
            return null;
        }

        const first = resources[0];
        const enc = this.parseEncounter(first);
        return enc ? mapFhirEncounterToEncounter(enc) : null;
    }

    public async findInitialByEpisodeOfCareId(
        episodeOfCareId: string
    ): Promise<Encounter | null> {
        try {
            const bundle = await this.client.search<unknown>("Encounter", {
                "episode-of-care": `EpisodeOfCare/${episodeOfCareId}`,
                type: "initial",
                _sort: "date",
                _count: "1",
            });

            const resources = safeGetResources(bundle);
            for (const res of resources) {
                const enc = this.parseEncounter(res);
                if (!enc) continue;
                const mapped = mapFhirEncounterToEncounter(enc);
                if (mapped.visitType === "initial") return mapped;
            }
            return null;
        } catch (err: unknown) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Create a new planned encounter.
     *
     * @param input - CreateEncounterInput (already validated by domain rules)
     * @returns Promise<{ id: string }> - the ID of the created Encounter
     *
     * Throws:
     * - FhirMapperError if required references are missing or invalid
     * - FhirWriteError if the FHIR server rejects the write
     *
     * Note: Errors are NOT caught here — they propagate to the Server Action.
     */
    public async create(input: CreateEncounterInput): Promise<{ id: string }> {
        // Map domain input to FHIR resource (may throw FhirMapperError)
        const fhirEncounter = mapToFhirEncounter(input);

        // Send to FHIR server (may throw FhirWriteError)
        const result = await this.client.post("Encounter", fhirEncounter);
        return result;
    }
}
