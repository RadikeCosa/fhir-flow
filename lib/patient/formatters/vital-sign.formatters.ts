import { BadgeInfo } from "./shared.formatters";
import { VitalSignType, VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";

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
 * Return a human-readable Spanish label for a given vital sign type.  This is
 * used in headers, tooltips, and chart legends where the full description is
 * more helpful than the short key.
 */
export function formatVitalSignLabel(type: VitalSignType): string {
    switch (type) {
        case "heart-rate":
            return "Frecuencia cardíaca (lpm)";
        case "respiratory-rate":
            return "Frecuencia respiratoria (rpm)";
        case "oxygen-saturation":
            return "Saturación de oxígeno (%)";
        case "body-temperature":
            return "Temperatura (°C)";
        case "blood-pressure":
            return "Tensión arterial (mmHg)";
        default:
            return "";
    }
}

/**
 * Group an array of vital sign records by measurement type.
 *
 * The returned map contains only the types for which there is at least one
 * data point; absent types are omitted to simplify iteration when
 * rendering charts or tables.  For the special case of blood pressure we
 * include both systolic and diastolic values in each entry instead of a
 * single "value" field.  This allows downstream components to choose the
 * appropriate datum while still keeping the overall grouping logic
 * centralized.
 *
 * Each series array is sorted by `date` in ascending order (oldest first)
 * so that chart libraries render them left-to-right correctly.
 */
export function groupVitalSignsByType(
    records: VitalSignRecord[],
): Map<
    VitalSignType,
    Array<{ date: string; value?: number; systolic?: number; diastolic?: number }>
> {
    const map = new Map<
        VitalSignType,
        Array<{ date: string; value?: number; systolic?: number; diastolic?: number }>
    >();

    for (const rec of records) {
        const { date } = rec;

        if (typeof rec.heartRate === "number") {
            const arr = map.get("heart-rate") || [];
            arr.push({ date, value: rec.heartRate });
            map.set("heart-rate", arr);
        }
        if (typeof rec.respiratoryRate === "number") {
            const arr = map.get("respiratory-rate") || [];
            arr.push({ date, value: rec.respiratoryRate });
            map.set("respiratory-rate", arr);
        }
        if (typeof rec.oxygenSaturation === "number") {
            const arr = map.get("oxygen-saturation") || [];
            arr.push({ date, value: rec.oxygenSaturation });
            map.set("oxygen-saturation", arr);
        }
        if (typeof rec.bodyTemperature === "number") {
            const arr = map.get("body-temperature") || [];
            arr.push({ date, value: rec.bodyTemperature });
            map.set("body-temperature", arr);
        }
        if (
            rec.bloodPressure &&
            typeof rec.bloodPressure.systolic === "number" &&
            typeof rec.bloodPressure.diastolic === "number"
        ) {
            const arr = map.get("blood-pressure") || [];
            arr.push({
                date,
                systolic: rec.bloodPressure.systolic,
                diastolic: rec.bloodPressure.diastolic,
            });
            map.set("blood-pressure", arr);
        }
    }

    // ensure each array is sorted by date ascending for chart compatibility
    for (const arr of map.values()) {
        arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    }

    return map;
}

/**
 * Classify blood pressure based on the systolic value alone.  This is a
 * simplification: real clinical guidelines consider both systolic and
 * diastolic pressures, as well as patient-specific factors, which we do not
 * model yet.
 *
 * The ranges used here are population-level standards and are **not**
 * personalized to any patient.
 *
 * **Note:** both hypotension (systolic < 90) and hypertensive crisis
 * (systolic ≥ 160) are grouped under the **Crítico** category because they
 * represent opposite but equally urgent clinical situations.
 */
export function getBloodPressureBadge(systolic: number, _diastolic: number): BadgeInfo {
    // diastolic value is currently unused; classification is based solely on
    // systolic pressure as a simplification.  Parameter kept for future use.
    void _diastolic;

    // Normal range
    if (systolic >= 90 && systolic <= 139) {
        return { label: "Normal", colorClass: "bg-green-100 text-green-800" };
    }

    // Alert range (pre-hypertension and stage 1 hypertension)
    if (systolic >= 140 && systolic <= 159) {
        return { label: "Alerta", colorClass: "bg-yellow-100 text-yellow-800" };
    }

    // Crítico: either dangerously low or dangerously high systolic pressure
    // (systolic < 90 or systolic >= 160)
    return { label: "Crítico", colorClass: "bg-red-100 text-red-800" };
}
