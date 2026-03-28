import { describe, expect, it } from "vitest";

import type { FinalizeEncounterInput } from "../../../../domain/encounters/encounter.write-input";
import { buildClinicalResourcesBundleEntries } from "../clinical-resources-bundle.mapper";

function makeInput(
    overrides: Partial<FinalizeEncounterInput> = {}
): FinalizeEncounterInput {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        episodeOfCareId: "episode-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        visitType: "follow-up",
        actualStartAt: "2026-03-20T10:00:00.000Z",
        actualEndAt: "2026-03-20T11:00:00.000Z",
        clinicalNote: "Paciente estable. Se finaliza visita.",
        reasonDisplay: "Control programado",
import type { PersistableClinicalPayload } from "../shared/persistable-clinical-payload";
import { buildClinicalResourcesBundleEntries } from "../clinical-resources-bundle.mapper";

function makePayload(
    overrides: Partial<PersistableClinicalPayload> = {}
): PersistableClinicalPayload {
    return {
        encounterId: "enc-123",
        patientId: "patient-1",
        performerId: "prac-1",
        practitionerName: "Lic. Ramiro Perez",
        actualEndAt: "2026-03-20T11:00:00.000Z",
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
    it("returns vital signs + eva + procedures preserving finalize ordering", () => {
        const entries = buildClinicalResourcesBundleEntries(makeInput()) as Array<{
        const entries = buildClinicalResourcesBundleEntries(makePayload()) as Array<{
            request: { url: string };
            resource: { code?: { coding?: Array<{ code?: string }> } };
        }>;

        expect(entries).toHaveLength(7);
        expect(entries[0]?.request.url).toBe("Observation");
        expect(entries[4]?.resource.code?.coding?.[0]?.code).toBe("85354-9");
        expect(entries[5]?.resource.code?.coding?.[0]?.code).toBe("72514-3");
        expect(entries[6]?.request.url).toBe("Procedure");
    });

    it("omits EVA entry when score is not present", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makeInput({ evaScore: undefined })
            makePayload({ evaScore: undefined })
        ) as Array<{ resource: { code?: { coding?: Array<{ code?: string }> } } }>;

        const loincCodes = entries
            .map((entry) => entry.resource.code?.coding?.[0]?.code)
            .filter((code): code is string => typeof code === "string");

        expect(loincCodes).not.toContain("72514-3");
    });

    it("omits procedure entries when no procedures are provided", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makeInput({ procedures: [] })
        ) as Array<{ request: { url: string } }>;

        expect(entries.some((entry) => entry.request.url === "Procedure")).toBe(false);
    });

    it("builds only valid partial vital signs entries and no empty entries", () => {
        const entries = buildClinicalResourcesBundleEntries(
            makeInput({
                heartRate: 80,
                respiratoryRate: undefined,
                oxygenSaturation: undefined,
                bodyTemperature: undefined,
                bloodPressureSystolic: undefined,
                bloodPressureDiastolic: undefined,
                evaScore: undefined,
                procedures: [],
            })
        ) as Array<{ request: { url: string }; resource: { code?: { coding?: Array<{ code?: string }> } } }>;

        expect(entries).toHaveLength(1);
        expect(entries[0]?.request.url).toBe("Observation");
        expect(entries[0]?.resource.code?.coding?.[0]?.code).toBe("8867-4");
        expect(entries.every((entry) => typeof entry === "object" && entry !== null)).toBe(true);
    });
});
