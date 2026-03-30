import { describe, expect, it } from "vitest";
import { mapFhirObservationsToVitalSignRecords } from "../vital-sign.mapper";
import type { FhirVitalSignObservation } from "../../schemas/vital-sign.schema";

function makeObservation(overrides: Partial<FhirVitalSignObservation> = {}): FhirVitalSignObservation {
    return {
        resourceType: "Observation",
        id: "obs-1",
        status: "final",
        effectiveDateTime: "2026-03-15T08:00:00.000Z",
        performer: [{ reference: "Practitioner/pr-1", display: "Nurse 1" }],
        code: {
            coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
        },
        valueQuantity: {
            value: 80,
            unit: "beats/minute",
        },
        encounter: { reference: "Encounter/enc-1" },
        ...overrides,
    };
}

describe("mapFhirObservationsToVitalSignRecords", () => {
    it("keeps same-day captures as separate records when timestamps differ", () => {
        const first = makeObservation({
            id: "obs-1",
            effectiveDateTime: "2026-03-15T08:00:00.000Z",
            valueQuantity: { value: 80 },
        });
        const second = makeObservation({
            id: "obs-2",
            effectiveDateTime: "2026-03-15T12:00:00.000Z",
            valueQuantity: { value: 95 },
        });

        const result = mapFhirObservationsToVitalSignRecords([first, second], "patient-1");

        expect(result).toHaveLength(2);
        expect(result.map((record) => record.date)).toEqual([
            "2026-03-15T12:00:00.000Z",
            "2026-03-15T08:00:00.000Z",
        ]);
    });

    it("still groups observations captured at the same timestamp and performer", () => {
        const hr = makeObservation({
            id: "obs-hr",
            code: {
                coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
            },
            valueQuantity: { value: 78 },
        });

        const rr = makeObservation({
            id: "obs-rr",
            code: {
                coding: [{ system: "http://loinc.org", code: "9279-1", display: "Respiratory rate" }],
            },
            valueQuantity: { value: 18 },
        });

        const result = mapFhirObservationsToVitalSignRecords([hr, rr], "patient-1");

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            date: "2026-03-15T08:00:00.000Z",
            encounterId: "enc-1",
            heartRate: 78,
            respiratoryRate: 18,
        });
    });

    it("hydrates encounterId from encounter.reference when present", () => {
        const obs = makeObservation({
            encounter: { reference: "Encounter/enc-123" },
        });

        const result = mapFhirObservationsToVitalSignRecords([obs], "patient-1");

        expect(result).toHaveLength(1);
        expect(result[0].encounterId).toBe("enc-123");
    });

    it("keeps encounterId optional when encounter.reference is missing", () => {
        const obs = makeObservation({
            encounter: { reference: undefined },
        });

        const result = mapFhirObservationsToVitalSignRecords([obs], "patient-1");

        expect(result).toHaveLength(1);
        expect(result[0].encounterId).toBeUndefined();
    });
});
