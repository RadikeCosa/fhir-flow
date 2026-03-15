import { describe, expect, it } from 'vitest';

import { fhirPatientSchema } from '../patient.schema';

describe('fhirPatientSchema', () => {
    it('accepts minimal valid patient input', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
            id: 'p-001',
        });

        expect(result.success).toBe(true);
    });

    it('rejects missing id', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
        });

        expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
            id: '',
        });

        expect(result.success).toBe(false);
    });

    it('rejects incorrect resourceType', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Observation',
            id: 'p-001',
        });

        expect(result.success).toBe(false);
    });

    it('tolerates unexpected gender values and drops them', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
            id: 'p-001',
            gender: 'robot',
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.gender).toBeUndefined();
    });

    it('rejects birthDate values that do not match the YYYY[-MM[-DD]] pattern', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
            id: 'p-001',
            birthDate: '2024/01/01',
        });

        expect(result.success).toBe(false);
    });

    it('allows passthrough of unknown fields', () => {
        const result = fhirPatientSchema.safeParse({
            resourceType: 'Patient',
            id: 'p-001',
            unknownField: 'hello',
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const data = result.data as Record<string, unknown>;
        expect(data['unknownField']).toBe('hello');
    });
});
