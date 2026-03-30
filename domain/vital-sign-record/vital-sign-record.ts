/**
 * Domain definitions for grouped Vital Sign records.
 *
 * This model is FHIR-agnostic and captures only the fields used by
 * application logic and UI components. Mapping and normalization from
 * FHIR Observations (or other sources) is the responsibility of the
 * infrastructure mapper layer.
 */

/** Closed set of supported vital sign types used across the app. */
export type VitalSignType =
    | "heart-rate"
    | "respiratory-rate"
    | "oxygen-saturation"
    | "body-temperature"
    | "blood-pressure";

/**
 * Blood pressure reading grouped into systolic/diastolic values.
 *
 * We use a nested type because FHIR often represents blood pressure as
 * two components within a single Observation resource; the mapper is
 * responsible for extracting and composing these into this shape.
 */
export interface BloodPressureReading {
    systolic: number;
    diastolic: number;
}

/**
 * Represents a grouped set of vital sign measurements for a capture point.
 *
 * Notes:
 * - This model is intentionally independent from FHIR resource shapes.
 * - Grouping of multiple Observations by capture timestamp and performer is
 *   performed in the mapper; FHIR itself has no concept of this grouped record.
 * - `id` is a synthetic key constructed by the mapper (for example
 *   using capture metadata) because FHIR does not provide a
 *   canonical id for this grouped record.
 * - Blood pressure uses a nested `BloodPressureReading` because it is
 *   composed of two component observations (systolic/diastolic).
 * - All measurement fields are optional because not every visit records
 *   every vital sign.
 */
export interface VitalSignRecord {
    /** Synthetic domain identifier (constructed by the mapper). */
    id: string;

    /** Internal domain patient identifier */
    patientId: string;

    /**
     * ISO capture date/time of the measurements.
     *
     * For date-only observations, the value may still be `YYYY-MM-DD`.
     * For timestamped observations, this preserves full precision from
     * source `effectiveDateTime`.
     */
    date: string;

    /** Person who recorded the measurements (from FHIR performer). */
    recordedBy: {
        id: string;
        display: string;
    };

    /**
     * Optional linked encounter id.
     *
     * This field is not always present for historical vital records created
     * before the write phase introduced encounter linkage.
     */
    encounterId?: string;

    /** Heart rate in beats per minute (optional). */
    heartRate?: number;

    /** Respiratory rate in breaths per minute (optional). */
    respiratoryRate?: number;

    /** Oxygen saturation as percent (optional). */
    oxygenSaturation?: number;

    /** Body temperature in Celsius (optional). */
    bodyTemperature?: number;

    /** Optional blood pressure reading (systolic/diastolic). */
    bloodPressure?: BloodPressureReading;
}
