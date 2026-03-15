/**
 * Domain definitions for encounters.  This file lives entirely within the
 * domain layer and is intentionally independent from FHIR or any other
 * external representation.  It captures only the fields that application
 * logic and UI components actually consume.
 */

/**
 * Values supported for encounter status within the application.  Kept small
 * and stable so the domain remains predictable.
 */
export type EncounterStatus =
    | "planned"
    | "in-progress"
    | "finished"
    | "cancelled";

/**
 * Broad visit type classification.  These values are chosen to mirror the
 * clinical scenarios we care about and may be matched from FHIR display
 * values in the infra mapper.
 *
 * - "initial" - first home visit in an episode of care
 * - "follow-up" - routine ongoing visit for monitoring and progress
 * - "re-assessment" - periodic functional evaluation within an active episode (distinct from routine follow-up and discharge)
 * - "discharge" - final visit closing the episode of care
 */
export type EncounterVisitType =
    | "initial"
    | "follow-up"
    | "re-assessment"
    | "discharge";

/**
 * Details about a participant (typically a practitioner) involved in the
 * encounter.  Only an identifier, name and role are stored in the domain.
 */
export interface EncounterParticipant {
    practitionerId: string;
    practitionerName: string;
    role: string;
}

/**
 * Core domain representation of an encounter.  All fields are defined to
 * support the application's UI and business logic; optional values reflect
 * data that may not be present in every encounter.
 */
export interface Encounter {
    id: string;
    status: EncounterStatus;
    episodeOfCareId: string;
    patientId: string;

    visitType: EncounterVisitType;

    participant: EncounterParticipant | null;

    periodStart: string;
    periodEnd?: string;
    durationMinutes?: number;

    reasonCode?: string;
    reasonDisplay?: string;

    /**
     * Free-text clinical note authored by the practitioner during the
     * encounter.  This is not part of the FHIR resource model in the
     * domain layer but is useful for UI components that need to display or
     * capture ad‑hoc narrative comments.
     */
    clinicalNote?: string;
}
