"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
    ActionError,
    ActionResult,
} from "../../../../../../domain/shared/action-result.types";
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
    console.log("[finalizeEncounterAction] start", { patientId, encounterId });
    const parseResult = finalizeEncounterFormSchema.safeParse(formData);
    if (!parseResult.success) {
        console.error("[finalizeEncounterAction] schema parse failed", parseResult.error.flatten());
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
    console.log("[finalizeEncounterAction] schema parse succeeded");

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
    console.log("[finalizeEncounterAction] encounter loaded", {
        encounterId: encounter.id,
        status: encounter.status,
        patientId: encounter.patientId,
    });

    if (encounter.patientId !== patientId) {
        console.error("[finalizeEncounterAction] encounter-patient mismatch", {
            encounterPatientId: encounter.patientId,
            routePatientId: patientId,
        });
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
        validateFinalizeEncounterStatus(encounter.status);
        console.log("[finalizeEncounterAction] status validation passed", { status: encounter.status });
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
            console.error("[finalizeEncounterAction] status validation failed", {
                code: error.code,
                message: error.message,
            });
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

    let practitioner;
    try {
        practitioner = await getCurrentPractitioner();
        console.log("[finalizeEncounterAction] practitioner resolved", {
            practitionerId: practitioner.id,
        });
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
    console.log("[finalizeEncounterAction] FinalizeEncounterInput built", {
        encounterId: input.encounterId,
        actualStartAt: input.actualStartAt,
        actualEndAt: input.actualEndAt,
    });

    try {
        console.log("[finalizeEncounterAction] before validateFinalizeEncounterRules");
        validateFinalizeEncounterRules(input);
        console.log("[finalizeEncounterAction] validateFinalizeEncounterRules passed");
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
            console.error("[finalizeEncounterAction] validateFinalizeEncounterRules failed", {
                code: error.code,
                message: error.message,
            });
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
        console.log("[finalizeEncounterAction] before repo.finalize");
        await repo.finalize(input);
        console.log("[finalizeEncounterAction] repo.finalize succeeded");

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(`/patients/${patientId}/encounters/${encounterId}`);
        console.log("[finalizeEncounterAction] before redirect", {
            redirectTo: `/patients/${patientId}/encounters/${encounterId}`,
        });
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
