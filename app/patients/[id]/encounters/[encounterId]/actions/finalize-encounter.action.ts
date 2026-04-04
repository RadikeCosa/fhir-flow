"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
    ActionError,
    ActionResult,
} from "../../../../../../domain/shared/action-result.types";
import {
    buildDomainActionError,
    buildFhirActionError,
    buildValidationActionError,
} from "../../../../../../domain/shared/action-error.helpers";
import type { FinalizeEncounterInput } from "../../../../../../domain/encounters/encounter.write-input";
import {
    validateFinalizeEncounterRules,
    validateFinalizeEncounterStatus,
    DomainRuleError,
} from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { getCurrentPractitioner } from "../../../../../../lib/server/current-practitioner";
import { composeLocalDateTimeToUtcIso } from "../../../../../../lib/date-time/date-time.utils";
import { finalizeEncounterFormSchema } from "../components/FinalizeEncounterForm/finalize-encounter-form.schema";

export async function finalizeEncounterAction(
    patientId: string,
    encounterId: string,
    formData: unknown
): Promise<ActionResult<void>> {
    const parseResult = finalizeEncounterFormSchema.safeParse(formData);
    if (!parseResult.success) {
        console.error("[finalizeEncounterAction] schema parse failed", parseResult.error.flatten());
        return {
            success: false,
            error: buildValidationActionError({
                details: parseResult.error.flatten(),
            }),
        };
    }

    const repo = createEncounterRepository();

    const encounter = await repo.findById(encounterId);
    if (!encounter) {
        console.error("[finalizeEncounterAction] encounter load failed: not found", { encounterId });
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
        console.error("[finalizeEncounterAction] encounter-patient mismatch", {
            encounterPatientId: encounter.patientId,
            routePatientId: patientId,
        });
        return {
            success: false,
            error: buildDomainActionError({
                message: "El encuentro no pertenece al paciente indicado en la ruta",
                code: "ENCOUNTER_PATIENT_MISMATCH",
            }),
        };
    }

    try {
        validateFinalizeEncounterStatus(encounter.status);
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
            console.error("[finalizeEncounterAction] status validation failed", {
                code: error.code,
                message: error.message,
            });
            return {
                success: false,
                error: buildDomainActionError({
                    message: error.message,
                    code: error.code,
                }),
            };
        }

        throw error;
    }

    let practitioner;
    try {
        practitioner = await getCurrentPractitioner();
    } catch (error: unknown) {
        if (error instanceof FhirMapperError) {
            console.error("[finalizeEncounterAction] practitioner resolve failed", {
                code: error.code,
                message: error.message,
            });
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

    const input: FinalizeEncounterInput = {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        episodeOfCareId: encounter.episodeOfCareId,
        performerId: practitioner.id,
        practitionerName: practitioner.displayName,
        visitType: encounter.visitType,
        actualStartAt: composeLocalDateTimeToUtcIso(
            parseResult.data.actualDate,
            parseResult.data.actualStartTime
        ),
        actualEndAt: composeLocalDateTimeToUtcIso(
            parseResult.data.actualDate,
            parseResult.data.actualEndTime
        ),
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
        validateFinalizeEncounterRules(input);
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
            console.error("[finalizeEncounterAction] validateFinalizeEncounterRules failed", {
                code: error.code,
                message: error.message,
            });
            return {
                success: false,
                error: buildDomainActionError({
                    message: error.message,
                    code: error.code,
                }),
            };
        }
        throw error;
    }

    try {
        await repo.finalize(input);

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(`/patients/${patientId}/encounters/${encounterId}`);
        redirect(`/patients/${patientId}/encounters/${encounterId}`);

        return { success: true };
    } catch (error: unknown) {
        if (error instanceof FhirMapperError) {
            console.error("[finalizeEncounterAction] repo.finalize mapper failure", {
                code: error.code,
                message: error.message,
            });
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
            console.error("[finalizeEncounterAction] repo.finalize write failure", {
                code: error.code,
                message: error.message,
                operationOutcome: error.operationOutcome,
            });
            return {
                success: false,
                error: buildFhirActionError({
                    message: error.message,
                    code: error.code,
                    details: error.operationOutcome,
                }),
            };
        }
        throw error;
    }
}
