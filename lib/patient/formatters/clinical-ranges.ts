import { EVA_RANGES } from "../../../domain/assessments/eva-assessment";
import type { VitalSignType } from "../../../domain/vital-sign-record/vital-sign-record";

export type ClinicalZone = {
    min: number;
    max: number;
    label: string;
    severity: "normal" | "warning" | "critical";
};

export type ClinicalRanges =
    | {
        kind: "binary";
        normal: ClinicalZone;
        warning?: ClinicalZone[];
        critical?: ClinicalZone[];
    }
    | {
        kind: "ordinal";
        zones: ClinicalZone[];
    };

export const CLINICAL_RANGES = {
    heartRate: {
        kind: "binary",
        normal: { min: 60, max: 100, label: "Normal", severity: "normal" },
        warning: [
            { min: 50, max: 59, label: "Alerta", severity: "warning" },
            { min: 101, max: 120, label: "Alerta", severity: "warning" },
        ],
        critical: [
            { min: Number.NEGATIVE_INFINITY, max: 49, label: "Crítico", severity: "critical" },
            { min: 121, max: Number.POSITIVE_INFINITY, label: "Crítico", severity: "critical" },
        ],
    },
    respiratoryRate: {
        kind: "binary",
        normal: { min: 12, max: 20, label: "Normal", severity: "normal" },
        warning: [
            { min: 10, max: 11, label: "Alerta", severity: "warning" },
            { min: 21, max: 25, label: "Alerta", severity: "warning" },
        ],
        critical: [
            { min: Number.NEGATIVE_INFINITY, max: 9, label: "Crítico", severity: "critical" },
            { min: 26, max: Number.POSITIVE_INFINITY, label: "Crítico", severity: "critical" },
        ],
    },
    oxygenSaturation: {
        kind: "binary",
        normal: { min: 95, max: Number.POSITIVE_INFINITY, label: "Normal", severity: "normal" },
        warning: [
            { min: 90, max: 94, label: "Alerta", severity: "warning" },
        ],
        critical: [
            { min: Number.NEGATIVE_INFINITY, max: 89, label: "Crítico", severity: "critical" },
        ],
    },
    bodyTemperature: {
        kind: "binary",
        normal: { min: 36.0, max: 37.4, label: "Normal", severity: "normal" },
        warning: [
            { min: 35.0, max: 35.9, label: "Alerta", severity: "warning" },
            { min: 37.5, max: 38.5, label: "Alerta", severity: "warning" },
        ],
        critical: [
            { min: Number.NEGATIVE_INFINITY, max: 34.9, label: "Crítico", severity: "critical" },
            { min: 38.6, max: Number.POSITIVE_INFINITY, label: "Crítico", severity: "critical" },
        ],
    },
    bloodPressure: {
        kind: "binary",
        normal: { min: 90, max: 139, label: "Normal", severity: "normal" },
        warning: [
            { min: 140, max: 159, label: "Alerta", severity: "warning" },
        ],
        critical: [
            { min: Number.NEGATIVE_INFINITY, max: 89, label: "Crítico", severity: "critical" },
            { min: 160, max: Number.POSITIVE_INFINITY, label: "Crítico", severity: "critical" },
        ],
    },
} as const satisfies Record<
    "heartRate" | "respiratoryRate" | "oxygenSaturation" | "bodyTemperature" | "bloodPressure",
    ClinicalRanges
>;

const VITAL_SIGN_RANGE_MAP: Record<VitalSignType, keyof typeof CLINICAL_RANGES> = {
    "heart-rate": "heartRate",
    "respiratory-rate": "respiratoryRate",
    "oxygen-saturation": "oxygenSaturation",
    "body-temperature": "bodyTemperature",
    "blood-pressure": "bloodPressure",
};

export function getClinicalRanges(type: VitalSignType): ClinicalRanges {
    return CLINICAL_RANGES[VITAL_SIGN_RANGE_MAP[type]];
}

export function getEvaClinicalRanges(): ClinicalRanges {
    return {
        kind: "ordinal",
        zones: [
            { ...EVA_RANGES.none, severity: "normal" },
            { ...EVA_RANGES.mild, severity: "normal" },
            { ...EVA_RANGES.moderate, severity: "warning" },
            { ...EVA_RANGES.severe, severity: "critical" },
            { ...EVA_RANGES.worst, severity: "critical" },
        ],
    };
}

export function getClinicalZones(ranges: ClinicalRanges): ClinicalZone[] {
    if (ranges.kind === "ordinal") {
        return [...ranges.zones].sort((left, right) => left.min - right.min);
    }

    return [
        ...(ranges.critical ?? []),
        ...(ranges.warning ?? []),
        ranges.normal,
    ].sort((left, right) => left.min - right.min);
}

export function getClinicalZoneForValue(ranges: ClinicalRanges, value: number): ClinicalZone | undefined {
    return getClinicalZones(ranges).find(zone => value >= zone.min && value <= zone.max);
}
