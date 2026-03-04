
/**
 * PatientGender — domain-level gender values used inside the application.
 *
 * These values belong to the domain and are intentionally independent from
 * any external standards. Domain services may treat a missing `gender`
 * as the logical default `"unknown"` — callers that require a concrete
 * value should apply that default when reading the model.
 */
export type PatientGender = "male" | "female" | "other" | "unknown";

/**
 * Patient — core domain representation of a patient.
 *
 * Design notes:
 * - This model is FHIR-agnostic and contains only the shape used by
 *   application business logic and UI layers.
 * - All mapping and normalization from external sources (including FHIR)
 *   must be implemented in the infrastructure/mapper layer.
 * - `birthDate` uses the normalized ISO date form `YYYY-MM-DD` within the
 *   domain; the mapper is responsible for producing that format.
 * - `gender` is optional in the type to reflect that some records may omit
 *   it; domain services should treat a missing `gender` as `"unknown"`
 *   unless business rules require otherwise.
 */
export interface Patient {
    /** Internal domain identifier */
    id: string;

    /** Single primary identifier (system-agnostic, e.g. MRN or national ID) */
    identifier: string;

    /** Patient name with given and family parts */
    name: {
        given: string;
        family: string;
    };

    /**
     * Marital status represented as a simple string. Mappers should
     * translate from FHIR (e.g. "married", "single", "widowed") but
     * the domain itself makes no assumptions about possible values.
     */
    maritalStatus?: string;

    /**
     * Indicates whether the patient is deceased. For flexibility the
     * value may be a boolean `true`/`false` or a string containing an
     * ISO date (e.g. date of death).
     */
    deceased?: boolean | string;

    /**
     * Emergency or caregiver contacts. Each entry contains simple fields
     * that the UI needs; there is no deep FHIR structure here.
     */
    contact?: Array<{
        name: {
            given: string;
            family: string;
        };
        relationship?: string;
        phone?: string;
        email?: string;
    }>;

    /**
     * References to the patient's general practitioners. Only the
     * identifier and display name are stored in the domain.
     */
    generalPractitioner?: Array<{
        id: string;
        display: string;
    }>;

    /**
     * Normalized birth date as an ISO date string in `YYYY-MM-DD` form.
     * This field is optional when unknown — mappers must normalize raw
     * input (timestamps, partial dates, etc.) to this format before
     * creating or returning a `Patient` domain object.
     */
    birthDate?: string;

    /**
     * Domain gender. Optional in the model; treat absent values as
     * `"unknown"` at service boundaries when a concrete value is required.
     */
    gender?: PatientGender;

    /** Primary contact phone (optional) */
    phone?: string;

    /** Primary contact email (optional) */
    email?: string;

    /**
     * Optional postal address. `line` is an array of address lines to better
     * represent multi-line addresses while remaining simple and UI-friendly.
     *
     * A `postalCode` field has been added for UI convenience; like other
     * subfields it is optional when unknown.
     */
    address?: {
        line: string[];
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
    };

    /** Whether the patient record is active */
    active: boolean;
}
