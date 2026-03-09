import { HttpError, FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetEntries } from "../../../lib/fhir/bundle-utils";
import type { FhirEncounter } from "../schemas/encounter.schema";
import { fhirEncounterSchema } from "../schemas/encounter.schema";
import { mapFhirEncounterToEncounter } from "../mappers/encounter.mapper";

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
    constructor(private client: FhirClient = new FhirClient()) { }

    /**
     * Validate a raw value against the encounter schema, returning the typed
     * resource or `null` when validation fails.
     */
    private parseEncounter(obj: unknown): FhirEncounter | null {
        const parsed = fhirEncounterSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    public async findAllByEpisodeOfCareId(episodeOfCareId: string): Promise<Encounter[]> {
        const bundle = await this.client.search<unknown>("Encounter", {
            "episode-of-care": `EpisodeOfCare/${episodeOfCareId}`,
            _sort: "-date",
        });

        const entries = safeGetEntries(bundle);
        const results: Encounter[] = [];

        for (const e of entries) {
            if (e.resource) {
                const enc = this.parseEncounter(e.resource);
                if (enc) {
                    results.push(mapFhirEncounterToEncounter(enc));
                }
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

        const entries = safeGetEntries(bundle);
        if (entries.length === 0) {
            return null;
        }

        const first = entries[0];
        if (first.resource) {
            const enc = this.parseEncounter(first.resource);
            return enc ? mapFhirEncounterToEncounter(enc) : null;
        }
        return null;
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

        const entries = safeGetEntries(bundle);
        if (entries.length === 0) {
            return null;
        }

        const first = entries[0];
        if (first.resource) {
            const enc = this.parseEncounter(first.resource);
            return enc ? mapFhirEncounterToEncounter(enc) : null;
        }
        return null;
    }
}
