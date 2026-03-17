/**
 * Input type for creating a new Encounter via the write path.
 *
 * This is a "write input" type (no `id`) and is intentionally distinct from the
 * read model `Encounter` so that we only accept the fields that the user may
 * submit and that are required to build the FHIR resource.
 *
 * The write repository / mapper is responsible for adding required clinical
 * references and static fields (status, class, performer, etc.).
 */
import type { EncounterVisitType } from "./encounter";

export interface CreateEncounterInput {
    /**
     * Simple Patient resource id (without the `Patient/` prefix).
     */
    patientId: string;

    /**
     * Simple EpisodeOfCare resource id (without the `EpisodeOfCare/` prefix).
     */
    episodeOfCareId: string;

    /**
     * Planned date/time for the encounter.
     * Expected to be an ISO 8601 string, e.g. "2026-03-17T10:00:00Z".
     */
    plannedAt: string;

    /**
     * Visit type, used for the `Encounter.type` coding.
     */
    visitType: EncounterVisitType;

    /**
     * Optional clinical note describing the reason for the visit.
     * Stored in `Encounter.note[]` in FHIR.
     * `null` is treated the same as `undefined` (no note).
     */
    note?: string | null;

    /**
     * Optional human-readable reason/motive for the visit.
     * Stored in `Encounter.reasonCode[0].text` in FHIR.
     */
    reasonDisplay?: string | null;
}
