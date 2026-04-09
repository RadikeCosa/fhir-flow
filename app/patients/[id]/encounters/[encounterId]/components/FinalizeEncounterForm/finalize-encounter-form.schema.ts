import { z } from "zod";
import {
  applyClinicalEncounterIntentRefinement,
  clinicalEncounterBaseSchema,
} from "../../../components/ClinicalEncounterForm/schema";

/**
 * Schema for the finalize encounter form.
 */
export const finalizeEncounterFormSchema = clinicalEncounterBaseSchema
  .extend({
    actualDate: z.string().min(1, "La fecha real es obligatoria."),
    actualStartTime: z.string().min(1, "La hora real de inicio es obligatoria."),
    actualEndTime: z.string().min(1, "La hora real de fin es obligatoria."),
    clinicalNote: z.string(),
  })
  .superRefine((data, ctx) => {
    applyClinicalEncounterIntentRefinement(
      {
        ...data,
        clinicalNote: data.clinicalNote?.trim(),
      },
      ctx,
      {
        requireActualDate: true,
        requireActualStartTime: true,
        requireActualEndTime: true,
        requireClinicalNote: true,
      },
    );
  });

export type FinalizeEncounterFormInput = z.input<typeof finalizeEncounterFormSchema>;
export type FinalizeEncounterFormValues = z.infer<typeof finalizeEncounterFormSchema>;
