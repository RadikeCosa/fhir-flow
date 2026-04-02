import { describe, expect, it } from "vitest";

import { buildFinalizeEncounterBundle } from "../finalize-encounter-bundle.mapper";

function makeInput() {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        visitType: "follow-up" as const,
        actualStartAt: "2026-03-20T10:00:00.000Z",
        actualEndAt: "2026-03-20T11:00:00.000Z",
        clinicalNote: "Paciente estable",
        procedures: [],
        heartRate: 80,
        evaScore: 4,
    };
}

describe("buildFinalizeEncounterBundle", () => {
    it("includes encounter update + managed snapshot deletes + final clinical posts in one transaction bundle", () => {
        const bundle = buildFinalizeEncounterBundle(makeInput(), {
            observationIds: ["obs-1", "obs-2"],
            procedureIds: ["proc-1"],
        }) as {
            resourceType: string;
            type: string;
            entry: Array<{ request: { method: string; url: string } }>;
        };

        expect(bundle.resourceType).toBe("Bundle");
        expect(bundle.type).toBe("transaction");
        expect(bundle.entry[0]?.request).toEqual({
            method: "PUT",
            url: "Encounter/enc-123",
        });

        const deleteEntries = bundle.entry.slice(1, 4).map((entry) => entry.request);
        expect(deleteEntries).toEqual([
            { method: "DELETE", url: "Observation/obs-1" },
            { method: "DELETE", url: "Observation/obs-2" },
            { method: "DELETE", url: "Procedure/proc-1" },
        ]);

        const postEntries = bundle.entry.slice(4);
        expect(postEntries.every((entry) => entry.request.method === "POST")).toBe(true);
    });

    it("keeps previous finalize behavior when no existing snapshot ids are provided", () => {
        const bundle = buildFinalizeEncounterBundle(makeInput()) as {
            entry: Array<{ request: { method: string } }>;
        };

        expect(bundle.entry[0]?.request.method).toBe("PUT");
        expect(bundle.entry.slice(1).every((entry) => entry.request.method === "POST")).toBe(true);
    });
});
