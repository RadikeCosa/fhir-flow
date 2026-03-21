export { DomainRuleError } from "./error-types";
import { DomainRuleError } from "./error-types";
import type { CreateEncounterInput, FinalizeEncounterInput } from "../encounters/encounter.write-input";
import type { EncounterVisitType } from "../encounters/encounter";
import { PROCEDURE_CODES_BY_CATEGORY } from "../procedures/procedure-code-category.map";
import {
    APP_TIME_ZONE,
    composeLocalDateTimeToUtcIso,
    formatCalendarDateInTimeZone,
    isDateOnly,
    isValidLocalTimeString,
} from "../../lib/date-time/date-time.utils";

/**
 * Validates domain-level rules for creating an Encounter.
 *
 * This runs after Zod schema validation and before the write repository is invoked.
 * It ensures that the input is clinically coherent and contains required references.
 *
 * If a rule is violated, a `DomainRuleError` is thrown, which should be caught
 * by the Server Action and translated into an `ActionResult` with `layer: "domain"`.
 *
 * Example:
 * ```ts
 * validateEncounterRules(input);
 * // throws DomainRuleError if something is invalid
 * ```
 */
export function validateEncounterRules(input: CreateEncounterInput): void {
    // Require a non-empty patient ID.
    if (!input.patientId || input.patientId.trim() === "") {
        throw new DomainRuleError("Patient ID is required", "MISSING_PATIENT_ID");
    }

    // Require a non-empty practitioner name.
    if (!input.practitionerName || input.practitionerName.trim() === "") {
        throw new DomainRuleError(
            "Practitioner name is required",
            "MISSING_PRACTITIONER_NAME"
        );
    }

    // Require a non-empty episode of care ID.
    if (!input.episodeOfCareId || input.episodeOfCareId.trim() === "") {
        throw new DomainRuleError("Episode of care ID is required", "MISSING_EPISODE_ID");
    }

    if (!isDateOnly(input.plannedDate)) {
        throw new DomainRuleError(
            "Planned date must be a valid YYYY-MM-DD date",
            "INVALID_PLANNED_DATE"
        );
    }

    if (input.plannedTime != null && input.plannedTime !== "" && !isValidLocalTimeString(input.plannedTime)) {
        throw new DomainRuleError(
            "Planned time must be a valid HH:mm value",
            "INVALID_PLANNED_TIME"
        );
    }

    const now = new Date();
    const maxMoment = new Date(now.getTime());
    maxMoment.setDate(maxMoment.getDate() + 10);

    if (input.plannedTime) {
        try {
            const plannedAtIso = composeLocalDateTimeToUtcIso(
                input.plannedDate,
                input.plannedTime,
                APP_TIME_ZONE
            );
            const plannedAt = new Date(plannedAtIso);
            if (plannedAt.getTime() < now.getTime()) {
                throw new DomainRuleError(
                    "Planned datetime cannot be in the past",
                    "PAST_PLANNED_DATETIME"
                );
            }
            if (plannedAt.getTime() > maxMoment.getTime()) {
                throw new DomainRuleError(
                    "Visit cannot be scheduled more than 10 days ahead",
                    "PLANNING_WINDOW_EXCEEDED"
                );
            }
        } catch (err) {
            if (err instanceof DomainRuleError) throw err;
            throw new DomainRuleError(
                "Planned datetime is invalid",
                "INVALID_PLANNED_DATETIME"
            );
        }
    } else {
        const today = formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
        const maxDate = formatCalendarDateInTimeZone(maxMoment, APP_TIME_ZONE);

        if (input.plannedDate < today) {
            throw new DomainRuleError(
                "Planned date cannot be before today",
                "PAST_PLANNED_DATE"
            );
        }

        if (input.plannedDate > maxDate) {
            throw new DomainRuleError(
                "Visit cannot be scheduled more than 10 days ahead",
                "PLANNING_WINDOW_EXCEEDED"
            );
        }
    }

    // Optional note must not be only whitespace.
    if (input.note != null && input.note.trim() === "") {
        throw new DomainRuleError("Clinical note cannot be empty if provided", "EMPTY_NOTE");
    }

    // Visit type must be one of the allowed values.
    const validVisitTypes: EncounterVisitType[] = [
        "initial",
        "follow-up",
        "re-assessment",
        "discharge",
    ];
    if (!validVisitTypes.includes(input.visitType)) {
        throw new DomainRuleError("Visit type is invalid", "INVALID_VISIT_TYPE");
    }
}

export function validateFinalizeEncounterRules(input: FinalizeEncounterInput): void {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new DomainRuleError("El ID de encuentro es requerido", "MISSING_ENCOUNTER_ID");
    }

    if (!input.patientId || input.patientId.trim() === "") {
        throw new DomainRuleError("El ID de paciente es requerido", "MISSING_PATIENT_ID");
    }

    if (!input.actualEndAt || typeof input.actualEndAt !== "string" || !input.actualEndAt.includes("T")) {
        throw new DomainRuleError("actualEndAt debe ser un datetime ISO con componente de tiempo", "INVALID_ACTUAL_END");
    }
    const actualEndDate = new Date(input.actualEndAt);
    if (isNaN(actualEndDate.getTime())) {
        throw new DomainRuleError("actualEndAt debe ser un datetime ISO válido", "INVALID_ACTUAL_END");
    }

    if (!input.actualStartAt || typeof input.actualStartAt !== "string" || !input.actualStartAt.includes("T")) {
        throw new DomainRuleError("actualStartAt debe ser un datetime ISO con componente de tiempo", "INVALID_ACTUAL_START");
    }
    const actualStartDate = new Date(input.actualStartAt);
    if (isNaN(actualStartDate.getTime())) {
        throw new DomainRuleError("actualStartAt debe ser un datetime ISO válido", "INVALID_ACTUAL_START");
    }

    if (actualEndDate.getTime() <= actualStartDate.getTime()) {
        throw new DomainRuleError("actualEndAt debe ser posterior a actualStartAt", "ACTUAL_END_BEFORE_START");
    }

    if (input.clinicalNote == null || input.clinicalNote.trim() === "") {
        throw new DomainRuleError("La nota clínica es obligatoria", "CLINICAL_NOTE_REQUIRED");
    }

    const hasSystolic = input.bloodPressureSystolic !== undefined;
    const hasDiastolic = input.bloodPressureDiastolic !== undefined;

    if ((hasSystolic && !hasDiastolic) || (!hasSystolic && hasDiastolic)) {
        throw new DomainRuleError("Si se registra presión arterial, debe incluir sistólica y diastólica", "PRESSURE_INCOMPLETE");
    }

    if (hasSystolic && hasDiastolic && input.bloodPressureDiastolic! > input.bloodPressureSystolic!) {
        throw new DomainRuleError("La presión diastólica no puede exceder la sistólica", "PRESSURE_INVALID");
    }

    if (input.evaScore !== undefined) {
        if (!Number.isInteger(input.evaScore) || input.evaScore < 0 || input.evaScore > 10) {
            throw new DomainRuleError("El EVA debe ser un entero entre 0 y 10", "EVA_OUT_OF_RANGE");
        }
    }

    for (const procedure of input.procedures) {
        const allowed = PROCEDURE_CODES_BY_CATEGORY[procedure.category];
        if (!allowed || !allowed.includes(procedure.code)) {
            throw new DomainRuleError("El código del procedimiento no coincide con la categoría", "PROCEDURE_CODE_CATEGORY_MISMATCH");
        }
    }
}

