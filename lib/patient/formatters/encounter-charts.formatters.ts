import { EvaAssessment } from "../../../domain/assessments/eva-assessment";
import { VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";
import type { ClinicalRanges } from "./clinical-ranges";

/**
 * Shapes used for charting.  These are intentionally kept minimal so that
 * the UI layer does not need to know about the full domain objects.
 */
export interface TimeValueDatum {
    date: string;
    value: number;
}

export interface BloodPressureDatum {
    date: string;
    systolic: number;
    diastolic: number;
}

export interface ClinicalChartNormalRange {
    y1: number;
    y2: number;
}

export interface ClinicalChartReferenceZone {
    y1: number;
    y2: number;
    fill: string;
}

export interface ClinicalChartReferences {
    normalRange?: ClinicalChartNormalRange;
    referenceZones: ClinicalChartReferenceZone[];
}

export interface VitalSignsChartData {
    heartRate: TimeValueDatum[];
    respiratoryRate: TimeValueDatum[];
    oxygenSaturation: TimeValueDatum[];
    bodyTemperature: TimeValueDatum[];
    bloodPressure: BloodPressureDatum[];
}

/**
 * Predefined clinical display ranges for vital signs and assessments.
 * These are not the full physiologic extremes but rather a useful window
 * for outpatient monitoring.  Chart components can rely on these fixed
 * domains instead of computing dynamic ranges from the data.
 */
export const CLINICAL_CHART_RANGES = {
    heartRate: { min: 30, max: 220 },
    respiratoryRate: { min: 5, max: 60 },
    oxygenSaturation: { min: 50, max: 100 },
    bodyTemperature: { min: 30.0, max: 43.0 },
    bloodPressure: { min: 40, max: 280 }, // applies to both systolic and diastolic axes
    eva: { min: 0, max: 10 },
};

/**
 * Standard color palette for clinical charts.  This keeps hues consistent
 * across components and matches the rest of the UI (e.g. badges).
 */
export const CLINICAL_CHART_COLORS = {
    normal: "#16a34a",
    alert: "#d97706",
    critical: "#dc2626",
    neutral: "#6b7280",
    heartRate: "#2563eb",
    respiratoryRate: "#16a34a",
    oxygenSaturation: "#0891b2",
    bodyTemperature: "#d97706",
    systolic: "#ff6b6b",
    diastolic: "#4c87d9",
    painLow: "#16a34a",
    painModerate: "#d97706",
    painHigh: "#dc2626",
};


function getClinicalChartColor(severity: "normal" | "warning" | "critical"): string {
    switch (severity) {
        case "normal":
            return CLINICAL_CHART_COLORS.normal;
        case "warning":
            return CLINICAL_CHART_COLORS.alert;
        case "critical":
            return CLINICAL_CHART_COLORS.critical;
    }
}

export function adaptClinicalRangesToChartReferences(
    ranges: ClinicalRanges,
    options: {
        includeNormalRange?: boolean;
        includeNormalReferenceZones?: boolean;
        clampToDomain?: { min: number; max: number };
    } = {},
): ClinicalChartReferences {
    const zones = ranges.kind === "ordinal"
        ? ranges.zones
        : [
            ...(ranges.critical ?? []),
            ...(ranges.warning ?? []),
            ranges.normal,
        ];

    const normalZones = zones.filter(zone => zone.severity === "normal");
    const includeNormalRange = options.includeNormalRange ?? normalZones.length > 0;
    const includeNormalReferenceZones = options.includeNormalReferenceZones ?? false;
    const clampToDomain = options.clampToDomain;
    const clamp = (value: number) => {
        if (!clampToDomain) {
            return value;
        }

        return Math.min(Math.max(value, clampToDomain.min), clampToDomain.max);
    };

    const toChartZone = (zone: { min: number; max: number; severity: "normal" | "warning" | "critical" }) => {
        const y1 = clamp(zone.min);
        const y2 = clamp(zone.max);

        if (y1 > y2) {
            return undefined;
        }

        return {
            y1,
            y2,
            fill: getClinicalChartColor(zone.severity),
        };
    };

    return {
        normalRange: includeNormalRange && normalZones.length > 0
            ? {
                y1: clamp(Math.min(...normalZones.map(zone => zone.min))),
                y2: clamp(Math.max(...normalZones.map(zone => zone.max))),
            }
            : undefined,
        referenceZones: zones
            .filter(zone => includeNormalReferenceZones || zone.severity !== "normal")
            .sort((left, right) => left.min - right.min)
            .map(toChartZone)
            .filter((zone): zone is ClinicalChartReferenceZone => zone !== undefined),
    };
}

/**
 * Convert a list of domain {@link VitalSignRecord} objects into separate
 * series suitable for charting.  Each array is sorted ascending by date and
 * only populated with entries where the corresponding measurement is present.
 */
export function formatVitalSignsForChart(records: VitalSignRecord[]): VitalSignsChartData {
    const result: VitalSignsChartData = {
        heartRate: [],
        respiratoryRate: [],
        oxygenSaturation: [],
        bodyTemperature: [],
        bloodPressure: [],
    };

    for (const rec of records) {
        if (typeof rec.heartRate === "number") {
            result.heartRate.push({ date: rec.date, value: rec.heartRate });
        }
        if (typeof rec.respiratoryRate === "number") {
            result.respiratoryRate.push({ date: rec.date, value: rec.respiratoryRate });
        }
        if (typeof rec.oxygenSaturation === "number") {
            result.oxygenSaturation.push({ date: rec.date, value: rec.oxygenSaturation });
        }
        if (typeof rec.bodyTemperature === "number") {
            result.bodyTemperature.push({ date: rec.date, value: rec.bodyTemperature });
        }
        if (
            rec.bloodPressure &&
            typeof rec.bloodPressure.systolic === "number" &&
            typeof rec.bloodPressure.diastolic === "number"
        ) {
            result.bloodPressure.push({
                date: rec.date,
                systolic: rec.bloodPressure.systolic,
                diastolic: rec.bloodPressure.diastolic,
            });
        }
    }

    const sortByDate = <T extends { date: string }>(arr: T[]) => {
        arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    };

    sortByDate(result.heartRate);
    sortByDate(result.respiratoryRate);
    sortByDate(result.oxygenSaturation);
    sortByDate(result.bodyTemperature);
    sortByDate(result.bloodPressure);

    return result;
}

/**
 * Simplified formatter for EVA assessments.  The returned array is already
 * ordered chronologically to make chart rendering trivial.
 */
export function formatEvaForChart(records: EvaAssessment[]): TimeValueDatum[] {
    const out: TimeValueDatum[] = records.map(r => ({ date: r.date, value: r.score }));
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return out;
}

/**
 * Convert an ISO date string into a short dd/MM label suitable for chart
 * axes.  Handles bare dates or full timestamps by normalizing to UTC.  If the
 * input is falsy or cannot be parsed, an empty string is returned so that
 * chart libraries can gracefully ignore the value.
 */
export function formatChartDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
    }).format(d);
}
