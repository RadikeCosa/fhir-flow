import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function loadConfigModule() {
    vi.resetModules();
    return import("../fhir.config");
}

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
});

describe("fhir.config env validation", () => {
    it("throws when CURRENT_PRACTITIONER_ID is missing", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        delete (process.env as Partial<NodeJS.ProcessEnv>).CURRENT_PRACTITIONER_ID;

        await expect(loadConfigModule()).rejects.toThrow(
            "Missing required environment variable: CURRENT_PRACTITIONER_ID"
        );
    });

    it("exports a trimmed practitioner id when env vars are valid", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        process.env.CURRENT_PRACTITIONER_ID = "  kine-1  ";

        const config = await loadConfigModule();

        expect(config.currentPractitionerId).toBe("kine-1");
    });
});
