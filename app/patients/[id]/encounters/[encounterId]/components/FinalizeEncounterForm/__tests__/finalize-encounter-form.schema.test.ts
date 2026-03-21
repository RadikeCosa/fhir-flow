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
