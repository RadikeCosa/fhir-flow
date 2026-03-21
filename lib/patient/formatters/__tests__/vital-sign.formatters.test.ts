import { describe, expect, it } from "vitest";
import {
    getBloodPressureSingleValuePresentation,
    getClinicalStateAccentColor,
    getVitalSignSingleValuePresentation,
} from "../vital-sign.formatters";
import { getEvaBadge } from "../assessments/eva-assessment.formatters";

describe("vital-sign.formatters single-value presentation", () => {
    it("reuses vital-sign badges for single-value fallback presentation", () => {
        const presentation = getVitalSignSingleValuePresentation("heart-rate", 80);

        expect(presentation.badge.label).toBe("Normal");
        expect(presentation.badge.colorClass).toBe("bg-badge-success-bg text-badge-success-text");
        expect(presentation.accentColor).toBe("var(--color-success)");
    });

    it("reuses blood-pressure badges for single-value fallback presentation", () => {
        const presentation = getBloodPressureSingleValuePresentation(150, 95);

        expect(presentation.badge.label).toBe("Alerta");
        expect(presentation.badge.colorClass).toBe("bg-badge-warning-bg text-badge-warning-text");
        expect(presentation.accentColor).toBe("#d97706");
    });

    it("derives accent colors from the existing badge semantics", () => {
        expect(getClinicalStateAccentColor(getEvaBadge(0))).toBe("var(--color-success)");
        expect(getClinicalStateAccentColor(getEvaBadge(5))).toBe("#d97706");
        expect(getClinicalStateAccentColor(getEvaBadge(9))).toBe("var(--color-error)");
    });
});
