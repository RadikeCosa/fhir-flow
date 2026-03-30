import { describe, expect, it } from "vitest";

import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";
import { mapInProgressEncounterDetailToFormInitialValues } from "../in-progress-encounter-detail.mapper";

function makeSource(
    overrides: Partial<InProgressEncounterDetailInitialValues> = {},
): InProgressEncounterDetailInitialValues {
    return {
        encounterId: "enc-1",
        clinicalNote: "Nota inicial",
        reasonDisplay: "Control",
        vitalSigns: [],
        evaAssessments: [],
        procedures: [],
        ...overrides,
    };
}

describe("mapInProgressEncounterDetailToFormInitialValues", () => {
    it("maps empty optional clinical fields to form-safe defaults", () => {
        const result = mapInProgressEncounterDetailToFormInitialValues(
            makeSource({
                clinicalNote: undefined,
                reasonDisplay: undefined,
            }),
        );

        expect(result.clinicalNote).toBe("");
        expect(result.reasonDisplay).toBe("");
        expect(result.evaScore).toBeUndefined();
        expect(result.heartRate).toBeUndefined();
        expect(result.procedures).toEqual([]);
    });

    it("uses latest vital and latest eva when multiple records exist", () => {
        const result = mapInProgressEncounterDetailToFormInitialValues(
            makeSource({
                vitalSigns: [
                    {
                        id: "v-older",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        date: "2026-03-10T10:00:00.000Z",
                        recordedBy: { id: "pr-1", display: "A" },
                        heartRate: 70,
                        oxygenSaturation: 97,
                    },
                    {
                        id: "v-latest",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        date: "2026-03-10T11:00:00.000Z",
                        recordedBy: { id: "pr-2", display: "B" },
                        heartRate: 82,
                        respiratoryRate: 19,
                        bloodPressure: { systolic: 122, diastolic: 78 },
                        bodyTemperature: 36.7,
                    },
                ],
                evaAssessments: [
                    {
                        id: "eva-older",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        type: "eva",
                        date: "2026-03-10T09:30:00.000Z",
                        score: 3,
                        recordedBy: { id: "pr-1", display: "A" },
                    },
                    {
                        id: "eva-latest",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        type: "eva",
                        date: "2026-03-10T11:30:00.000Z",
                        score: 6,
                        recordedBy: { id: "pr-2", display: "B" },
                    },
                ],
            }),
        );

        expect(result.evaScore).toBe(6);
        expect(result.heartRate).toBe(82);
        expect(result.respiratoryRate).toBe(19);
        expect(result.bloodPressureSystolic).toBe(122);
        expect(result.bloodPressureDiastolic).toBe(78);
        expect(result.bodyTemperature).toBe(36.7);
        expect(result.oxygenSaturation).toBeUndefined();
    });

    it("keeps array order and maps procedures to form procedure shape", () => {
        const result = mapInProgressEncounterDetailToFormInitialValues(
            makeSource({
                procedures: [
                    {
                        id: "proc-1",
                        encounterId: "enc-1",
                        patientId: "pat-1",
                        status: "completed",
                        category: "fisioterapia",
                        code: "laser",
                        display: "Laser",
                        bodySite: "hombro",
                        note: "tolerado",
                    },
                    {
                        id: "proc-2",
                        encounterId: "enc-1",
                        patientId: "pat-1",
                        status: "completed",
                        category: "educacion",
                        code: "educacion-paciente",
                        display: "Educación",
                    },
                ],
            }),
        );

        expect(result.procedures).toEqual([
            {
                category: "fisioterapia",
                code: "laser",
                bodySite: "hombro",
                note: "tolerado",
            },
            {
                category: "educacion",
                code: "educacion-paciente",
                bodySite: undefined,
                note: undefined,
            },
        ]);
    });

    it("uses last record when dates are equal or invalid", () => {
        const result = mapInProgressEncounterDetailToFormInitialValues(
            makeSource({
                vitalSigns: [
                    {
                        id: "v-invalid",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        date: "invalid-date",
                        recordedBy: { id: "pr-1", display: "A" },
                        heartRate: 68,
                    },
                    {
                        id: "v-invalid-last",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        date: "invalid-date",
                        recordedBy: { id: "pr-2", display: "B" },
                        heartRate: 72,
                    },
                ],
                evaAssessments: [
                    {
                        id: "eva-a",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        type: "eva",
                        date: "2026-03-10",
                        score: 2,
                        recordedBy: { id: "pr-1", display: "A" },
                    },
                    {
                        id: "eva-b",
                        patientId: "pat-1",
                        encounterId: "enc-1",
                        type: "eva",
                        date: "2026-03-10",
                        score: 4,
                        recordedBy: { id: "pr-2", display: "B" },
                    },
                ],
            }),
        );

        expect(result.heartRate).toBe(72);
        expect(result.evaScore).toBe(4);
    });
});
