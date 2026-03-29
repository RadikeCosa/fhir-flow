import { describe, expect, it, vi } from "vitest";

vi.mock("../../../actions/register-encounter.action", () => ({
    registerEncounterAction: vi.fn(),
}));

import { resolveRegisterCompletionMode } from "../index";

describe("resolveRegisterCompletionMode", () => {
    it("returns start for the start submit button", () => {
        expect(
            resolveRegisterCompletionMode({
                dataset: { completionMode: "start" },
            }),
        ).toBe("start");
    });

    it("returns complete for the complete submit button", () => {
        expect(
            resolveRegisterCompletionMode({
                dataset: { completionMode: "complete" },
            }),
        ).toBe("complete");
    });

    it("returns null when completionMode is missing", () => {
        expect(
            resolveRegisterCompletionMode({ dataset: {} as DOMStringMap }),
        ).toBeNull();
    });
});