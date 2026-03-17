import { z } from "zod";

/**
 * Zod schema for the "Create Encounter" form.
 *
 * This schema validates the **shape and format** of user-provided form data:
 * - Is the datetime a valid Date object?
 * - Is the note (if provided) a non-empty string?
 *
 * This schema does **NOT** validate domain/clinical rules. Those are checked
 * separately in the Server Action via `validateEncounterRules()` from
 * `domain/shared/domain-rules.validator.ts`.
 *
 * For example, this schema won't validate that:
 * - The patient ID is non-empty (domain rule)
 * - The planned date is in the future (domain rule)
 * - A note has sufficient clinical detail (domain rule)
 *
 * Those are handled in Layer 2 of the write pipeline. This schema is Layer 1.
 *
 * Separation of concerns:
 * - **Zod (Layer 1)**: Form syntax, type coercion, required fields
 * - **Domain Rules (Layer 2)**: Clinical constraints, reference validity
 * - **FHIR Mapper (Layer 3)**: Attach FHIR references, set defaults
 */
export const createEncounterFormSchema = z.object({
    /**
     * Planned date/time for the encounter.
     *
     * Input type: The Client Component receives this from `<input type="datetime-local">`,
     * which provides a Date object (after form library coercion).
     *
     * Output type: Date (ISO 8601 format in Server Action).
     *
     * Validation via .superRefine():
     * - If value is not a Date instance: "Debe ser una fecha válida"
     * - If value is missing/invalid: "Fecha y hora planificada es requerida"
     */
    plannedAt: z
        .date()
        .superRefine((value, ctx) => {
            if (!(value instanceof Date) || isNaN(value.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.invalid_type,
                    expected: "date",
                    received: typeof value,
                    message: "Debe ser una fecha válida",
                });
            }
        }),

    visitType: z
        .enum(["initial", "follow-up", "re-assessment", "discharge"])
        .default("follow-up"),

    /**
     * Optional clinical note describing the reason for the visit.
     *
     * Input type: string or undefined (form library).
     *
     * Validation:
     * - If provided, must be a string.
     * - If provided and not empty, must not consist of only whitespace.
     * - If undefined or empty string → accepted (optional).
     *
     * Clinical constraints (e.g., minimum length, required keywords) are checked
     * in Layer 2 via `validateEncounterRules()`.
     */
    note: z
        .string()
        .optional()
        .refine(
            (value) => !value || value.trim() !== "",
            { message: "La nota no puede ser solo espacios en blanco" }
        ),

    reasonDisplay: z
        .string()
        .optional()
        .refine(
            (value) => !value || value.trim() !== "",
            { message: "El motivo no puede ser solo espacios en blanco" }
        ),
});

/**
 * Inferred TypeScript type from the schema.
 *
 * Used to type the form values in the Client Component:
 *
 * ```ts
 * const form = useForm<CreateEncounterFormValues>({
 *   resolver: zodResolver(createEncounterFormSchema),
 *   // ...
 * });
 * ```
 *
 * Structure:
 * ```
 * {
 *   plannedAt: Date;
 *   note?: string;
 * }
 * ```
 */
export type CreateEncounterFormValues = z.infer<
    typeof createEncounterFormSchema
>;

export type CreateEncounterFormInput = z.input<
    typeof createEncounterFormSchema
>;
