import { describe, expect, it, vi } from "vitest";

import { beforeAll } from "vitest";

let EncounterFhirRepository: typeof import("../encounter.fhir-repository").EncounterFhirRepository;
type RepoClient = NonNullable<ConstructorParameters<typeof EncounterFhirRepository>[0]>;

type SnapshotResource = {
    resourceType: "Observation" | "Procedure";
    id: string;
    code?: string;
    owned?: boolean;
};

const OWNERSHIP_TAG = {
    system: "https://fhir-flow.app/ownership",
    code: "managed-by-fhir-flow",
} as const;

function makeBundle(resources: Array<Record<string, unknown>>) {
    return {
        resourceType: "Bundle",
        entry: resources.map((resource) => ({ resource })),
    };
}

function makeSnapshotResource(resource: SnapshotResource): Record<string, unknown> {
    const base = {
        resourceType: resource.resourceType,
        id: resource.id,
        ...(resource.owned
            ? {
                  meta: {
                      tag: [OWNERSHIP_TAG],
                  },
              }
            : {}),
    };

    if (resource.resourceType !== "Observation") {
        return base;
    }

    return {
        ...base,
        code: {
            coding: [
                {
                    system: "http://loinc.org",
                    code: resource.code,
                },
            ],
        },
    };
}

function makeInput() {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        visitType: "follow-up" as const,
        actualStartAt: "2026-03-20T10:00:00.000Z",
        recordedAt: "2026-03-20T11:00:00.000Z",
        procedures: [
            {
                category: "terapia-manual" as const,
                code: "masoterapia" as const,
                bodySite: "Hombro derecho",
                note: "Sin incidencias",
            },
        ],
        heartRate: 80,
        evaScore: 6,
    };
}

beforeAll(async () => {
    process.env.FHIR_BASE_URL = process.env.FHIR_BASE_URL || "http://example.com";
    process.env.CURRENT_PRACTITIONER_ID = process.env.CURRENT_PRACTITIONER_ID || "pr-123";
    ({ EncounterFhirRepository } = await import("../encounter.fhir-repository"));
});

