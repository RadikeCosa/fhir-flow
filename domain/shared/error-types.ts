import type { OperationOutcome } from "../../lib/fhir/fhir-client";

/**
 * Error thrown when a domain rule validator detects a business/clinical violation.
 *
 * Thrown from `domain/shared/domain-rules.validator.ts` when any rule is violated.
 * This is expected to be caught by the Server Action layer and translated into an
 * `ActionError` with `layer: "domain"`.
 */
export class DomainRuleError extends Error {
    public code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.name = "DomainRuleError";
        this.code = code;
    }
}

/**
 * Error thrown by mappers when a required reference is missing/invalid.
 *
 * Thrown from `infrastructure/fhir/mappers/*` when constructing FHIR resources
 * and a mandatory reference (e.g., Encounter, Patient) is absent or invalid.
 */
export class FhirMapperError extends Error {
    public code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.name = "FhirMapperError";
        this.code = code;
    }
}

/**
 * Error thrown by the FHIR client when an API request fails.
 *
 * This is typically thrown from `lib/fhir/fhir-client.ts` when a non-2xx HTTP
 * response is received or when the server returns an OperationOutcome.
 *
 * Server Actions can catch this and map it to an `ActionError` with
 * `layer: "fhir"`.
 */
export class FhirWriteError extends Error {
    public status: number;
    public operationOutcome?: OperationOutcome;
    public code?: string;

    constructor(
        message: string,
        status: number,
        operationOutcome?: OperationOutcome,
        code?: string
    ) {
        super(message);
        this.name = "FhirWriteError";
        this.status = status;
        this.operationOutcome = operationOutcome;
        this.code = code;
    }
}
