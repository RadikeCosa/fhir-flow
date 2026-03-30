import { describe, expect, it } from "vitest";
import { fhirVitalSignObservationSchema } from "../vital-sign.schema";

describe("fhirVitalSignObservationSchema", () => {
    it("accepts encounter.reference when present in single-value observations", () => {
        const result = fhirVitalSignObservationSchema.safeParse({
            resourceType: "Observation",
            id: "obs-1",
            status: "final",
            effectiveDateTime: "2026-03-15T08:00:00.000Z",
            performer: [{ reference: "Practitioner/pr-1", display: "Nurse 1" }],
            encounter: { reference: "Encounter/enc-1" },
            code: {
                coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
            },
            valueQuantity: { value: 80 },
        });

        expect(result.success).toBe(true);
    });

    it("accepts missing encounter for backward compatibility", () => {
        const result = fhirVitalSignObservationSchema.safeParse({
            resourceType: "Observation",
            id: "obs-1",
            status: "final",
            effectiveDateTime: "2026-03-15T08:00:00.000Z",
            performer: [{ reference: "Practitioner/pr-1", display: "Nurse 1" }],
            code: {
                coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
            },
            valueQuantity: { value: 80 },
        });

        expect(result.success).toBe(true);
    });
});
