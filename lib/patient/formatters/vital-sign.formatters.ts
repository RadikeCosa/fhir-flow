import { BadgeInfo } from "./shared.formatters";
import { VitalSignType } from "../../../domain/vital-sign-record";

/**
 * Compute a badge based on a vital-sign measurement value.  The ranges used
 * are population-level standards and are **not** personalized to any
 * particular patient; the application does not yet model patient-specific
 * ranges or thresholds.
 *
 * Blood pressure is not handled here (see `getBloodPressureBadge`).
 */
export function getVitalSignBadge(type: VitalSignType, value: number): BadgeInfo {
    switch (type) {
        case "heart-rate":
            if (value >= 60 && value <= 100) {
                return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
            }
            if ((value >= 50 && value <= 59) || (value >= 101 && value <= 120)) {
                return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
            }
            return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
        case "respiratory-rate":
            if (value >= 12 && value <= 20) {
                return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
            }
            if ((value >= 10 && value <= 11) || (value >= 21 && value <= 25)) {
                return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
            }
            return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
        case "oxygen-saturation":
            if (value >= 95) {
                return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
            }
            if (value >= 90 && value <= 94) {
                return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
            }
            return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
        case "body-temperature":
            if (value >= 36.0 && value <= 37.4) {
                return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
            }
            if ((value >= 37.5 && value <= 38.5) || value < 36.0) {
                return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
            }
            return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
        case "blood-pressure":
            // for blood pressure we return a neutral badge; the caller is
            // expected to invoke getBloodPressureBadge if more detailed
            // classification is desired.
            return { label: "Ver detalle", colorClass: "bg-gray-100 text-gray-800" };
        default:
            return { label: "Desconocido", colorClass: "bg-gray-100 text-gray-800" };
    }
}

/**
 * Classify blood pressure based on the systolic value alone.  This is a
 * simplification: real clinical guidelines consider both systolic and
 * diastolic pressures, as well as patient-specific factors, which we do not
 * model yet.
 *
 * The ranges used here are population-level standards and are **not**
 * personalized to any patient.
 */
export function getBloodPressureBadge(systolic: number, _diastolic: number): BadgeInfo {
    // diastolic value is currently unused; classification is based solely on
    // systolic pressure as a simplification.  Parameter kept for future use.
    void _diastolic;

    if (systolic >= 90 && systolic <= 139) {
        return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
    }
    if (systolic < 90 || (systolic >= 140 && systolic <= 159)) {
        return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
    }
    // systolic >= 160
    return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
}
