import { describe, expect, it } from "vitest";
import { buildSaveEncounterProgressBundle } from "../save-encounter-progress-bundle.mapper";

describe("buildSaveEncounterProgressBundle", () => {
    it("builds a transaction bundle that replaces previous managed clinical snapshot", () => {
        const bundle = buildSaveEncounterProgressBundle(
            {
                encounterId: "enc-123",
                patientId: "patient-1",
                episodeOfCareId: "episode-1",
                performerId: "prac-1",
                practitionerName: "Lic. Ramiro Perez",
                visitType: "follow-up",
                actualStartAt: "2026-03-20T09:15:00.000Z",
                recordedAt: "2026-03-20T11:00:00.000Z",
                clinicalNote: "Nota parcial",
                procedures: [],
                heartRate: 81,
            },
            {
                resourceType: "Encounter",
                id: "enc-123",
                status: "in-progress",
            },
            {
                observationIds: ["obs-1", "obs-2"],
                procedureIds: ["proc-1"],
            }
        ) as {
            resourceType: string;
            type: string;
            entry: Array<{ request: { method: string; url: string }; resource?: Record<string, unknown> }>;
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

        const createEntries = bundle.entry.slice(4);
        expect(createEntries.every((entry) => entry.request.method === "POST")).toBe(true);
        expect(createEntries.every((entry) => entry.request.url === "Observation")).toBe(true);
    });
});
