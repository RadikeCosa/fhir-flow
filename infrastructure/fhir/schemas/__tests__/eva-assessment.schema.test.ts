import { describe, expect, it } from 'vitest';

import { fhirEvaObservationSchema } from '../assessments/eva-assessment.schema';

describe('fhirEvaObservationSchema', () => {
    it('validates a minimal valid observation with valueInteger', () => {
        const result = fhirEvaObservationSchema.safeParse({
            resourceType: 'Observation',
            id: 'obs-1',
            effectiveDateTime: '2022-01-01',
            valueInteger: 7,
        });

        expect(result.success).toBe(true);
    });

    it('rejects valueInteger outside the 0-10 range (11)', () => {
        const result = fhirEvaObservationSchema.safeParse({
            resourceType: 'Observation',
            id: 'obs-1',
            effectiveDateTime: '2022-01-01',
            valueInteger: 11,
        });

        expect(result.success).toBe(false);
    });

    it('rejects valueInteger outside the 0-10 range (-1)', () => {
        const result = fhirEvaObservationSchema.safeParse({
            resourceType: 'Observation',
            id: 'obs-1',
            effectiveDateTime: '2022-01-01',
            valueInteger: -1,
        });

        expect(result.success).toBe(false);
    });

    it('rejects missing resourceType', () => {
        const result = fhirEvaObservationSchema.safeParse({
            id: 'obs-1',
            effectiveDateTime: '2022-01-01',
            valueInteger: 7,
        });

        expect(result.success).toBe(false);
    });

    it('rejects empty id', () => {
        const result = fhirEvaObservationSchema.safeParse({
            resourceType: 'Observation',
            id: '',
            effectiveDateTime: '2022-01-01',
            valueInteger: 7,
        });

        expect(result.success).toBe(false);
    });

    it('accepts missing effectiveDateTime (optional)', () => {
        const result = fhirEvaObservationSchema.safeParse({
            resourceType: 'Observation',
            id: 'obs-1',
            valueInteger: 7,
        });

        expect(result.success).toBe(true);
    });
});
