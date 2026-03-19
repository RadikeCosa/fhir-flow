/**
 * Minimal practitioner model used when the app needs to resolve the current
 * authenticated/configured professional from FHIR.
 */
export interface Practitioner {
    id: string;
    displayName: string;
}
