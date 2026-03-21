import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatPlannedDateTime } from "../shared.formatters";

describe("shared.formatters", () => {
    it("formats date-only and datetime safely", () => {
        expect(formatDate("2026-03-21")).toBe("21/03/2026");

        const dt = formatDateTime("2026-07-01T13:00:00.000Z");
        expect(dt).toBeDefined();
        expect(dt).toMatch(/01\/07\/2026/);
        // App timezone set to UTC-3 => 13:00 UTC = 10:00 local (America/Argentina/Buenos_Aires)
        expect(dt).toContain("10:00");
    });

    it("formats planned date values with fallback text", () => {
        expect(formatPlannedDateTime("2026-03-21")).toBe("21/03/2026 • Sin horario definido");
        expect(formatPlannedDateTime("2026-07-01T13:00:00.000Z")).toContain("01/07/2026");
    });

    it("returns undefined for invalid date inputs", () => {
        expect(formatDate("baddate")).toBeUndefined();
        expect(formatDateTime("baddate")).toBeUndefined();
        expect(formatPlannedDateTime("baddate")).toBeUndefined();
    });
});
