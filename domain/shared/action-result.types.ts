import type { OperationOutcome } from "../../lib/fhir/fhir-client";

/**
 * Defines the layer where an error originated in the write pipeline.
 *
 * - `validation`: Errors produced by the Zod schema that validates user-provided form data.
 * - `domain`: Business or clinical rules violations detected in the domain rules validator.
 * - `fhir`: Errors returned by the FHIR server (e.g., OperationOutcome / HTTP errors).
 */
export type ErrorLayer = "validation" | "domain" | "fhir";

/**
 * Verified shape produced by `ZodError.flatten()` in validation branches.
 *
 * This is intentionally structural and minimal for phase 1 hardening.
 */
export type ValidationErrorDetails = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

/**
 * Shared normalized details for fhir-layer ActionError in encounter write flows.
 */
export type FhirActionErrorDetails = {
  cause?:
    | "operation_outcome"
    | "http_error"
    | "mapper_error"
    | "not_found"
    | "unexpected_fhir_error";

  operationOutcome?: OperationOutcome;
  statusCode?: number;
  resourceType?: string;
  raw?: unknown;
};

/**
 * Phase 1 normalized ActionError by layer.
 *
 * - `validation` requires flatten-like details.
 * - `domain` carries no details in phase 1.
 * - `fhir` uses a shared normalized details shape.
 */
export type ActionError =
  | {
      layer: "validation";
      message: string;
      code: string;
      details: ValidationErrorDetails;
    }
  | {
      layer: "domain";
      message: string;
      code?: string;
    }
  | {
      layer: "fhir";
      message: string;
      code?: string;
      details?: FhirActionErrorDetails;
    };

/**
 * Result returned by all Server Actions.
 *
 * - `success: true` indicates the operation completed successfully.
 * - `success: false` indicates an error occurred and `error` is populated.
 *
 * Example:
 * ```ts
 * function createVisit(): ActionResult<{ id: string }> {
 *   // ...validation + domain rules + repository
 *   return { success: true, data: { id: "123" } };
 * }
 *
 * function createVisitFailure(): ActionResult {
 *   return {
 *     success: false,
 *     error: {
 *       layer: "domain",
 *       message: "Discharge note is required",
 *       code: "MISSING_DISCHARGE_NOTE",
 *     },
 *   };
 * }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: ActionError };
