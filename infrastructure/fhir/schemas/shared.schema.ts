import { z } from "zod";

/**
 * Canonical shared Zod schema fragments for FHIR resources.
 *
 * These are the building blocks used across all FHIR schema files in the
 * project. Each schema is intentionally permissive and uses `.passthrough()`
 * so that extra fields coming from the FHIR server do not cause validation
 * failures.
 *
 * **IMPORTANT:** Do not redefine these fragments in other schema files.
 * Always import and reuse the exports from this module to keep the project
 * consistent and avoid drift in how common FHIR shapes are validated.
 */

export const codingSchema = z
    .object({
        system: z.string().optional(),
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

export const codeableConceptSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

export const referenceSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

export const periodSchema = z
    .object({
        start: z.string().optional(),
        end: z.string().optional(),
    })
    .passthrough();

export const identifierSchema = z
    .object({
        system: z.string().optional(),
        value: z.string().optional(),
    })
    .passthrough();
