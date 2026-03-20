import { describe, expect, it } from "vitest";
import { finalizeEncounterFormSchema } from "../finalize-encounter-form.schema";

const baseInput = {
    periodEnd: new Date("2026-03-20T11:00:00.000Z"),
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
});
