import { describe, expect, it } from "vitest";

import {
    buildDomainActionError,
    buildFhirActionError,
    buildValidationActionError,
} from "../action-error.helpers";

describe("action-error.helpers", () => {
    it("buildValidationActionError returns validation layer with stable default message/code and flatten-like details", () => {
        const details = {
            formErrors: ["Invalid payload"],
            fieldErrors: {
                actualDate: ["Required"],
            },
        };

        const result = buildValidationActionError({ details });

        expect(result).toEqual({
            layer: "validation",
            message: "Invalid form data",
            code: "FORM_VALIDATION_FAILED",
            details,
        });
    });

    it("buildDomainActionError returns domain layer with message, preserves code when present, and has no details", () => {
        const withCode = buildDomainActionError({
            message: "Domain rule failed",
            code: "RULE_FAILED",
        });

        expect(withCode).toEqual({
            layer: "domain",
            message: "Domain rule failed",
            code: "RULE_FAILED",
        });
        expect("details" in withCode).toBe(false);

        const withoutCode = buildDomainActionError({
            message: "Only message",
        });

        expect(withoutCode).toEqual({
            layer: "domain",
            message: "Only message",
            code: undefined,
        });
        expect("details" in withoutCode).toBe(false);
    });

    it("buildFhirActionError returns fhir layer with normalized typed details", () => {
        const withDetails = buildFhirActionError({
            message: "FHIR failed",
            code: "FHIR_WRITE_FAILED",
            details: {
                cause: "operation_outcome",
                operationOutcome: { resourceType: "OperationOutcome" },
            },
        });

        expect(withDetails).toEqual({
            layer: "fhir",
            message: "FHIR failed",
            code: "FHIR_WRITE_FAILED",
            details: {
                cause: "operation_outcome",
                operationOutcome: { resourceType: "OperationOutcome" },
            },
        });

        const withoutDetails = buildFhirActionError({
            message: "FHIR failed without details",
        });

        expect(withoutDetails).toEqual({
            layer: "fhir",
            message: "FHIR failed without details",
            code: undefined,
            details: undefined,
        });

        const normalizedRaw = buildFhirActionError({
            message: "FHIR failed with raw details",
            details: "backend timeout",
        });

        expect(normalizedRaw).toEqual({
            layer: "fhir",
            message: "FHIR failed with raw details",
            code: undefined,
            details: {
                raw: "backend timeout",
            },
        });
    });
});
