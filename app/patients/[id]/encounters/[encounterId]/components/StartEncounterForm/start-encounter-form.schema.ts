import { z } from "zod";
import {
    isDateOnly,
    isValidLocalTimeString,
} from "../../../../../../../lib/date-time/date-time.utils";

export const startEncounterFormSchema = z.object({
    actualStartDate: z
        .string()
        .min(1, "La fecha real de inicio es obligatoria.")
        .refine((value) => isDateOnly(value), {
            message: "La fecha real de inicio debe tener formato YYYY-MM-DD.",
        }),

    actualStartTime: z
        .string()
        .min(1, "La hora real de inicio es obligatoria.")
        .refine((value) => isValidLocalTimeString(value), {
            message: "La hora real de inicio debe tener formato HH:mm.",
        }),
});

export type StartEncounterFormValues = z.infer<typeof startEncounterFormSchema>;
