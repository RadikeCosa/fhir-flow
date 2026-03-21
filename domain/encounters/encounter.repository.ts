/**
 * Repository contract for working with `Encounter` aggregates within the
 * domain.  Implementations live in the infrastructure layer and are
 * responsible for translating between external representations (FHIR, DB,
 * etc.) and the domain model defined in `encounter.ts`.  No external
 * dependencies are referenced here.
 */

import type { CreateEncounterInput, FinalizeEncounterInput } from "./encounter.write-input";
import type { Encounter } from "./encounter";

export interface EncounterRepository {
    /**
     * Retrieve all encounters linked to the specified episode of care.
     *
     * Implementations should return the results sorted by date in
     * descending order (most recent first).  An empty array is returned if
     * no encounters are found.
     */
    findAllByEpisodeOfCareId(episodeOfCareId: string): Promise<Encounter[]>;

    /**
     * Find a single encounter by its internal domain identifier.
     * Returns the encounter or `null` when no matching record exists.
     */
    findById(id: string): Promise<Encounter | null>;

    /**
     * Returns the most recent finished encounter for a given patient where one
     * of the encounter participants matches the provided practitioner.
     * Results should be ordered by date descending and limited to a single
     * entry; implementations return `null` if none is found.
     */
    findLastByPatientIdAndPractitionerId(
        patientId: string,
        practitionerId: string
    ): Promise<Encounter | null>;

    /**
     * Returns the next planned encounter for a given patient with a specific
     * practitioner participant.  Encounters are ordered by date ascending and
     * the earliest future/planned event is returned, or `null` when missing.
     */
    findNextPlannedByPatientIdAndPractitionerId(
        patientId: string,
        practitionerId: string
    ): Promise<Encounter | null>;

    /**
     * Returns the first encounter for an episode of care where the visit type is
     * "initial". This is used for rendering initial evaluation details.
     */
    findInitialByEpisodeOfCareId(episodeOfCareId: string): Promise<Encounter | null>;

    /**
     * Create a new planned encounter.
     *
    * @param input - CreateEncounterInput with patientId, episodeOfCareId, plannedDate, plannedTime?, note
     * @returns Promise<{ id: string }> - the ID of the created Encounter
     *
     * Throws:
     * - FhirMapperError if required references are missing or invalid
     * - FhirWriteError if the FHIR server rejects the write
     *
     * The method returns only the ID. The caller uses this to redirect or fetch full details.
     */
    create(input: CreateEncounterInput): Promise<{ id: string }>;

    /**
     * Finalizes an already-existing encounter by writing clinical observations
     * and procedures, and updating encounter status/timing via a FHIR transaction.
     *
     * This is a composed use case, not pure persistence. It delegates to
     * infrastructure mappers to construct a FHIR Transaction Bundle containing:
     *   - a PUT entry for updating the Encounter
     *   - POST entries for Observations (vital signs and EVA)
     *   - POST entries for Procedures
     * The bundle is sent through the FHIR client.
     *
     * Errors are NOT caught here; they propagate to the Server Action.
     * In a larger system, this orchestration would reside in an application
     * service layer; in this project it is intentionally placed in the
     * repository as a learning-lab simplification (see write-phase-architecture.md).
     */
    finalize(input: FinalizeEncounterInput): Promise<void>;
}
