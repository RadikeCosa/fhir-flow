import { describe, expect, it } from "vitest";
import { finalizeEncounterFormSchema } from "../finalize-encounter-form.schema";

const baseInput = {
    actualDate: "2026-03-20",
    actualStartTime: "10:00",
    actualEndTime: "11:00",
    clinicalNote: "Paciente estable.",
    reasonDisplay: "Control programado",
    procedures: [],
};

describe("finalizeEncounterFormSchema procedures", () => {
    it("accepts procedures whose code belongs to the selected category", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            procedures: [
                {
                    category: "rehabilitacion-respiratoria",
                    code: "ejercicios-respiratorios",
                    bodySite: "Tórax",
                    note: "Buena tolerancia",
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("rejects procedures whose code does not belong to the selected category", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            procedures: [
                {
                    category: "rehabilitacion-respiratoria",
                    code: "masoterapia",
                    bodySite: "Tórax",
                },
            ],
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors).toMatchObject({
            procedures: [
                "El código del procedimiento no coincide con la categoría seleccionada.",
            ],
        });
    });

    it("rejects when actual end time is not after actual start time", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            actualStartTime: "11:00",
            actualEndTime: "10:59",
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.actualEndTime).toContain(
            "La hora de fin debe ser posterior a la hora de inicio."
        );
    });

    it("rejects empty category or code in procedures", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            procedures: [
                { category: "", code: "", bodySite: "", note: "" },
            ],
        });

        expect(result.success).toBe(false);
        const errors = result.error?.flatten().fieldErrors.procedures;
        expect(errors).toEqual(
            expect.arrayContaining(["Seleccionar categoría", "Seleccionar procedimiento"]),
        );
    });

    it("accepts procedures with explicit category/code labels", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            procedures: [
                {
                    category: "rehabilitacion-respiratoria",
                    code: "ejercicios-respiratorios",
                    bodySite: "Tórax",
                    note: "Buena tolerancia",
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("treats blank reasonDisplay as undefined", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            reasonDisplay: "   ",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.reasonDisplay).toBeUndefined();
        }
    });

    it("requires clinical note", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            clinicalNote: "   ",
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.clinicalNote).toContain(
            "La nota clínica es obligatoria."
        );
    });
});

describe("finalizeEncounterFormSchema vitals + EVA", () => {
    it("accepts empty-string optional vitals and EVA", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            heartRate: "",
            respiratoryRate: "",
            oxygenSaturation: "",
            bodyTemperature: "",
            bloodPressureSystolic: "",
            bloodPressureDiastolic: "",
            evaScore: "",
        });

        expect(result.success).toBe(true);
    });

    it("coerces optional numeric values and comma decimals", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            heartRate: "120",
            respiratoryRate: "20",
            oxygenSaturation: "98",
            bodyTemperature: "37,2",
            bloodPressureSystolic: "120",
            bloodPressureDiastolic: "80",
            evaScore: "4",
        });

        expect(result.success).toBe(true);
    });

    it("rejects heart rate outside allowed range", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            heartRate: 29,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.heartRate).toContain(
            "Too small: expected number to be >=30"
        );
    });

    it("rejects respiratory rate outside allowed range", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            respiratoryRate: 4,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.respiratoryRate).toContain(
            "Too small: expected number to be >=5"
        );
    });

    it("rejects body temperature outside allowed range", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            bodyTemperature: 43.1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.bodyTemperature).toContain(
            "Too big: expected number to be <=43"
        );
    });

    it("rejects explicit NaN payloads for numeric fields", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            heartRate: Number.NaN,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.heartRate).toBeTruthy();
    });

    it("rejects incomplete blood pressure", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            bloodPressureSystolic: 120,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.bloodPressureDiastolic).toContain(
            "Si se indica presión arterial, debe completarse tanto sistólica como diastólica."
        );
    });

    it("rejects diastolic higher than systolic", () => {
        const result = finalizeEncounterFormSchema.safeParse({
            ...baseInput,
            bloodPressureSystolic: 110,
            bloodPressureDiastolic: 120,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.bloodPressureDiastolic).toContain(
            "La presión diastólica no puede exceder la sistólica"
        );
    });
});
