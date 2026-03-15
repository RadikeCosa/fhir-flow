import { describe, expect, it } from 'vitest';

import type { FhirPatientResource } from '../../schemas/patient.schema';
import { mapFhirPatientToPatient } from '../patient.mapper';

const makePatient = (
    overrides: Partial<FhirPatientResource> = {}
): FhirPatientResource => ({
    resourceType: 'Patient',
    id: 'p-001',
    ...overrides,
});

describe('mapFhirPatientToPatient', () => {
    it('maps name array to domain name values', () => {
        const patient = makePatient({
            name: [{ given: ['Juan'], family: 'García' }],
        });

        const result = mapFhirPatientToPatient(patient);

        expect(result.name.given).toBe('Juan');
        expect(result.name.family).toBe('García');
    });

    it('returns safe defaults when name is missing', () => {
        const patient = makePatient({ name: undefined });
        const result = mapFhirPatientToPatient(patient);

        expect(result.name.given).toBe('');
        expect(result.name.family).toBe('');
    });

    it('maps active false correctly', () => {
        const patient = makePatient({ active: false });
        const result = mapFhirPatientToPatient(patient);

        expect(result.active).toBe(false);
    });

    it('defaults active to true when missing', () => {
        const patient = makePatient({ active: undefined });
        const result = mapFhirPatientToPatient(patient);

        expect(result.active).toBe(true);
    });

    it('maps gender to male when provided', () => {
        const patient = makePatient({ gender: 'male' });
        const result = mapFhirPatientToPatient(patient);

        expect(result.gender).toBe('male');
    });

    it('uses identifier value when provided', () => {
        const patient = makePatient({
            identifier: [
                { system: 'urn:oid:1.2.3', value: 'XYZ-123' },
            ],
        });

        const result = mapFhirPatientToPatient(patient);

        expect(result.identifier).toBe('XYZ-123');
    });

    it('falls back to resource id when identifier is missing', () => {
        const patient = makePatient({ identifier: undefined });
        const result = mapFhirPatientToPatient(patient);

        expect(result.identifier).toBe('p-001');
    });
});
