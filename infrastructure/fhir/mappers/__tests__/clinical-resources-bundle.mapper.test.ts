import { describe, expect, it } from "vitest";

import type {
    PersistableClinicalPayload,
    PersistableClinicalResourceInput,
} from "../shared/persistable-clinical-payload";
import { buildClinicalResourcesBundleEntries } from "../clinical-resources-bundle.mapper";

function makePayload(
    overrides: Partial<PersistableClinicalResourceInput> = {}
): PersistableClinicalResourceInput {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        effectiveDateTime: "2026-03-20T11:00:00.000Z",
        heartRate: 78,
        respiratoryRate: 18,
        oxygenSaturation: 97,
        bodyTemperature: 36.8,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        evaScore: 4,
        procedures: [
            {
                category: "terapia-manual",
                code: "masoterapia",
                bodySite: "Hombro derecho",
                note: "Sin incidencias",
            },
        ],
        ...overrides,
    };
}

describe("buildClinicalResourcesBundleEntries", () => {
    it("keeps PersistableClinicalPayload limited to clinical content fields", () => {
        const payload: PersistableClinicalPayload = {
            heartRate: 78,
            respiratoryRate: 18,
            oxygenSaturation: 97,
            bodyTemperature: 36.8,
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 80,
            evaScore: 4,
            procedures: [],
        };

        expect(Object.keys(payload).sort()).toEqual([
            "bloodPressureDiastolic",
            "bloodPressureSystolic",
            "bodyTemperature",
            "evaScore",
            "heartRate",
            "oxygenSaturation",
            "procedures",
            "respiratoryRate",
        ]);
    });

    it("returns vital signs + eva + procedures preserving finalize ordering", () => {
        const entries = buildClinicalResourcesBundleEntries(makePayload()) as Array<{
            request: { method: string; url: string };
            resource: { code?: { coding?: Array<{ code?: string }> } };
            fullUrl?: string;
        }>;

        expect(entries).toHaveLength(7);
        expect(entries[0]?.request.url).toBe("Observation");
        expect(entries[4]?.resource.code?.coding?.[0]?.code).toBe("85354-9");
        expect(entries[5]?.resource.code?.coding?.[0]?.code).toBe("72514-3");
        expect(entries[6]?.request.url).toBe("Procedure");
        expect(entries.every((entry) => entry.request.method === "POST")).toBe(true);
        expect(entries.every((entry) => entry.fullUrl === undefined)).toBe(true);
    });

    it("omits EVA entry when score is not present", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makePayload({ evaScore: undefined })
        ) as Array<{ resource: { code?: { coding?: Array<{ code?: string }> } } }>;

        const loincCodes = entries
            .map((entry) => entry.resource.code?.coding?.[0]?.code)
            .filter((code): code is string => typeof code === "string");

        expect(loincCodes).not.toContain("72514-3");
    });

    it("omits procedures when list is empty", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makePayload({
                procedures: [],
            })
        ) as Array<{ request: { url: string } }>;

        expect(entries.some((entry) => entry.request.url === "Procedure")).toBe(false);
    });

    it("builds expected entries with partial valid vital signs", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makePayload({
                respiratoryRate: undefined,
                oxygenSaturation: undefined,
                bodyTemperature: undefined,
                bloodPressureSystolic: undefined,
                bloodPressureDiastolic: undefined,
                evaScore: undefined,
                procedures: [],
            })
        ) as Array<{
            request: { url: string };
            resource?: { code?: { coding?: Array<{ code?: string }> } };
        }>;

        expect(entries).toHaveLength(1);
        expect(entries[0]?.request.url).toBe("Observation");
        expect(entries[0]?.resource?.code?.coding?.[0]?.code).toBe("8867-4");
        expect(entries.every((entry) => entry !== undefined && entry !== null)).toBe(true);
    });
});
