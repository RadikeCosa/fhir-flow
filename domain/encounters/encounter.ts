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
 */
export type EncounterVisitType =
    | "initial"
    | "follow-up"
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
}
