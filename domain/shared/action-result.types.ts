/**
 * Defines the layer where an error originated in the write pipeline.
 *
 * - `validation`: Errors produced by the Zod schema that validates user-provided form data.
 * - `domain`: Business or clinical rules violations detected in the domain rules validator.
 * - `fhir`: Errors returned by the FHIR server (e.g., OperationOutcome / HTTP errors).
 */
export type ErrorLayer = "validation" | "domain" | "fhir";

/**
 * Standardized error payload returned from Server Actions.
 *
 * Server Actions should never throw to the client. Instead they return an
 * `ActionResult` with `success: false` and an `ActionError` describing the issue.
 */
export type ActionError = {
  /**
   * The validation layer where the error occurred.
   */
  layer: ErrorLayer;
  /**
   * Human-readable message describing the error.
   */
  message: string;
  /**
   * Optional machine-friendly error code.
   * Example: `"PRESSURE_INCOMPLETE"`, `"MISSING_REFERENCE"`.
   */
  code?: string;
  /**
   * Optional payload with raw error details (e.g., FHIR OperationOutcome).
   */
  details?: unknown;
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
