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
import type { ProcedureCategory, ProcedureCode } from "../procedures/procedure";

export interface CreateEncounterInput {
    /**
     * Simple Patient resource id (without the `Patient/` prefix).
     */
    patientId: string;

    /**
     * Human-readable practitioner name used in the UI and persisted in FHIR.
     */
    practitionerName: string;
    /**
     * Simple Practitioner resource id (without the `Practitioner/` prefix).
     * Resolved by the Server Action and carried through the write input so
     * that mappers remain pure and do not read runtime config.
     */
    performerId: string;

    /**
     * Simple EpisodeOfCare resource id (without the `EpisodeOfCare/` prefix).
     */
    episodeOfCareId: string;

    /**
     * Planned calendar date for the encounter in YYYY-MM-DD format.
     */
    plannedDate: string;

    /**
     * Optional planned local time in HH:mm format.
     * When omitted, the encounter remains planned without explicit schedule time.
     */
    plannedTime?: string | null;

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

/**
 * Input for finalizing an encounter with clinical observations, procedures and
 * optional summary notes.
 *
 * Note: `patientId`, `episodeOfCareId`, `performerId`, `practitionerName`, and
 * `actualStartAt` are resolved by the Server Action from existing server-side
 * state and not supplied by the client form.
 *
 * `procedures` must always be an array; when no procedures apply it should be
 * an empty array.
 */
export interface FinalizeEncounterInput {
    encounterId: string;
    patientId: string;
    episodeOfCareId: string;
    performerId: string;
    practitionerName: string;
    visitType: EncounterVisitType;
    actualStartAt: string;
    actualEndAt: string;
    clinicalNote: string;
    reasonDisplay?: string | null;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    bodyTemperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    evaScore?: number;
    procedures: Array<{
        category: ProcedureCategory;
        code: ProcedureCode;
        bodySite?: string;
        note?: string;
    }>;
}
