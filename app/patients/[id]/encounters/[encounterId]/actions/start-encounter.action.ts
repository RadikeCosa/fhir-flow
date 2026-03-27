"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
    ActionError,
    ActionResult,
} from "../../../../../../domain/shared/action-result.types";
import type { StartEncounterInput } from "../../../../../../domain/encounters/encounter.write-input";
import {
    DomainRuleError,
    validateStartEncounterRules,
    validateStartEncounterStatus,
} from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { composeLocalDateTimeToUtcIso } from "../../../../../../lib/date-time/date-time.utils";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { startEncounterFormSchema } from "../components/StartEncounterForm/start-encounter-form.schema";

function isOperationOutcomeError(
    error: unknown
): error is { message: string; outcome?: unknown } {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "OperationOutcomeError"
    );
}

function isHttpError(error: unknown): error is { message: string; data?: unknown } {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "HttpError"
    );
}

export async function startEncounterAction(
    patientId: string,
    encounterId: string,
    actualStartDate: string,
    actualStartTime: string
): Promise<ActionResult<void>> {
    const parseResult = startEncounterFormSchema.safeParse({
        actualStartDate,
        actualStartTime,
    });
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

    const repo = createEncounterRepository();

    let encounter: Awaited<ReturnType<typeof repo.findById>>;
    try {
        encounter = await repo.findById(encounterId);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }

        if (error instanceof FhirMapperError) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: error.code ?? "FHIR_MAPPER_ERROR",
                } satisfies ActionError,
            };
        }

        if (error instanceof FhirWriteError) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: error.code ?? "FHIR_WRITE_ERROR",
                    details: error.operationOutcome,
                } satisfies ActionError,
            };
        }

        if (isOperationOutcomeError(error)) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: "FHIR_OPERATION_OUTCOME",
                    details: error.outcome,
                } satisfies ActionError,
            };
        }

        if (isHttpError(error)) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: "FHIR_HTTP_ERROR",
                    details: error.data,
                } satisfies ActionError,
            };
        }

        return {
            success: false,
            error: {
                layer: "fhir",
                message: "Unexpected error while loading encounter",
                code: "ENCOUNTER_LOAD_FAILED",
            } satisfies ActionError,
        };
    }

    if (!encounter) {
        return {
            success: false,
            error: {
                layer: "fhir",
                message: "Encounter not found",
                code: "ENCOUNTER_NOT_FOUND",
            } satisfies ActionError,
        };
    }

    if (encounter.patientId !== patientId) {
        return {
            success: false,
            error: {
                layer: "domain",
                message: "El encuentro no pertenece al paciente indicado en la ruta",
                code: "ENCOUNTER_PATIENT_MISMATCH",
            } satisfies ActionError,
        };
    }

    const input: StartEncounterInput = {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        actualStartAt: composeLocalDateTimeToUtcIso(
            parseResult.data.actualStartDate,
            parseResult.data.actualStartTime
        ),
    };

    try {
        validateStartEncounterStatus(encounter.status);
        validateStartEncounterRules(input);
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

        return {
            success: false,
            error: {
                layer: "domain",
                message: "No se pudo validar el inicio del encuentro",
                code: "ENCOUNTER_START_VALIDATION_FAILED",
            } satisfies ActionError,
        };
    }

    try {
        await repo.startEncounter(input);

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(`/patients/${patientId}/encounters/${encounterId}`);
        redirect(`/patients/${patientId}/encounters/${encounterId}`);

        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }

        if (error instanceof FhirMapperError) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: error.code,
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

        if (isOperationOutcomeError(error)) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: "FHIR_OPERATION_OUTCOME",
                    details: error.outcome,
                } satisfies ActionError,
            };
        }

        if (isHttpError(error)) {
            return {
                success: false,
                error: {
                    layer: "fhir",
                    message: error.message,
                    code: "FHIR_HTTP_ERROR",
                    details: error.data,
                } satisfies ActionError,
            };
        }

        return {
            success: false,
            error: {
                layer: "fhir",
                message: "Unexpected error while starting encounter",
                code: "ENCOUNTER_START_FAILED",
            } satisfies ActionError,
        };
    }
}
