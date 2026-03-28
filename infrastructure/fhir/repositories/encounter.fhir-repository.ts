import { HttpError, FhirClient } from "../../../lib/fhir/fhir-client";
import type { FhirResource } from "../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../lib/logger";
import { safeGetResources } from "../../../lib/fhir/bundle-utils";
import type { FhirEncounter } from "../schemas/encounter.schema";
import { fhirEncounterSchema } from "../schemas/encounter.schema";
import { mapFhirEncounterToEncounter } from "../mappers/encounter.mapper";
import { mapToFhirEncounter } from "../mappers/encounter.write.mapper";
import { buildFinalizeEncounterBundle } from "../mappers/finalize-encounter-bundle.mapper";
import {
    buildSaveEncounterProgressBundle,
    type ExistingEncounterClinicalSnapshot,
} from "../mappers/save-encounter-progress-bundle.mapper";
import { mapToStartedEncounterUpdate } from "../mappers/encounter.start.mapper";
import { FhirMapperError } from "../../../domain/shared/error-types";

import type {
    CreateEncounterInput,
    FinalizeEncounterInput,
    SaveEncounterProgressInput,
    StartEncounterInput,
} from "../../../domain/encounters/encounter.write-input";
import type { EncounterRepository } from "../../../domain/encounters/encounter.repository";
import type { Encounter } from "../../../domain/encounters/encounter";
import {
    FHIR_FLOW_OWNERSHIP_SEARCH_TOKEN,
    hasFhirFlowOwnershipTag,
} from "../shared/ownership";

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

    private static readonly SNAPSHOT_OBSERVATION_CODES = [
        "8867-4",
        "9279-1",
        "59408-5",
        "8310-5",
        "85354-9",
        "72514-3",
    ] as const;

    private static readonly SNAPSHOT_OBSERVATION_CODE_SET = new Set<string>(
        EncounterFhirRepository.SNAPSHOT_OBSERVATION_CODES
    );

    private static isManagedObservationSnapshotResource(resource: unknown): resource is {
        resourceType: "Observation";
        id: string;
    } {
        if (typeof resource !== "object" || resource === null) {
            return false;
        }

        const maybeObservation = resource as {
            resourceType?: unknown;
            id?: unknown;
            code?: { coding?: Array<{ code?: unknown }> };
        };

        if (
            maybeObservation.resourceType !== "Observation" ||
            typeof maybeObservation.id !== "string" ||
            maybeObservation.id.trim() === ""
        ) {
            return false;
        }

        const hasSnapshotCode = Array.isArray(maybeObservation.code?.coding)
            && maybeObservation.code.coding.some((coding) =>
                typeof coding.code === "string"
                && EncounterFhirRepository.SNAPSHOT_OBSERVATION_CODE_SET.has(coding.code)
            );

        return hasSnapshotCode && hasFhirFlowOwnershipTag(resource);
    }

    private static isManagedProcedureSnapshotResource(resource: unknown): resource is {
        resourceType: "Procedure";
        id: string;
    } {
        if (typeof resource !== "object" || resource === null) {
            return false;
        }

        const maybeProcedure = resource as { resourceType?: unknown; id?: unknown };

        return (
            maybeProcedure.resourceType === "Procedure"
            && typeof maybeProcedure.id === "string"
            && maybeProcedure.id.trim() !== ""
            && hasFhirFlowOwnershipTag(resource)
        );
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
        }, { cache: "no-store" });

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
            const res = await this.client.read<FhirEncounter>("Encounter", id, { cache: "no-store" });
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
        }, { cache: "no-store" });

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
        }, { cache: "no-store" });

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
            }, { cache: "no-store" });

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

    public async finalize(input: FinalizeEncounterInput): Promise<void> {
        const bundle = buildFinalizeEncounterBundle(input);
        await this.client.postBundle(bundle);
    }

    private async findSnapshotResourceIds(
        encounterId: string
    ): Promise<ExistingEncounterClinicalSnapshot> {
        const observationBundle = await this.client.search<unknown>(
            "Observation",
            {
                encounter: `Encounter/${encounterId}`,
                code: EncounterFhirRepository.SNAPSHOT_OBSERVATION_CODES.join(","),
                _tag: FHIR_FLOW_OWNERSHIP_SEARCH_TOKEN,
                _count: "200",
            },
            { cache: "no-store" }
        );
        const observationIds = safeGetResources(observationBundle)
            .filter(EncounterFhirRepository.isManagedObservationSnapshotResource)
            .map((resource) => resource.id);

        const procedureBundle = await this.client.search<unknown>(
            "Procedure",
            {
                encounter: `Encounter/${encounterId}`,
                _tag: FHIR_FLOW_OWNERSHIP_SEARCH_TOKEN,
                _count: "200",
            },
            { cache: "no-store" }
        );
        const procedureIds = safeGetResources(procedureBundle)
            .filter(EncounterFhirRepository.isManagedProcedureSnapshotResource)
            .map((resource) => resource.id);

        return { observationIds, procedureIds };
    }

    public async saveProgress(input: SaveEncounterProgressInput): Promise<void> {
        const existing = await this.client.read<FhirResource>("Encounter", input.encounterId, {
            cache: "no-store",
        });
        const encounter = this.parseEncounter(existing);

        if (!encounter) {
            throw new FhirMapperError("Encounter resource is invalid", "INVALID_ENCOUNTER_RESOURCE");
        }

        const existingSnapshot = await this.findSnapshotResourceIds(input.encounterId);
        const bundle = buildSaveEncounterProgressBundle(
            input,
            existing as Record<string, unknown>,
            existingSnapshot
        );
        await this.client.postBundle(bundle);
    }

    public async startEncounter(input: StartEncounterInput): Promise<void> {
        const existing = await this.client.read<FhirResource>("Encounter", input.encounterId, { cache: "no-store" });
        const encounter = this.parseEncounter(existing);

        if (!encounter) {
            throw new FhirMapperError("Encounter resource is invalid", "INVALID_ENCOUNTER_RESOURCE");
        }

        const updatedEncounter = mapToStartedEncounterUpdate(encounter, input.actualStartAt);
        await this.client.update("Encounter", input.encounterId, updatedEncounter);
    }
}
