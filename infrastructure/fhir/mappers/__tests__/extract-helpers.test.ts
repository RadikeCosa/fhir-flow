import { describe, expect, it } from 'vitest';

import { extractDate, extractId, extractPerformer } from '../shared/extract-helpers';

describe('extractId', () => {
    it('returns the last segment of a valid reference', () => {
        expect(extractId('Patient/p-001')).toBe('p-001');
    });

    it('returns an empty string when reference is undefined', () => {
        expect(extractId(undefined)).toBe('');
    });

    it('returns an empty string when reference does not contain a slash', () => {
        expect(extractId('no-slash')).toBe('');
    });
});

describe('extractDate', () => {
    it('prefers effectiveDateTime when both fields are present', () => {
        expect(extractDate('2020-01-01', '2019-01-01')).toBe('2020-01-01');
    });

    it('uses issued when effectiveDateTime is missing', () => {
        expect(extractDate(undefined, '2019-01-01')).toBe('2019-01-01');
    });

    it('returns an empty string when both values are absent', () => {
        expect(extractDate(undefined, undefined)).toBe('');
    });
});

describe('extractPerformer', () => {
    it('returns id and display when a valid performer array is provided', () => {
        const performer = [{ reference: 'Practitioner/pr-123', display: 'Dr. Test' }];

        expect(extractPerformer(performer)).toEqual({
            id: 'pr-123',
            display: 'Dr. Test',
        });
    });

    it('returns undefined for an empty performer array', () => {
        expect(extractPerformer([])).toBeUndefined();
    });
});
