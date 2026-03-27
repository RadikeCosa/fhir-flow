import { EVA_RANGES } from "../../../domain/assessments/eva-assessment";
import type { VitalSignType } from "../../../domain/vital-sign-record/vital-sign-record";
import {
    CLINICAL_CHART_COLORS,
    CLINICAL_CHART_RANGES,
    type TimeValueDatum,
} from "./encounter-charts.formatters";
import { CLINICAL_RANGES } from "./clinical-ranges";

export type ChartMetricType = VitalSignType | "eva";

export type EnrichedChartDatum = {
    date: string;
    rawValue: number;
    chartValue: number;
    severity?: "normal" | "warning" | "critical";
    zone?: {
        label: string;
        color: string;
    };
};

export type ChartZone = {
    y1: number;
    y2: number;
    fill: string;
    severity: "normal" | "warning" | "critical";
};

type ChartSeverity = ChartZone["severity"];

type ClinicalBand = {
    min: number;
    max: number;
    label: string;
    severity: ChartSeverity;
};

type ClinicalBandWithExclusiveMax = ClinicalBand & {
    exclusiveMax: number;
};

const SEVERITY_COLORS: Record<ChartSeverity, string> = {
    normal: CLINICAL_CHART_COLORS.normal,
    warning: CLINICAL_CHART_COLORS.alert,
    critical: CLINICAL_CHART_COLORS.critical,
};

const VITAL_SIGN_RANGE_MAP: Record<VitalSignType, keyof typeof CLINICAL_RANGES> = {
    "heart-rate": "heartRate",
    "respiratory-rate": "respiratoryRate",
    "oxygen-saturation": "oxygenSaturation",
    "body-temperature": "bodyTemperature",
    "blood-pressure": "bloodPressure",
};

const EVA_BAND_ORDER = ["none", "mild", "moderate", "severe", "worst"] as const;

function getChartDomain(metricType: ChartMetricType): { min: number; max: number } {
    if (metricType === "eva") {
        return CLINICAL_CHART_RANGES.eva;
    }

    const chartKey = VITAL_SIGN_RANGE_MAP[metricType];

    switch (chartKey) {
        case "heartRate":
            return CLINICAL_CHART_RANGES.heartRate;
        case "respiratoryRate":
            return CLINICAL_CHART_RANGES.respiratoryRate;
        case "oxygenSaturation":
            return CLINICAL_CHART_RANGES.oxygenSaturation;
        case "bodyTemperature":
            return CLINICAL_CHART_RANGES.bodyTemperature;
        case "bloodPressure":
            return CLINICAL_CHART_RANGES.bloodPressure;
    }
}

function getBandsForMetric(metricType: ChartMetricType): ClinicalBand[] {
    if (metricType === "eva") {
        return EVA_BAND_ORDER.map((key) => {
            const range = EVA_RANGES[key];

            return {
                min: range.min,
                max: range.max,
                label: range.label,
                severity:
                    key === "none" || key === "mild"
                        ? "normal"
                        : key === "moderate"
                            ? "warning"
                            : "critical",
            };
        });
    }

    const ranges = CLINICAL_RANGES[VITAL_SIGN_RANGE_MAP[metricType]];

    return [
        ...(ranges.critical ?? []),
        ...(ranges.warning ?? []),
        ranges.normal,
    ]
        .sort((left, right) => left.min - right.min)
        .map((zone) => ({
            min: zone.min,
            max: zone.max,
            label: zone.label,
            severity: zone.severity,
        }));
}

function getBandsWithExclusiveMax(metricType: ChartMetricType): ClinicalBandWithExclusiveMax[] {
    const bands = getBandsForMetric(metricType);

    return bands.map((band, index) => {
        const nextBand = bands[index + 1];
        const exclusiveMax = nextBand ? nextBand.min : Number.POSITIVE_INFINITY;

        return {
            ...band,
            exclusiveMax,
        };
    });
}

function getMatchingBand(value: number, metricType: ChartMetricType): ClinicalBandWithExclusiveMax | undefined {
    return getBandsWithExclusiveMax(metricType).find((band) => value >= band.min && value < band.exclusiveMax);
}

function getSeverityColor(severity: ChartSeverity): string {
    return SEVERITY_COLORS[severity];
}

export function resolveZoneBounds(
    min: number,
    max: number,
    chartMin: number,
    chartMax: number,
): { y1: number; y2: number } {
    return {
        y1: min === Number.NEGATIVE_INFINITY ? chartMin : min,
        y2: max === Number.POSITIVE_INFINITY ? chartMax : max,
    };
}

export function getValueSeverity(value: number, metricType: ChartMetricType): "normal" | "warning" | "critical" {
    return getMatchingBand(value, metricType)?.severity ?? "normal";
}

export function toChartZones(metricType: ChartMetricType): ChartZone[] {
    const chartDomain = getChartDomain(metricType);

    return getBandsWithExclusiveMax(metricType).map((band) => ({
        ...resolveZoneBounds(band.min, band.exclusiveMax, chartDomain.min, chartDomain.max),
        fill: getSeverityColor(band.severity),
        severity: band.severity,
    }));
}

export function enrichChartData(data: TimeValueDatum[], metricType: ChartMetricType): EnrichedChartDatum[] {
    const chartDomain = getChartDomain(metricType);
    const zones = getBandsWithExclusiveMax(metricType);

    return data.map((datum) => {
        const severity = getValueSeverity(datum.value, metricType);
        const matchingZone = zones.find((zone) => datum.value >= zone.min && datum.value < zone.exclusiveMax);

        return {
            date: datum.date,
            rawValue: datum.value,
            chartValue: Math.max(chartDomain.min, Math.min(chartDomain.max, datum.value)),
            severity,
            zone: matchingZone
                ? {
                    label: matchingZone.label,
                    color: getSeverityColor(matchingZone.severity),
                }
                : undefined,
        };
    });
}
