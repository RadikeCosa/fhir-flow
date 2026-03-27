"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
    ActionError,
    ActionResult,
} from "../../../../../../domain/shared/action-result.types";
import type { CreateEncounterInput } from "../../../../../../domain/encounters/encounter.write-input";
import { validateEncounterRules, DomainRuleError } from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { getCurrentPractitioner } from "@/lib/server/current-practitioner";
import { createEncounterFormSchema } from "../components/CreateEncounterForm/create-encounter-form.schema";

export async function createEncounterAction(
    patientId: string,
    episodeOfCareId: string,
    formData: unknown
): Promise<ActionResult<{ encounterId: string }>> {
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

    let practitioner;
    try {
        practitioner = await getCurrentPractitioner();
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
        throw error;
    }

    const practitionerName = practitioner.displayName;

    const performerId = practitioner.id;

    const input: CreateEncounterInput = {
        patientId,
        practitionerName,
        performerId,
        episodeOfCareId,
        plannedDate: parseResult.data.plannedDate,
        plannedTime: parseResult.data.plannedTime,
        visitType: parseResult.data.visitType,
        reasonDisplay: parseResult.data.reasonDisplay || null,
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

    try {
        const repo = createEncounterRepository();
        const result = await repo.create(input);
        const encounterDetailPath = `/patients/${patientId}/encounters/${result.id}`;

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(encounterDetailPath);
        redirect(encounterDetailPath);

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
