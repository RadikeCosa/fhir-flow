import { afterEach, describe, expect, it, vi } from "vitest";
import type { FhirClient } from "../../../../lib/fhir/fhir-client";

const ORIGINAL_ENV = { ...process.env };

function createClientReturning(resource: unknown) {
    return {
        read: async () => resource,
    } as unknown as FhirClient;
}

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
});

describe("PractitionerFhirRepository", () => {
    it("maps an official practitioner name from FHIR", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        process.env.CURRENT_PRACTITIONER_ID = "kine-1";

        const { PractitionerFhirRepository } = await import("../practitioner.fhir-repository");
        const repo = new PractitionerFhirRepository(
            createClientReturning({
                resourceType: "Practitioner",
                id: "kine-1",
                name: [
                    {
                        use: "official",
                        given: ["Ramiro"],
                        family: "Perez",
                    },
                ],
            })
        );

        await expect(repo.findById("kine-1")).resolves.toEqual({
            id: "kine-1",
            displayName: "Ramiro Perez",
        });
    });

    it("uses name.text when available", async () => {
        process.env.FHIR_BASE_URL = "http://localhost:8080/fhir";
        process.env.CURRENT_PRACTITIONER_ID = "kine-1";

        const { PractitionerFhirRepository } = await import("../practitioner.fhir-repository");
        const repo = new PractitionerFhirRepository(
            createClientReturning({
                resourceType: "Practitioner",
                id: "kine-1",
                name: [
                    {
                        text: "Lic. Ramiro Perez",
                    },
                ],
            })
        );

        await expect(repo.findById("kine-1")).resolves.toEqual({
            id: "kine-1",
            displayName: "Lic. Ramiro Perez",
        });
    });
});
