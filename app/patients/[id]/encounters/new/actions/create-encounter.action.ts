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
import { currentPractitionerId } from "@/config/fhir.config";
import { createPractitionerRepository } from "@/infrastructure/fhir/factories";
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

    const practitionerRepo = createPractitionerRepository();
    const practitioner = await practitionerRepo.findById(currentPractitionerId);

    if (!practitioner) {
        return {
            success: false,
            error: {
                layer: "fhir",
                message: `Current practitioner ${currentPractitionerId} could not be resolved from FHIR`,
                code: "CURRENT_PRACTITIONER_NOT_FOUND",
                details: undefined,
            } satisfies ActionError,
        };
    }

    if (!practitioner.displayName || practitioner.displayName.trim() === "") {
        return {
            success: false,
            error: {
                layer: "fhir",
                message: `Current practitioner ${currentPractitionerId} does not have a displayable name in FHIR`,
                code: "CURRENT_PRACTITIONER_NAME_MISSING",
                details: undefined,
            } satisfies ActionError,
        };
    }

    const practitionerName = practitioner.displayName;

    const input: CreateEncounterInput = {
        patientId,
        practitionerName,
        episodeOfCareId,
        plannedAt: parseResult.data.plannedAt.toISOString(),
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

        revalidatePath(`/patients/${patientId}`);
        redirect(`/patients/${patientId}/encounters`);

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
