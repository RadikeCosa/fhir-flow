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
import type { RegisterEncounterInput } from "../../../../../../domain/encounters/encounter.write-input";
import {
    DomainRuleError,
    validateRegisterEncounterRules,
} from "../../../../../../domain/shared/domain-rules.validator";
import { FhirMapperError, FhirWriteError } from "../../../../../../domain/shared/error-types";
import { createEncounterRepository } from "../../../../../../infrastructure/fhir/factories/encounter.factory";
import { createEpisodeOfCareRepository } from "../../../../../../infrastructure/fhir/factories/episode-of-care.factory";
import { getCurrentPractitioner } from "@/lib/server/current-practitioner";
import { composeLocalDateTimeToUtcIso } from "../../../../../../lib/date-time/date-time.utils";
import { registerEncounterSchema } from "./register-encounter.schema";

export async function registerEncounterAction(
    patientId: string,
    formData: unknown
): Promise<ActionResult<{ encounterId: string }>> {
    const parseResult = registerEncounterSchema.safeParse(formData);
    if (!parseResult.success) {
        return {
            success: false,
            error: buildValidationActionError({
                details: parseResult.error.flatten(),
            }),
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

    const episodeRepo = createEpisodeOfCareRepository();
    const episodes = await episodeRepo.findAllByPatientId(patientId);
    const episode = episodes.find((candidate) => candidate.id === parseResult.data.episodeOfCareId);

    if (!episode) {
        return {
            success: false,
            error: buildDomainActionError({
                message: "El episodio indicado no existe para el paciente de la ruta",
                code: "EPISODE_OF_CARE_NOT_FOUND_FOR_PATIENT",
            }),
        };
    }

    if (episode.status !== "active") {
        return {
            success: false,
            error: buildDomainActionError({
                message: "El episodio indicado no está activo",
                code: "EPISODE_OF_CARE_NOT_ACTIVE",
            }),
        };
    }

    const actualStartAt = composeLocalDateTimeToUtcIso(
        parseResult.data.actualDate,
        parseResult.data.actualStartTime
    );

    const actualEndAt = parseResult.data.actualEndTime
        ? composeLocalDateTimeToUtcIso(parseResult.data.actualDate, parseResult.data.actualEndTime)
        : undefined;

    const input: RegisterEncounterInput = {
        patientId,
        episodeOfCareId: parseResult.data.episodeOfCareId,
        performerId: practitioner.id,
        practitionerName: practitioner.displayName,
        completionMode: parseResult.data.completionMode,
        visitType: parseResult.data.visitType,
        actualStartAt,
        actualEndAt,
        clinicalNote: parseResult.data.clinicalNote,
        reasonDisplay: parseResult.data.reasonDisplay,
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
        validateRegisterEncounterRules(input);
    } catch (error: unknown) {
        if (error instanceof DomainRuleError) {
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
        const repo = createEncounterRepository();
        const result = await repo.register(input);
        const encounterDetailPath = `/patients/${patientId}/encounters/${result.id}`;

        revalidatePath(`/patients/${patientId}`);
        revalidatePath(`/patients/${patientId}/encounters`);
        revalidatePath(encounterDetailPath);
        redirect(encounterDetailPath);
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
