import { describe, expect, it } from "vitest";
import {
    adaptClinicalRangesToChartReferences,
    CLINICAL_CHART_COLORS,
} from "../encounter-charts.formatters";
import {
    CLINICAL_RANGES,
    getClinicalRanges,
    getClinicalZoneForValue,
    getClinicalZones,
    getEvaClinicalRanges,
} from "../clinical-ranges";
import { getBloodPressureBadge, getVitalSignBadge } from "../vital-sign.formatters";

const BADGE_SEVERITY_TO_COLOR = {
    normal: "bg-badge-success-bg text-badge-success-text",
    warning: "bg-badge-warning-bg text-badge-warning-text",
    critical: "bg-badge-error-bg text-badge-error-text",
} as const;

describe("clinical-ranges", () => {
    it("keeps vital-sign badge semantics aligned with the shared clinical ranges", () => {
        const samples = [
            { type: "heart-rate" as const, value: 45 },
            { type: "heart-rate" as const, value: 55 },
            { type: "heart-rate" as const, value: 80 },
            { type: "heart-rate" as const, value: 110 },
            { type: "heart-rate" as const, value: 130 },
            { type: "respiratory-rate" as const, value: 8 },
            { type: "respiratory-rate" as const, value: 10 },
            { type: "respiratory-rate" as const, value: 16 },
            { type: "respiratory-rate" as const, value: 24 },
            { type: "respiratory-rate" as const, value: 28 },
            { type: "oxygen-saturation" as const, value: 88 },
            { type: "oxygen-saturation" as const, value: 92 },
            { type: "oxygen-saturation" as const, value: 98 },
            { type: "body-temperature" as const, value: 34.8 },
            { type: "body-temperature" as const, value: 35.4 },
            { type: "body-temperature" as const, value: 36.7 },
            { type: "body-temperature" as const, value: 38.1 },
            { type: "body-temperature" as const, value: 39.2 },
        ];

        for (const sample of samples) {
            const zone = getClinicalZoneForValue(getClinicalRanges(sample.type), sample.value);
            const badge = getVitalSignBadge(sample.type, sample.value);

            expect(zone).toBeDefined();
            expect(badge.label).toBe(zone?.label);
            expect(badge.colorClass).toBe(zone ? BADGE_SEVERITY_TO_COLOR[zone.severity] : undefined);
        }
    });

    it("keeps blood-pressure badge semantics aligned with the shared clinical ranges", () => {
        for (const systolic of [80, 90, 120, 145, 170]) {
            const zone = getClinicalZoneForValue(getClinicalRanges("blood-pressure"), systolic);
            const badge = getBloodPressureBadge(systolic, 70);

            expect(zone).toBeDefined();
            expect(badge.label).toBe(zone?.label);
            expect(badge.colorClass).toBe(zone ? BADGE_SEVERITY_TO_COLOR[zone.severity] : undefined);
        }
    });

    it("defines non-overlapping ranges with full coverage for vital signs", () => {
        const integerRangeKeys = ["heartRate", "respiratoryRate", "oxygenSaturation", "bloodPressure"] as const;

        for (const key of integerRangeKeys) {
            const zones = getClinicalZones(CLINICAL_RANGES[key]);

            for (let index = 1; index < zones.length; index += 1) {
                expect(zones[index - 1].max).toBeLessThan(zones[index].min);
            }

            expect(zones[0].min).toBe(Number.NEGATIVE_INFINITY);
            expect(zones[zones.length - 1].max).toBe(Number.POSITIVE_INFINITY);
        }

        const bodyTemperatureZones = getClinicalZones(CLINICAL_RANGES.bodyTemperature);
        expect(bodyTemperatureZones).toEqual([
            { min: Number.NEGATIVE_INFINITY, max: 34.9, label: "Crítico", severity: "critical" },
            { min: 35, max: 35.9, label: "Alerta", severity: "warning" },
            { min: 36, max: 37.4, label: "Normal", severity: "normal" },
            { min: 37.5, max: 38.5, label: "Alerta", severity: "warning" },
            { min: 38.6, max: Number.POSITIVE_INFINITY, label: "Crítico", severity: "critical" },
        ]);
    });

    it("covers the full expected sampling domain for vital signs without gaps", () => {
        const assertCoverage = (values: number[], ranges: ReturnType<typeof getClinicalRanges>) => {
            for (const value of values) {
                expect(getClinicalZoneForValue(ranges, value)).toBeDefined();
            }
        };

        assertCoverage(Array.from({ length: 251 }, (_, index) => index), getClinicalRanges("heart-rate"));
        assertCoverage(Array.from({ length: 61 }, (_, index) => index), getClinicalRanges("respiratory-rate"));
        assertCoverage(Array.from({ length: 51 }, (_, index) => 50 + index), getClinicalRanges("oxygen-saturation"));
        assertCoverage(Array.from({ length: 241 }, (_, index) => 30 + index), getClinicalRanges("blood-pressure"));
        assertCoverage(
            Array.from({ length: 131 }, (_, index) => Number((30 + index * 0.1).toFixed(1))),
            getClinicalRanges("body-temperature"),
        );
    });

    it("preserves all five EVA zones when adapting domain ranges", () => {
        const evaRanges = getEvaClinicalRanges();
        const chartReferences = adaptClinicalRangesToChartReferences(evaRanges, {
            includeNormalRange: false,
            includeNormalReferenceZones: true,
        });

        expect(evaRanges.kind).toBe("ordinal");
        expect(evaRanges.zones).toHaveLength(5);
        expect(chartReferences.normalRange).toBeUndefined();
        expect(chartReferences.referenceZones).toEqual([
            { y1: 0, y2: 0, fill: CLINICAL_CHART_COLORS.normal },
            { y1: 1, y2: 3, fill: CLINICAL_CHART_COLORS.normal },
            { y1: 4, y2: 6, fill: CLINICAL_CHART_COLORS.alert },
            { y1: 7, y2: 9, fill: CLINICAL_CHART_COLORS.critical },
            { y1: 10, y2: 10, fill: CLINICAL_CHART_COLORS.critical },
        ]);
    });
});
