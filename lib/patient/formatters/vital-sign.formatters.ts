import { BadgeInfo } from "./shared.formatters";
import {
    getClinicalRanges,
    getClinicalZoneForValue,
} from "./clinical-ranges";
import { VitalSignType, VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";

export interface ClinicalStatePresentation {
    badge: BadgeInfo;
    accentColor: string;
}

/**
 * Compute a badge based on a vital-sign measurement value.  The ranges used
 * are population-level standards and are **not** personalized to any
 * particular patient; the application does not yet model patient-specific
 * ranges or thresholds.
 *
 * Blood pressure is not handled here (see `getBloodPressureBadge`).
 */
export function getVitalSignBadge(type: VitalSignType, value: number): BadgeInfo {
    if (type === "blood-pressure") {
        // for blood pressure we return a neutral badge; the caller is
        // expected to invoke getBloodPressureBadge if more detailed
        // classification is desired.
        return {
            label: "Ver detalle",
            colorClass: "bg-badge-neutral-bg text-badge-neutral-text",
            severity: "normal",
        };
    }

    const zone = getClinicalZoneForValue(getClinicalRanges(type), value);

    switch (zone?.severity) {
        case "normal":
            return { label: zone.label, colorClass: "bg-badge-success-bg text-badge-success-text", severity: "normal" };
        case "warning":
            return { label: zone.label, colorClass: "bg-badge-warning-bg text-badge-warning-text", severity: "warning" };
        case "critical":
            return { label: zone.label, colorClass: "bg-badge-error-bg text-badge-error-text", severity: "critical" };
        default:
            return { label: "Desconocido", colorClass: "bg-badge-neutral-bg text-badge-neutral-text", severity: "normal" };
    }
}

export function getClinicalStateAccentColor(badge: BadgeInfo): string {
    switch (badge.label) {
        case "Normal":
        case "Sin dolor":
        case "Leve":
            return "var(--color-success)";
        case "Alerta":
        case "Moderado":
            return "#d97706";
        case "Crítico":
        case "Intenso":
        case "Insoportable":
            return "var(--color-error)";
        default:
            return "var(--color-muted)";
    }
}

export function getVitalSignSingleValuePresentation(type: VitalSignType, value: number): ClinicalStatePresentation {
    const badge = getVitalSignBadge(type, value);
    return {
        badge,
        accentColor: getClinicalStateAccentColor(badge),
    };
}

export function getBloodPressureSingleValuePresentation(
    systolic: number,
    diastolic: number,
): ClinicalStatePresentation {
    const badge = getBloodPressureBadge(systolic, diastolic);
    return {
        badge,
        accentColor: getClinicalStateAccentColor(badge),
    };
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

    const zone = getClinicalZoneForValue(getClinicalRanges("blood-pressure"), systolic);

    switch (zone?.severity) {
        case "normal":
            return { label: zone.label, colorClass: "bg-badge-success-bg text-badge-success-text", severity: "normal" };
        case "warning":
            return { label: zone.label, colorClass: "bg-badge-warning-bg text-badge-warning-text", severity: "warning" };
        case "critical":
            return { label: zone.label, colorClass: "bg-badge-error-bg text-badge-error-text", severity: "critical" };
        default:
            return { label: "Desconocido", colorClass: "bg-badge-neutral-bg text-badge-neutral-text", severity: "normal" };
    }
}
