import { z } from "zod";

export const createEncounterFormSchema = z.object({
    plannedAt: z.date(),
    note: z.string().optional(),
});
