import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChartTooltip from "../ChartTooltip";

describe("ChartTooltip", () => {
    it("prefers rawValue when the payload carries an enriched datum", () => {
        const markup = renderToStaticMarkup(
            createElement(ChartTooltip, {
                active: true,
                label: "01/03/2026",
                unit: "%",
                payload: [
                    {
                        name: "SpO₂",
                        value: 50,
                        color: "#0891b2",
                        payload: {
                            rawValue: 30,
                        },
                    },
                ],
            }),
        );

        expect(markup).toContain("30 %");
        expect(markup).not.toContain("50 %");
    });

    it("falls back to value when rawValue is absent", () => {
        const markup = renderToStaticMarkup(
            createElement(ChartTooltip, {
                active: true,
                label: "01/03/2026",
                unit: "lpm",
                payload: [
                    {
                        name: "FC",
                        value: 80,
                        color: "#2563eb",
                    },
                ],
            }),
        );

        expect(markup).toContain("80 lpm");
    });
});