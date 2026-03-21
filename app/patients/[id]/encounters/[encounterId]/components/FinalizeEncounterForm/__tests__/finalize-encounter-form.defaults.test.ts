import { describe, expect, it, vi } from "vitest";
import { resolveInitialActualDate } from "../finalize-encounter-form.defaults";

describe("finalize-encounter-form.defaults", () => {
    it("uses plannedDate as initial actualDate when available", () => {
        const now = new Date("2026-03-21T12:00:00.000Z");
        const result = resolveInitialActualDate("2026-03-20", now);
        expect(result).toBe("2026-03-20");
    });

    it("uses today when plannedDate is missing", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-21T12:00:00.000Z"));

        const result = resolveInitialActualDate(undefined);
        expect(result).toBe("2026-03-21");

        vi.useRealTimers();
    });
});
