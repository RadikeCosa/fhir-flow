import { z } from "zod";
import {
  applyClinicalEncounterIntentRefinement,
  clinicalEncounterBaseSchema,
  visitTypeSchema,
} from "../../components/ClinicalEncounterForm/schema";

export const registerEncounterSchema = clinicalEncounterBaseSchema
  .extend({
    completionMode: z.enum(["start", "complete"]),
    redirectToDetail: z.boolean().optional().default(true),
    episodeOfCareId: z.string().min(1, "El episodio de cuidado es requerido"),
    visitType: visitTypeSchema,
    actualDate: z.string().min(1, "La fecha es obligatoria."),
    actualStartTime: z.string().min(1, "La hora de inicio es obligatoria."),
  })
  .superRefine((data, ctx) => {
    applyClinicalEncounterIntentRefinement(data, ctx, {
      requireActualDate: true,
      requireActualStartTime: true,
      requireActualEndTime: data.completionMode === "complete",
      requireClinicalNote: data.completionMode === "complete",
    });
  });

export type RegisterEncounterSchemaInput = z.input<typeof registerEncounterSchema>;
