export { DomainRuleError } from "./error-types";
import { DomainRuleError } from "./error-types";
import type { CreateEncounterInput } from "../encounters/encounter.write-input";
import type { EncounterVisitType } from "../encounters/encounter";

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

    // Ensure plannedAt is a valid ISO 8601 datetime.
    try {
        const date = new Date(input.plannedAt);
        if (isNaN(date.getTime())) {
            throw new DomainRuleError(
                "Planned date must be a valid ISO 8601 datetime",
                "INVALID_DATE"
            );
        }
    } catch (err) {
        if (err instanceof DomainRuleError) throw err;
        throw new DomainRuleError(
            "Planned date must be a valid ISO 8601 datetime",
            "INVALID_DATE"
        );
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
