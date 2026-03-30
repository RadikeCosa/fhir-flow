import { afterEach, describe, expect, it, vi } from "vitest";
import { FhirClient } from "../fhir-client";

describe("FhirClient URL composition", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does not duplicate /fhir when fetchByUrl receives an absolute Bundle link", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
                status: 200,
                headers: { "content-type": "application/fhir+json" },
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        const client = new FhirClient({
            baseUrl: "http://localhost:8080/fhir",
            defaultHeaders: { Accept: "application/fhir+json" },
        });

        await client.fetchByUrl("http://localhost:8080/fhir/Observation?_count=50&_getpages=abc");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/fhir/Observation?_count=50&_getpages=abc");
    });

    it("normalizes absolute-path links that already include base /fhir", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ resourceType: "Bundle", entry: [] }), {
                status: 200,
                headers: { "content-type": "application/fhir+json" },
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        const client = new FhirClient({
            baseUrl: "http://localhost:8080/fhir",
            defaultHeaders: { Accept: "application/fhir+json" },
        });

        await client.fetchByUrl("/fhir/Observation?_count=50&_getpages=abc");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/fhir/Observation?_count=50&_getpages=abc");
    });
});
