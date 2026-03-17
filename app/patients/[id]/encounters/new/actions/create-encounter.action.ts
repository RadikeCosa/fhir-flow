"use server";

import type { ActionResult, ActionError } from "../../../../../../domain/shared/action-result.types";
import type { CreateEncounterInput } from "../../../../../../domain/encounters/encounter.write-input";
import { validateEncounterRules, DomainRuleError } from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEncounterFormSchema } from "../components/CreateEncounterForm/create-encounter-form.schema";

/**
 * Server Action: creates a new planned Encounter on the FHIR server.
 *
 * Called from a Client Component form via `.bind()`. Performs three-layer
 * validation before writing to FHIR:
 *   1. Zod schema   — form shape and format
 *   2. Domain rules — clinical and business constraints
 *   3. Repository   — FHIR mapper + HTTP write
 *
 * Each layer returns an `ActionResult` with the appropriate `layer` tag so
 * the form can render targeted error messages without exceptions leaking to
 * the client.
 *
 * @param patientId       - from URL params /patients/[id]
 * @param episodeOfCareId - from form hidden field
 * @param formData        - raw form data from Client Component
 * @returns ActionResult<{ encounterId: string }>. On success, redirect() is
 *          called before this return — redirect() throws internally (NEXT_REDIRECT)
 *          and never returns, so the success branch is unreachable at runtime
 *          but required for TypeScript to type-check the return type.
 */
export async function createEncounterAction(
    patientId: string,
    episodeOfCareId: string,
    formData: unknown
): Promise<ActionResult<{ encounterId: string }>> {
    // Layer 1: Zod form validation
    const parseResult = createEncounterFormSchema.safeParse(formData);
    if (!parseResult.success) {
        return {
            success: false,
            error: {
                layer: "validation",
                message: "Invalid form data",
                code: "FORM_VALIDATION_FAILED",
                details: parseResult.error.flatten(),
            } satisfies ActionError,
        };
    }

    // Layer 2: Domain rules validation
    const input: CreateEncounterInput = {
        patientId,
        episodeOfCareId,
        plannedAt: parseResult.data.plannedAt.toISOString(),
        note: parseResult.data.note || null,
    };

    try {
        validateEncounterRules(input);
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
            return {
                success: false,
                error: {
                    layer: "domain",
                    message: error.message,
                    code: error.code,
                } satisfies ActionError,
            };
        }
        throw error;
    }

    // Layer 3: Repository (mapper + FHIR client)
    try {
        const repo = createEncounterRepository();
        const result = await repo.create(input);

        revalidatePath(`/patients/${patientId}`);
        // redirect() throws internally (Next.js NEXT_REDIRECT) and never returns.
        redirect(`/patients/${patientId}/encounters`);

        // Unreachable — redirect() always throws. Required for TypeScript return type.
        return { success: true, data: { encounterId: result.id } };
    } catch (error: unknown) {
        if (error instanceof FhirMapperError) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: error.code,
                    details: undefined,
                } satisfies ActionError,
            };
        }
        if (error instanceof FhirWriteError) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: error.code,
                    details: error.operationOutcome,
                } satisfies ActionError,
            };
        }
        throw error;
    }
}