describe("EncounterFhirRepository.saveProgress", () => {
    it("replaces previously managed snapshot resources on consecutive saves without duplicate delete operations", async () => {
        const mockClient = {
            read: vi.fn().mockResolvedValue({ resourceType: "Encounter", id: "enc-123", status: "in-progress" }),
            search: vi
                .fn()
                .mockResolvedValueOnce(makeBundle([]))
                .mockResolvedValueOnce(makeBundle([]))
                .mockResolvedValueOnce(
                    makeBundle([
                        makeSnapshotResource({ resourceType: "Observation", id: "obs-owned-1", code: "8867-4", owned: true }),
                        makeSnapshotResource({ resourceType: "Observation", id: "obs-external", code: "8867-4", owned: false }),
                    ])
                )
                .mockResolvedValueOnce(
                    makeBundle([
                        makeSnapshotResource({ resourceType: "Procedure", id: "proc-owned-1", owned: true }),
                        makeSnapshotResource({ resourceType: "Procedure", id: "proc-external", owned: false }),
                    ])
                ),
            postBundle: vi.fn().mockResolvedValue(undefined),
        } as unknown as RepoClient;

        const repo = new EncounterFhirRepository(mockClient);

        await repo.saveProgress(makeInput());
        await repo.saveProgress(makeInput());

        const firstBundle = vi.mocked(mockClient.postBundle).mock.calls[0]?.[0] as {
            entry: Array<{ request: { method: string; url: string } }>;
        };
        const secondBundle = vi.mocked(mockClient.postBundle).mock.calls[1]?.[0] as {
            entry: Array<{ request: { method: string; url: string } }>;
        };

        const firstDeletes = firstBundle.entry.filter((entry) => entry.request.method === "DELETE");
        expect(firstDeletes).toHaveLength(0);

        const secondDeletes = secondBundle.entry.filter((entry) => entry.request.method === "DELETE");
        expect(secondDeletes).toEqual([
            { request: { method: "DELETE", url: "Observation/obs-owned-1" } },
            { request: { method: "DELETE", url: "Procedure/proc-owned-1" } },
        ]);

        const secondDeleteUrls = secondDeletes.map((entry) => entry.request.url);
        expect(new Set(secondDeleteUrls).size).toBe(secondDeleteUrls.length);
    });

    it("keeps external resources untouched and only emits deletes for owned resources", async () => {
        const mockClient = {
            read: vi.fn().mockResolvedValue({ resourceType: "Encounter", id: "enc-123", status: "in-progress" }),
            search: vi
                .fn()
                .mockResolvedValueOnce(
                    makeBundle([
                        makeSnapshotResource({ resourceType: "Observation", id: "obs-owned-1", code: "8867-4", owned: true }),
                        makeSnapshotResource({ resourceType: "Observation", id: "obs-external", code: "72514-3", owned: false }),
                        makeSnapshotResource({ resourceType: "Observation", id: "obs-wrong-code-owned", code: "12345-6", owned: true }),
                    ])
                )
                .mockResolvedValueOnce(
                    makeBundle([
                        makeSnapshotResource({ resourceType: "Procedure", id: "proc-owned-1", owned: true }),
                        makeSnapshotResource({ resourceType: "Procedure", id: "proc-external", owned: false }),
                    ])
                ),
            postBundle: vi.fn().mockResolvedValue(undefined),
        } as unknown as RepoClient;

        const repo = new EncounterFhirRepository(mockClient);
        await repo.saveProgress(makeInput());

        const bundle = vi.mocked(mockClient.postBundle).mock.calls[0]?.[0] as {
            entry: Array<{ request: { method: string; url: string } }>;
        };

        const deleteUrls = bundle.entry
            .filter((entry) => entry.request.method === "DELETE")
            .map((entry) => entry.request.url);

        expect(deleteUrls).toEqual(["Observation/obs-owned-1", "Procedure/proc-owned-1"]);
        expect(deleteUrls).not.toContain("Observation/obs-external");
        expect(deleteUrls).not.toContain("Procedure/proc-external");
        expect(deleteUrls).not.toContain("Observation/obs-wrong-code-owned");
    });

    it("uses ownership-aware searches and emits DELETE+POST snapshot entries", async () => {
        const mockClient = {
            read: vi.fn().mockResolvedValue({ resourceType: "Encounter", id: "enc-123", status: "in-progress" }),
            search: vi
                .fn()
                .mockResolvedValueOnce(makeBundle([makeSnapshotResource({ resourceType: "Observation", id: "obs-owned-1", code: "8867-4", owned: true })]))
                .mockResolvedValueOnce(makeBundle([makeSnapshotResource({ resourceType: "Procedure", id: "proc-owned-1", owned: true })])),
            postBundle: vi.fn().mockResolvedValue(undefined),
        } as unknown as RepoClient;

        const repo = new EncounterFhirRepository(mockClient);
        await repo.saveProgress(makeInput());

        expect(vi.mocked(mockClient.search)).toHaveBeenNthCalledWith(
            1,
            "Observation",
            expect.objectContaining({
                encounter: "Encounter/enc-123",
                code: "8867-4,9279-1,59408-5,8310-5,85354-9,72514-3",
                _tag: "https://fhir-flow.app/ownership|managed-by-fhir-flow",
            }),
            { cache: "no-store" }
        );

        expect(vi.mocked(mockClient.search)).toHaveBeenNthCalledWith(
            2,
            "Procedure",
            expect.objectContaining({
                encounter: "Encounter/enc-123",
                _tag: "https://fhir-flow.app/ownership|managed-by-fhir-flow",
            }),
            { cache: "no-store" }
        );

        const bundle = vi.mocked(mockClient.postBundle).mock.calls[0]?.[0] as {
            entry: Array<{ request: { method: string; url: string } }>;
        };

        const deleteEntries = bundle.entry.filter((entry) => entry.request.method === "DELETE");
        expect(deleteEntries).toEqual([
            { request: { method: "DELETE", url: "Observation/obs-owned-1" } },
            { request: { method: "DELETE", url: "Procedure/proc-owned-1" } },
        ]);

        const postEntries = bundle.entry.filter((entry) => entry.request.method === "POST");
        expect(postEntries).toHaveLength(3);
        expect(postEntries.map((entry) => entry.request.url)).toEqual([
            "Observation",
            "Observation",
            "Procedure",
        ]);
    });
});
