import { EvaAssessment } from "../../../domain/assessments/eva-assessment";
import { VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";

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
    heartRate: { min: 40, max: 180 },
    respiratoryRate: { min: 8, max: 30 },
    oxygenSaturation: { min: 85, max: 100 },
    bodyTemperature: { min: 35.0, max: 42.0 },
    bloodPressure: { min: 60, max: 200 }, // applies to both systolic and diastolic axes
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
};

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
