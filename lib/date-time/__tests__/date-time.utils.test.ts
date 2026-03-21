import { describe, expect, it } from "vitest";
import {
    APP_TIME_ZONE,
    composeLocalDateTimeToUtcIso,
    hasTimeComponent,
    isDateOnly,
} from "../date-time.utils";

describe("date-time utilities", () => {
    it("recognizes date-only values and datetimes", () => {
        expect(isDateOnly("2026-03-21")).toBe(true);
        expect(isDateOnly("2026-03-21T10:00:00.000Z")).toBe(false);
        expect(hasTimeComponent("2026-03-21T10:00:00.000Z")).toBe(true);
        expect(hasTimeComponent("2026-03-21")).toBe(false);
    });

    it("composes local date+time into explicit UTC ISO using app timezone", () => {
        // App timezone = UTC-3 en America/Argentina/Buenos_Aires.
        // Local 2026-07-01 10:00 should corresponder a 13:00 UTC.
        const result = composeLocalDateTimeToUtcIso("2026-07-01", "10:00", APP_TIME_ZONE);

        expect(result.startsWith("2026-07-01T13:00:00")).toBe(true);
        expect(result.endsWith("Z")).toBe(true);
    });

    it("throws on invalid date/time input", () => {
        expect(() => composeLocalDateTimeToUtcIso("invalid", "10:00")).toThrow();
        expect(() => composeLocalDateTimeToUtcIso("2026-07-01", "invalid")).toThrow();
    });
});
