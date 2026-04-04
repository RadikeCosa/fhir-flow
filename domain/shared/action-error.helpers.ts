import type {
    ActionError,
    FhirActionErrorDetails,
    ValidationErrorDetails,
} from "./action-result.types";

type BuildValidationErrorInput = {
    details: ValidationErrorDetails;
    message?: string;
    code?: string;
};

type BuildDomainErrorInput = {
    message: string;
    code?: string;
};

type BuildFhirErrorInput = {
    message: string;
    code?: string;
    details?: FhirActionErrorDetails | unknown;
};

function isFhirActionErrorDetails(value: unknown): value is FhirActionErrorDetails {
    return typeof value === "object" && value !== null;
}

/**
 * Builds a normalized validation-layer ActionError for phase 1.
 */
export function buildValidationActionError({
    details,
    message = "Invalid form data",
    code = "FORM_VALIDATION_FAILED",
}: BuildValidationErrorInput): ActionError {
    return {
        layer: "validation",
        message,
        code,
        details,
    };
}

/**
 * Builds a normalized domain-layer ActionError for phase 1.
 */
export function buildDomainActionError({
    message,
    code,
}: BuildDomainErrorInput): ActionError {
    return {
        layer: "domain",
        message,
        code,
    };
}

/**
 * Builds a transitional fhir-layer ActionError for phase 1.
 */
export function buildFhirActionError({
    message,
    code,
    details,
}: BuildFhirErrorInput): ActionError {
    const normalizedDetails = details === undefined
        ? undefined
        : isFhirActionErrorDetails(details)
            ? details
            : { raw: details };

    return {
        layer: "fhir",
        message,
        code,
        details: normalizedDetails,
    };
}
