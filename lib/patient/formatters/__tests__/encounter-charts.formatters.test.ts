import { describe, expect, it } from "vitest";
import { CLINICAL_CHART_RANGES, formatChartDate } from "../encounter-charts.formatters";
import { VITAL_SIGN_CAPTURE_RANGES } from "../../../clinical/vital-sign-capture-ranges";

describe("encounter-charts.formatters", () => {
    it("keeps clinical chart ranges aligned with capture ranges", () => {
        expect(CLINICAL_CHART_RANGES.heartRate.min).toBeLessThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.heartRate.min);
        expect(CLINICAL_CHART_RANGES.heartRate.max).toBeGreaterThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.heartRate.max);

        expect(CLINICAL_CHART_RANGES.respiratoryRate.min).toBeLessThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.min);
        expect(CLINICAL_CHART_RANGES.respiratoryRate.max).toBeGreaterThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.max);

        expect(CLINICAL_CHART_RANGES.bodyTemperature.min).toBeLessThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.min);
        expect(CLINICAL_CHART_RANGES.bodyTemperature.max).toBeGreaterThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.max);

        // shared blood pressure axis must include systolic range and cover high systolic and diastolic
        expect(CLINICAL_CHART_RANGES.bloodPressure.min).toBeLessThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min);
        expect(CLINICAL_CHART_RANGES.bloodPressure.max).toBeGreaterThanOrEqual(VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max);
        expect(CLINICAL_CHART_RANGES.bloodPressure.min).toBeLessThanOrEqual(40); // expected target value in ticket
        expect(CLINICAL_CHART_RANGES.bloodPressure.max).toBeGreaterThanOrEqual(280); // expected target value in ticket
    });

    it("sets oxygen saturation chart range to 50-100", () => {
        expect(CLINICAL_CHART_RANGES.oxygenSaturation.min).toBe(50);
        expect(CLINICAL_CHART_RANGES.oxygenSaturation.max).toBe(100);
    });

    it("shows time in chart labels when datetime precision is available", () => {
        expect(formatChartDate("2026-03-15")).toContain("15/");
        const withTimestamp = formatChartDate("2026-03-15T12:30:00.000Z");
        expect(withTimestamp).toContain("15/");
        expect(withTimestamp).toContain("12:30");
    });

});
