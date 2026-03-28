import { describe, expect, it } from "vitest";
import { buildRegisterEncounterBundle } from "../register-encounter-bundle.mapper";

describe("buildRegisterEncounterBundle", () => {
    it("creates only encounter entry when no clinical payload is provided", () => {
        const bundle = buildRegisterEncounterBundle("enc-123", {
            patientId: "patient-1",
            episodeOfCareId: "episode-1",
            performerId: "prac-1",
            practitionerName: "Lic. Ramiro Perez",
            visitType: "follow-up",
            completionMode: "start",
            actualStartAt: "2026-03-20T09:00:00.000Z",
            procedures: [],
        }) as {
            resourceType: string;
            type: string;
            entry: Array<{ request: { method: string; url: string } }>;
        };

        expect(bundle.resourceType).toBe("Bundle");
        expect(bundle.type).toBe("transaction");
        expect(bundle.entry).toHaveLength(1);
        expect(bundle.entry[0]?.request).toEqual({
            method: "PUT",
            url: "Encounter/enc-123",
        });
    });

    it("adds clinical entries when payload includes vital signs/eva/procedures", () => {
        const bundle = buildRegisterEncounterBundle("enc-123", {
            patientId: "patient-1",
            episodeOfCareId: "episode-1",
            performerId: "prac-1",
            practitionerName: "Lic. Ramiro Perez",
            visitType: "follow-up",
            completionMode: "complete",
            actualStartAt: "2026-03-20T09:00:00.000Z",
            actualEndAt: "2026-03-20T10:00:00.000Z",
            clinicalNote: "Paciente estable",
            heartRate: 82,
            evaScore: 4,
            procedures: [
                {
                    category: "rehabilitacion-respiratoria",
                    code: "ejercicios-respiratorios",
                    note: "Con buena tolerancia",
                },
            ],
        }) as {
            resourceType: string;
            type: string;
            entry: Array<{ request: { method: string; url: string }; resource?: Record<string, unknown> }>;
        };

        expect(bundle.resourceType).toBe("Bundle");
        expect(bundle.type).toBe("transaction");
        expect(bundle.entry.length).toBeGreaterThan(1);

        const [encounterEntry, ...clinicalEntries] = bundle.entry;
        expect(encounterEntry?.request).toEqual({
            method: "PUT",
            url: "Encounter/enc-123",
        });

        expect(clinicalEntries.length).toBeGreaterThan(0);
        expect(clinicalEntries.every((entry) => entry.request.method === "POST")).toBe(true);
        expect(clinicalEntries.every((entry) => entry.request.url === "Observation" || entry.request.url === "Procedure")).toBe(true);
    });
});
