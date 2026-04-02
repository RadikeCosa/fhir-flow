"use server";

import { revalidatePath } from "next/cache";
import type {
    ActionError,
    ActionResult,
} from "../../../../../../domain/shared/action-result.types";
import type { SaveEncounterProgressInput } from "../../../../../../domain/encounters/encounter.write-input";
import {
    DomainRuleError,
    validateSaveEncounterProgressRules,
    validateSaveEncounterProgressStatus,
} from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { getCurrentPractitioner } from "../../../../../../lib/server/current-practitioner";
import { saveEncounterProgressSchema } from "./save-encounter-progress.schema";

export async function saveEncounterProgressAction(
    patientId: string,
    encounterId: string,
    formData: unknown
): Promise<ActionResult<void>> {
    const parseResult = saveEncounterProgressSchema.safeParse(formData);
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

    const encounter = await repo.findById(encounterId);
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

    try {
        validateSaveEncounterProgressStatus(encounter.status);
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

    if (!encounter.actualStartAt) {
        return {
            success: false,
            error: {
                layer: "domain",
                message: "El encuentro no tiene registrada la hora real de inicio",
                code: "ENCOUNTER_MISSING_ACTUAL_START",
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
                } satisfies ActionError,
            };
        }
        throw error;
    }

    const input: SaveEncounterProgressInput = {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        episodeOfCareId: encounter.episodeOfCareId,
        performerId: practitioner.id,
        practitionerName: practitioner.displayName,
        visitType: encounter.visitType,
        actualStartAt: encounter.actualStartAt,
        recordedAt: new Date().toISOString(),
        clinicalNote: parseResult.data.clinicalNote,
        reasonDisplay: parseResult.data.reasonDisplay ?? encounter.reasonDisplay ?? null,
        heartRate: parseResult.data.heartRate,
        respiratoryRate: parseResult.data.respiratoryRate,
        oxygenSaturation: parseResult.data.oxygenSaturation,
        bodyTemperature: parseResult.data.bodyTemperature,
        bloodPressureSystolic: parseResult.data.bloodPressureSystolic,
        bloodPressureDiastolic: parseResult.data.bloodPressureDiastolic,
        evaScore: parseResult.data.evaScore,
        procedures: parseResult.data.procedures,
    };

    try {
        validateSaveEncounterProgressRules(input);
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
        await repo.saveProgress(input);

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(`/patients/${patientId}/encounters/${encounterId}`);

        return { success: true };
    } catch (error: unknown) {
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

        throw error;
    }
}
