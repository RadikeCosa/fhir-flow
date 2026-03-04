/**
 * Domain definitions for Episode of Care.  These types live entirely within the
 * domain layer and are intentionally independent from FHIR or any other
 * external representation.  They capture only the fields that application
 * logic and UI components actually consume.
 */

/**
 * Possible status values for an episode of care.  These are the values used
 * throughout the application and are kept intentionally small and stable.
 */
export type EpisodeStatus =
    | "planned"
    | "waitlist"
    | "active"
    | "onhold"
    | "finished"
    | "cancelled";

/**
 * Broad categorisation of the episode.  Keywords are matched in the mapper from
 * FHIR display/text values; the domain does not care about the exact FHIR
 * coding.
 */
export type EpisodeType =
    | "motora"
    | "respiratoria"
    | "paliativa"
    | "mixta";

/**
 * Represents the main condition being treated during the episode.  Most
 * properties are optional to keep the domain model simple; mappers are
 * responsible for normalising FHIR data into this shape.
 */
export interface EpisodeCondition {
    code: string; // ICD-10 or similar
    description: string;
    bodySite?: string;
    severity?: string;
    onsetDate?: string;
    notes?: string;
}

/**
 * Coverage information associated with the episode.  This is drawn from
 * FHIR Coverage resources but kept minimal here.
 */
export interface EpisodeCoverage {
    payorName: string;
    planName?: string;
    subscriberId?: string;
    periodStart?: string;
    periodEnd?: string;
}

/**
 * Referral practitioner details attached to the episode.  Only an identifier
 * and display name are stored in the domain.
 */
export interface EpisodeReferral {
    practitionerId: string;
    practitionerName: string;
}

/**
 * Core domain representation of an EpisodeOfCare.  See individual fields for
 * comments on expectations and normalised formats.
 */
export interface EpisodeOfCare {
    id: string;
    identifier: string;

    status: EpisodeStatus;
    type: EpisodeType;

    startDate: string;
    endDate?: string;

    condition: EpisodeCondition;
    coverage?: EpisodeCoverage;
    referral?: EpisodeReferral;

    patientId: string;
}
