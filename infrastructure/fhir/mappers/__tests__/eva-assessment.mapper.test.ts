import { describe, expect, it } from 'vitest';

import type { FhirEvaObservation } from '../../schemas/assessments/eva-assessment.schema';
import { mapFhirObservationsToEvaAssessments } from '../assessments/eva-assessment.mapper';

const makeObservation = (overrides: Partial<FhirEvaObservation> = {}): FhirEvaObservation => ({
    resourceType: 'Observation',
    id: 'obs-1',
    effectiveDateTime: '2022-01-01',
    valueInteger: 5,
    performer: [{ reference: 'Practitioner/pr-123', display: 'Dr. Test' }],
    subject: { reference: 'Patient/p-001' },
    ...overrides,
});

describe('mapFhirObservationsToEvaAssessments', () => {
    it('maps a valid observation to an EvaAssessment with expected fields', () => {
        const obs = makeObservation();
        const result = mapFhirObservationsToEvaAssessments([obs]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: 'obs-1',
            patientId: 'p-001',
            type: 'eva',
            date: '2022-01-01',
            score: 5,
            recordedBy: {
                id: 'pr-123',
                display: 'Dr. Test',
            },
        });
    });

    it('skips an observation when effectiveDateTime is shorter than 10 characters', () => {
        const obs = makeObservation({ effectiveDateTime: '2022-01' });
        const result = mapFhirObservationsToEvaAssessments([obs]);

        expect(result).toEqual([]);
    });

    it('skips an observation when valueInteger is missing', () => {
        const obs = makeObservation({ valueInteger: undefined });
        const result = mapFhirObservationsToEvaAssessments([obs]);

        expect(result).toEqual([]);
    });

    it('returns an empty array when given no observations', () => {
        const result = mapFhirObservationsToEvaAssessments([]);

        expect(result).toEqual([]);
    });

    it('sorts results descending by date when multiple observations are provided', () => {
        const older = makeObservation({ id: 'obs-old', effectiveDateTime: '2021-01-01' });
        const newer = makeObservation({ id: 'obs-new', effectiveDateTime: '2022-01-02' });

        const result = mapFhirObservationsToEvaAssessments([older, newer]);

        expect(result).toHaveLength(2);
        expect(result[0].date > result[1].date).toBe(true);
        expect(result[0].id).toBe('obs-new');
        expect(result[1].id).toBe('obs-old');
    });

    it('includes observations even when subject.reference is absent and sets patientId to empty string', () => {
        const obs = makeObservation({ subject: { reference: undefined } });
        const result = mapFhirObservationsToEvaAssessments([obs]);

        expect(result).toHaveLength(1);
        expect(result[0].patientId).toBe('');
    });
});
