import { z } from "zod";

/**
 * Zod schema for validating a raw FHIR R4 Patient resource at the
 * infrastructure boundary. This schema is intentionally permissive and
 * validates only the fields the domain mapper will consume. It is an
 * infrastructure concern and must not leak into the domain layer.
 */

export const humanNameSchema = z
    .object({
        use: z.string().optional(),
        given: z.array(z.string()).optional(),
        family: z.string().optional(),
    })
    .passthrough();

export const identifierSchema = z
    .object({
        system: z.string().optional(),
        value: z.string().optional(),
    })
    .passthrough();

export const telecomSchema = z
    .object({
        system: z.string().optional(),
        value: z.string().optional(),
        use: z.string().optional(),
    })
    .passthrough();

export const addressSchema = z
    .object({
        line: z.array(z.string()).optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
    })
    .passthrough();

// supporting simple coding structure used in several places
export const codingSchema = z
    .object({
        code: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

// maritalStatus field on Patient resource
export const maritalStatusSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

// relationship element inside contact
export const relationshipSchema = z
    .object({
        coding: z.array(codingSchema).optional(),
        text: z.string().optional(),
    })
    .passthrough();

// contact entry for emergency/caregiver info
export const contactSchema = z
    .object({
        relationship: z.array(relationshipSchema).optional(),
        name: humanNameSchema.optional(),
        telecom: z.array(telecomSchema).optional(),
    })
    .passthrough();

// general practitioner reference
export const generalPractitionerSchema = z
    .object({
        reference: z.string().optional(),
        display: z.string().optional(),
    })
    .passthrough();

export const fhirPatientSchema = z
    .object({
        resourceType: z.literal("Patient"),
        // require a non-empty id
        id: z.string().min(1),
        active: z.boolean().optional(),
        name: z.array(humanNameSchema).optional(),
        identifier: z.array(identifierSchema).optional(),
        // accept YYYY, YYYY-MM, or YYYY-MM-DD per FHIR date formats
        birthDate: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/).optional(),
        // strict FHIR gender literals while remaining optional.
        // Use `.catch(undefined)` to tolerate unexpected server values
        // without rejecting the whole resource.
        gender: z.enum(["male", "female", "other", "unknown"]).optional().catch(undefined),
        telecom: z.array(telecomSchema).optional(),
        address: z.array(addressSchema).optional(),
        maritalStatus: maritalStatusSchema.optional(),
        deceasedBoolean: z.boolean().optional(),
        deceasedDateTime: z.string().optional(),
        contact: z.array(contactSchema).optional(),
        generalPractitioner: z.array(generalPractitionerSchema).optional(),
    })
    .passthrough();

export type FhirPatientResource = z.infer<typeof fhirPatientSchema>;
