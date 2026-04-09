import { z } from "zod";
import {
  applyClinicalEncounterIntentRefinement,
  clinicalEncounterBaseSchema,
} from "../../components/ClinicalEncounterForm/schema";

export const saveEncounterProgressSchema = clinicalEncounterBaseSchema
  .extend({
    actualDate: z.string().min(1, "La fecha es obligatoria."),
    actualStartTime: z.string().min(1, "La hora de inicio es obligatoria."),
  })
  .superRefine((data, ctx) => {
    applyClinicalEncounterIntentRefinement(data, ctx, {
      requireActualDate: true,
      requireActualStartTime: true,
      requireActualEndTime: false,
      requireClinicalNote: false,
    });
  });

export type SaveEncounterProgressInputValues = z.infer<typeof saveEncounterProgressSchema>;
