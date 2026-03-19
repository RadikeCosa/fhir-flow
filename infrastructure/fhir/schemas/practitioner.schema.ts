import { z } from "zod";

export const fhirPractitionerSchema = z
    .object({
        resourceType: z.literal("Practitioner"),
        id: z.string().min(1),
        name: z
            .array(
                z
                    .object({
                        use: z.string().optional(),
                        text: z.string().optional(),
                        family: z.string().optional(),
                        given: z.array(z.string()).optional(),
                    })
                    .passthrough()
            )
            .optional(),
    })
    .passthrough();

export type FhirPractitionerResource = z.infer<typeof fhirPractitionerSchema>;
