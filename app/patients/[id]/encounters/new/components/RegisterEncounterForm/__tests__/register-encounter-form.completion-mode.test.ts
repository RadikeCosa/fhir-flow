import { describe, expect, it, vi } from "vitest";

vi.mock("../../../actions/register-encounter.action", () => ({
    registerEncounterAction: vi.fn(),
}));
vi.mock("../../../../[encounterId]/actions/save-encounter-progress.action", () => ({
    saveEncounterProgressAction: vi.fn(),
}));
vi.mock("../../../../[encounterId]/actions/finalize-encounter.action", () => ({
    finalizeEncounterAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: vi.fn() }),
    usePathname: () => "/patients/pat-1/encounters/register",
}));

import {
    normalizeOptionalString,
    resolveRegisterCompletionMode,
} from "../index";

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

describe("normalizeOptionalString", () => {
    it("returns undefined when value is empty or spaces", () => {
        expect(normalizeOptionalString("")).toBeUndefined();
        expect(normalizeOptionalString("   ")).toBeUndefined();
        expect(normalizeOptionalString(undefined)).toBeUndefined();
    });

    it("trims and keeps non-empty values", () => {
        expect(normalizeOptionalString(" nota clínica ")).toBe("nota clínica");
    });
});
