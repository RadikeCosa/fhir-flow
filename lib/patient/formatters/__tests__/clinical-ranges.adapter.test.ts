import { describe, expect, it } from "vitest";
import { getBloodPressureBadge, getVitalSignBadge } from "../vital-sign.formatters";
import { CLINICAL_CHART_RANGES, type TimeValueDatum } from "../encounter-charts.formatters";
import { CLINICAL_RANGES } from "../clinical-ranges";
import {
    type ChartMetricType,
    enrichChartData,
    getValueSeverity,
    resolveZoneBounds,
    toChartZones,
} from "../clinical-ranges.adapter";

function expectSeverity(metricType: ChartMetricType, value: number, expected: "normal" | "warning" | "critical") {
    if (metricType === "eva") {
        expect(getValueSeverity(value, "eva")).toBe(expected);
        return;
    }

    expect(getValueSeverity(value, metricType)).toBe(expected);
}

describe("clinical-ranges.adapter", () => {
    describe("getValueSeverity", () => {
        it("classifies heart-rate with half-open bounds", () => {
            expect(getValueSeverity(59, "heart-rate")).toBe("warning");
            expect(getValueSeverity(60, "heart-rate")).toBe("normal");
            expect(getValueSeverity(100, "heart-rate")).toBe("normal");
            expect(getValueSeverity(101, "heart-rate")).toBe("warning");
            expect(getValueSeverity(120, "heart-rate")).toBe("warning");
            expect(getValueSeverity(121, "heart-rate")).toBe("critical");
        });

        it("classifies respiratory-rate at the expected boundaries", () => {
            expect(getValueSeverity(9, "respiratory-rate")).toBe("critical");
            expect(getValueSeverity(10, "respiratory-rate")).toBe("warning");
            expect(getValueSeverity(11, "respiratory-rate")).toBe("warning");
            expect(getValueSeverity(12, "respiratory-rate")).toBe("normal");
            expect(getValueSeverity(20, "respiratory-rate")).toBe("normal");
            expect(getValueSeverity(21, "respiratory-rate")).toBe("warning");
            expect(getValueSeverity(25, "respiratory-rate")).toBe("warning");
            expect(getValueSeverity(26, "respiratory-rate")).toBe("critical");
        });

        it("classifies oxygen-saturation boundaries", () => {
            expect(getValueSeverity(94, "oxygen-saturation")).toBe("warning");
            expect(getValueSeverity(95, "oxygen-saturation")).toBe("normal");
            expect(getValueSeverity(89, "oxygen-saturation")).toBe("critical");
        });

        it("classifies body-temperature boundaries", () => {
            expect(getValueSeverity(35.9, "body-temperature")).toBe("warning");
            expect(getValueSeverity(36.0, "body-temperature")).toBe("normal");
            expect(getValueSeverity(37.4, "body-temperature")).toBe("normal");
            expect(getValueSeverity(37.5, "body-temperature")).toBe("warning");
            expect(getValueSeverity(38.5, "body-temperature")).toBe("warning");
            expect(getValueSeverity(38.6, "body-temperature")).toBe("critical");
            expect(getValueSeverity(34.9, "body-temperature")).toBe("critical");
        });

        it("classifies blood-pressure using the systolic value", () => {
            expect(getValueSeverity(89, "blood-pressure")).toBe("critical");
            expect(getValueSeverity(90, "blood-pressure")).toBe("normal");
            expect(getValueSeverity(139, "blood-pressure")).toBe("normal");
            expect(getValueSeverity(140, "blood-pressure")).toBe("warning");
        });

        it("classifies EVA using domain ranges without going through CLINICAL_RANGES", () => {
            expect(getValueSeverity(0, "eva")).toBe("normal");
            expect(getValueSeverity(3, "eva")).toBe("normal");
            expect(getValueSeverity(6, "eva")).toBe("warning");
            expect(getValueSeverity(9, "eva")).toBe("critical");
            expect(getValueSeverity(10, "eva")).toBe("critical");
        });
    });

    describe("resolveZoneBounds", () => {
        it("replaces -Infinity and +Infinity with the chart domain", () => {
            const chartRange = CLINICAL_CHART_RANGES.heartRate;

            expect(resolveZoneBounds(Number.NEGATIVE_INFINITY, 49, chartRange.min, chartRange.max)).toEqual({
                y1: chartRange.min,
                y2: 49,
            });
            expect(resolveZoneBounds(121, Number.POSITIVE_INFINITY, chartRange.min, chartRange.max)).toEqual({
                y1: 121,
                y2: chartRange.max,
            });
        });

        it("passes finite values through unchanged", () => {
            expect(resolveZoneBounds(10, 20, 0, 100)).toEqual({ y1: 10, y2: 20 });
        });
    });

    describe("toChartZones", () => {
        it("returns bounded, non-overlapping zones for vital signs", () => {
            const metricTypes = [
                "heart-rate",
                "respiratory-rate",
                "oxygen-saturation",
                "body-temperature",
                "blood-pressure",
            ] as const;

            for (const metricType of metricTypes) {
                const zones = toChartZones(metricType);

                expect(zones.length).toBeGreaterThan(0);

                for (const zone of zones) {
                    expect(Number.isFinite(zone.y1)).toBe(true);
                    expect(Number.isFinite(zone.y2)).toBe(true);
                    expect(Number.isNaN(zone.y1)).toBe(false);
                    expect(Number.isNaN(zone.y2)).toBe(false);
                }

                for (let index = 1; index < zones.length; index += 1) {
                    expect(zones[index - 1].y2).toBeLessThanOrEqual(zones[index].y1);
                }
            }
        });

        it("produces at least five zones for body temperature", () => {
            expect(toChartZones("body-temperature")).toHaveLength(5);
        });

        it("produces exactly five EVA zones with distinct labels", () => {
            const zones = toChartZones("eva");

            expect(zones).toHaveLength(5);
            expect(zones.map((zone) => zone.severity)).toEqual(["normal", "normal", "warning", "critical", "critical"]);

            const evaData = [0, 3, 6, 9, 10].map((value) => ({ date: "2026-03-01", value }));
            const labels = enrichChartData(evaData, "eva").map((point) => point.zone?.label);

            expect(new Set(labels).size).toBe(5);
        });
    });

    describe("enrichChartData", () => {
        it("clamps chartValue to the visual domain while preserving rawValue", () => {
            const data: TimeValueDatum[] = [{ date: "2026-03-01", value: 30 }];
            const [point] = enrichChartData(data, "oxygen-saturation");

            expect(point.rawValue).toBe(30);
            expect(point.chartValue).toBe(50);
            expect(point.severity).toBe("critical");
        });

        it("populates severity for all metrics", () => {
            const cases: Array<[ChartMetricType, number]> = [
                ["heart-rate", 80],
                ["respiratory-rate", 16],
                ["oxygen-saturation", 97],
                ["body-temperature", 37.0],
                ["blood-pressure", 120],
                ["eva", 6],
            ];

            for (const [metricType, value] of cases) {
                const [point] = enrichChartData([{ date: "2026-03-01", value }], metricType);

                expect(point.severity).toBeDefined();
            }
        });
    });

    describe("badge consistency", () => {
        it("keeps badge severity aligned with getValueSeverity", () => {
            const cases = [
                { metricType: "heart-rate" as const, value: 59, badge: getVitalSignBadge("heart-rate", 59) },
                { metricType: "heart-rate" as const, value: 60, badge: getVitalSignBadge("heart-rate", 60) },
                { metricType: "heart-rate" as const, value: 121, badge: getVitalSignBadge("heart-rate", 121) },
                { metricType: "respiratory-rate" as const, value: 10, badge: getVitalSignBadge("respiratory-rate", 10) },
                { metricType: "oxygen-saturation" as const, value: 94, badge: getVitalSignBadge("oxygen-saturation", 94) },
                { metricType: "body-temperature" as const, value: 37.5, badge: getVitalSignBadge("body-temperature", 37.5) },
                { metricType: "blood-pressure" as const, value: 89, badge: getBloodPressureBadge(89, 60) },
                { metricType: "blood-pressure" as const, value: 140, badge: getBloodPressureBadge(140, 60) },
            ];

            for (const sample of cases) {
                expect(sample.badge.severity).toBeDefined();
                expectSeverity(sample.metricType, sample.value, sample.badge.severity as "normal" | "warning" | "critical");
            }
        });
    });

    it("preserves the shared clinical range source for blood pressure and temperature", () => {
        expect(CLINICAL_RANGES.bloodPressure.normal.min).toBe(90);
        expect(CLINICAL_RANGES.bodyTemperature.warning?.[0].min).toBe(35);
    });
});
