export { DomainRuleError } from "./error-types";
import { DomainRuleError } from "./error-types";
import type {
    CreateEncounterInput,
    FinalizeEncounterInput,
    RegisterEncounterInput,
    FinishedEncounterClinicalPayload,
    SaveEncounterProgressInput,
    StartEncounterInput,
} from "../encounters/encounter.write-input";
import type { EncounterStatus, EncounterVisitType } from "../encounters/encounter";
import { PROCEDURE_CODES_BY_CATEGORY } from "../procedures/procedure-code-category.map";
import {
    APP_TIME_ZONE,
    formatCalendarDateInTimeZone,
} from "../../lib/date-time/date-time.utils";
import { VITAL_SIGN_CAPTURE_RANGES } from "../../lib/clinical/vital-sign-capture-ranges";

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

    const now = new Date();
    const maxMoment = new Date(now.getTime());
    maxMoment.setDate(maxMoment.getDate() + 10);

    if (input.plannedSchedule.kind === "datetime") {
        const plannedAt = new Date(input.plannedSchedule.plannedAtUtc);
        if (isNaN(plannedAt.getTime())) {
            throw new DomainRuleError(
                "Planned datetime is invalid",
                "INVALID_PLANNED_DATETIME"
            );
        }
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
    } else {
        const today = formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
        const maxDate = formatCalendarDateInTimeZone(maxMoment, APP_TIME_ZONE);

        if (input.plannedSchedule.plannedDate < today) {
            throw new DomainRuleError(
                "Planned date cannot be before today",
                "PAST_PLANNED_DATE"
            );
        }

        if (input.plannedSchedule.plannedDate > maxDate) {
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

export function validateFinishedEncounterClinicalRules(
    input: FinishedEncounterClinicalPayload
): void {
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

    if (hasSystolic) {
        if (
            !Number.isInteger(input.bloodPressureSystolic!) ||
            input.bloodPressureSystolic! < VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min ||
            input.bloodPressureSystolic! > VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max
        ) {
            throw new DomainRuleError("La presión sistólica está fuera del rango válido", "PRESSURE_SYSTOLIC_OUT_OF_RANGE");
        }
    }

    if (hasDiastolic) {
        if (
            !Number.isInteger(input.bloodPressureDiastolic!) ||
            input.bloodPressureDiastolic! < VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min ||
            input.bloodPressureDiastolic! > VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max
        ) {
            throw new DomainRuleError("La presión diastólica está fuera del rango válido", "PRESSURE_DIASTOLIC_OUT_OF_RANGE");
        }
    }

    if (input.evaScore !== undefined) {
        if (
            !Number.isInteger(input.evaScore) ||
            input.evaScore < VITAL_SIGN_CAPTURE_RANGES.evaScore.min ||
            input.evaScore > VITAL_SIGN_CAPTURE_RANGES.evaScore.max
        ) {
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

export function validateFinalizeEncounterRules(input: FinalizeEncounterInput): void {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new DomainRuleError("El ID de encuentro es requerido", "MISSING_ENCOUNTER_ID");
    }

    if (!input.patientId || input.patientId.trim() === "") {
        throw new DomainRuleError("El ID de paciente es requerido", "MISSING_PATIENT_ID");
    }

    validateFinishedEncounterClinicalRules(input);
}

export function validateFinalizeEncounterStatus(status: EncounterStatus): void {
    if (status === "in-progress") {
        return;
    }

    throw new DomainRuleError(
        "Solo se puede finalizar un encuentro en curso",
        "ENCOUNTER_NOT_FINALIZABLE"
    );
}

export function validateStartEncounterStatus(status: string): void {
    if (status === "planned") return;

    if (status === "in-progress") {
        throw new DomainRuleError(
            "Encounter is already in progress",
            "ENCOUNTER_ALREADY_IN_PROGRESS"
        );
    }

    throw new DomainRuleError(
        "Only planned encounters can be started",
        "ENCOUNTER_NOT_STARTABLE"
    );
}

export function validateStartEncounterRules(input: StartEncounterInput): void {
    if (!input.actualStartAt || typeof input.actualStartAt !== "string" || !input.actualStartAt.includes("T")) {
        throw new DomainRuleError(
            "actualStartAt debe ser un datetime ISO con componente de tiempo",
            "INVALID_ACTUAL_START"
        );
    }

    const actualStartDate = new Date(input.actualStartAt);
    if (isNaN(actualStartDate.getTime())) {
        throw new DomainRuleError(
            "actualStartAt debe ser un datetime ISO válido",
            "INVALID_ACTUAL_START"
        );
    }
}

export function validateSaveEncounterProgressStatus(status: EncounterStatus): void {
    if (status === "in-progress") {
        return;
    }

    throw new DomainRuleError(
        "Solo se puede guardar progreso en un encuentro en curso",
        "ENCOUNTER_NOT_IN_PROGRESS"
    );
}

export function validateSaveEncounterProgressRules(input: SaveEncounterProgressInput): void {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new DomainRuleError("El ID de encuentro es requerido", "MISSING_ENCOUNTER_ID");
    }

    if (!input.patientId || input.patientId.trim() === "") {
        throw new DomainRuleError("El ID de paciente es requerido", "MISSING_PATIENT_ID");
    }

    if (!input.recordedAt || typeof input.recordedAt !== "string" || !input.recordedAt.includes("T")) {
        throw new DomainRuleError(
            "recordedAt debe ser un datetime ISO con componente de tiempo",
            "INVALID_RECORDED_AT"
        );
    }

    const recordedAtDate = new Date(input.recordedAt);
    if (isNaN(recordedAtDate.getTime())) {
        throw new DomainRuleError("recordedAt debe ser un datetime ISO válido", "INVALID_RECORDED_AT");
    }

    validateEncounterClinicalSnapshotRules(input);
}

export function validateRegisterEncounterRules(input: RegisterEncounterInput): void {
    if (!input.patientId || input.patientId.trim() === "") {
        throw new DomainRuleError("El ID de paciente es requerido", "MISSING_PATIENT_ID");
    }

    if (!input.episodeOfCareId || input.episodeOfCareId.trim() === "") {
        throw new DomainRuleError("El ID de episodio es requerido", "MISSING_EPISODE_ID");
    }

    if (!input.performerId || input.performerId.trim() === "") {
        throw new DomainRuleError("El ID del profesional es requerido", "MISSING_PERFORMER_ID");
    }

    if (!input.practitionerName || input.practitionerName.trim() === "") {
        throw new DomainRuleError("El nombre del profesional es requerido", "MISSING_PRACTITIONER_NAME");
    }

    if (!input.actualStartAt || typeof input.actualStartAt !== "string" || !input.actualStartAt.includes("T")) {
        throw new DomainRuleError(
            "actualStartAt debe ser un datetime ISO con componente de tiempo",
            "INVALID_ACTUAL_START"
        );
    }

    const actualStartDate = new Date(input.actualStartAt);
    if (isNaN(actualStartDate.getTime())) {
        throw new DomainRuleError(
            "actualStartAt debe ser un datetime ISO válido",
            "INVALID_ACTUAL_START"
        );
    }

    if (input.completionMode === "complete") {
        if (!input.actualEndAt) {
            throw new DomainRuleError("actualEndAt es requerido para completar el encuentro", "INVALID_ACTUAL_END");
        }

        validateFinishedEncounterClinicalRules({
            actualStartAt: input.actualStartAt,
            actualEndAt: input.actualEndAt,
            clinicalNote: input.clinicalNote ?? "",
            reasonDisplay: input.reasonDisplay,
            heartRate: input.heartRate,
            respiratoryRate: input.respiratoryRate,
            oxygenSaturation: input.oxygenSaturation,
            bodyTemperature: input.bodyTemperature,
            bloodPressureSystolic: input.bloodPressureSystolic,
            bloodPressureDiastolic: input.bloodPressureDiastolic,
            evaScore: input.evaScore,
            procedures: input.procedures,
        });
        return;
    }

    validateEncounterClinicalSnapshotRules(input);
}

type ClinicalSnapshotRulesInput = Pick<
    SaveEncounterProgressInput,
    | "heartRate"
    | "respiratoryRate"
    | "oxygenSaturation"
    | "bodyTemperature"
    | "bloodPressureSystolic"
    | "bloodPressureDiastolic"
    | "evaScore"
    | "procedures"
>;

function validateEncounterClinicalSnapshotRules(input: ClinicalSnapshotRulesInput): void {
    const hasSystolic = input.bloodPressureSystolic !== undefined;
    const hasDiastolic = input.bloodPressureDiastolic !== undefined;

    if ((hasSystolic && !hasDiastolic) || (!hasSystolic && hasDiastolic)) {
        throw new DomainRuleError("Si se registra presión arterial, debe incluir sistólica y diastólica", "PRESSURE_INCOMPLETE");
    }

    if (hasSystolic && hasDiastolic && input.bloodPressureDiastolic! > input.bloodPressureSystolic!) {
        throw new DomainRuleError("La presión diastólica no puede exceder la sistólica", "PRESSURE_INVALID");
    }

    if (hasSystolic) {
        if (
            !Number.isInteger(input.bloodPressureSystolic!) ||
            input.bloodPressureSystolic! < VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.min ||
            input.bloodPressureSystolic! > VITAL_SIGN_CAPTURE_RANGES.bloodPressureSystolic.max
        ) {
            throw new DomainRuleError("La presión sistólica está fuera del rango válido", "PRESSURE_SYSTOLIC_OUT_OF_RANGE");
        }
    }

    if (hasDiastolic) {
        if (
            !Number.isInteger(input.bloodPressureDiastolic!) ||
            input.bloodPressureDiastolic! < VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.min ||
            input.bloodPressureDiastolic! > VITAL_SIGN_CAPTURE_RANGES.bloodPressureDiastolic.max
        ) {
            throw new DomainRuleError("La presión diastólica está fuera del rango válido", "PRESSURE_DIASTOLIC_OUT_OF_RANGE");
        }
    }

    if (input.heartRate !== undefined) {
        if (
            !Number.isInteger(input.heartRate) ||
            input.heartRate < VITAL_SIGN_CAPTURE_RANGES.heartRate.min ||
            input.heartRate > VITAL_SIGN_CAPTURE_RANGES.heartRate.max
        ) {
            throw new DomainRuleError("La frecuencia cardíaca está fuera del rango válido", "HEART_RATE_OUT_OF_RANGE");
        }
    }

    if (input.respiratoryRate !== undefined) {
        if (
            !Number.isInteger(input.respiratoryRate) ||
            input.respiratoryRate < VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.min ||
            input.respiratoryRate > VITAL_SIGN_CAPTURE_RANGES.respiratoryRate.max
        ) {
            throw new DomainRuleError("La frecuencia respiratoria está fuera del rango válido", "RESPIRATORY_RATE_OUT_OF_RANGE");
        }
    }

    if (input.oxygenSaturation !== undefined) {
        if (
            !Number.isInteger(input.oxygenSaturation) ||
            input.oxygenSaturation < VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.min ||
            input.oxygenSaturation > VITAL_SIGN_CAPTURE_RANGES.oxygenSaturation.max
        ) {
            throw new DomainRuleError("La saturación de oxígeno está fuera del rango válido", "OXYGEN_SATURATION_OUT_OF_RANGE");
        }
    }

    if (input.bodyTemperature !== undefined) {
        if (
            typeof input.bodyTemperature !== "number" ||
            input.bodyTemperature < VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.min ||
            input.bodyTemperature > VITAL_SIGN_CAPTURE_RANGES.bodyTemperature.max
        ) {
            throw new DomainRuleError("La temperatura corporal está fuera del rango válido", "BODY_TEMPERATURE_OUT_OF_RANGE");
        }
    }

    if (input.evaScore !== undefined) {
        if (
            !Number.isInteger(input.evaScore) ||
            input.evaScore < VITAL_SIGN_CAPTURE_RANGES.evaScore.min ||
            input.evaScore > VITAL_SIGN_CAPTURE_RANGES.evaScore.max
        ) {
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
