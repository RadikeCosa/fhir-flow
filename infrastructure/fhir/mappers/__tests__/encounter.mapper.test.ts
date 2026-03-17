import { describe, expect, it } from 'vitest';

import type { FhirEncounter } from '../../schemas/encounter.schema';
import { mapFhirEncounterToEncounter } from '../encounter.mapper';

const makeEncounter = (overrides: Partial<FhirEncounter> = {}): FhirEncounter => ({
    resourceType: 'Encounter',
    id: 'enc-001',
    status: 'planned',
    ...overrides,
});

describe('mapFhirEncounterToEncounter – mapStatus normalization', () => {
    it('maps lowercase "planned" correctly', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'planned' }));
        expect(result.status).toBe('planned');
    });

    it('maps "Planned" (capitalised) to "planned"', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'Planned' }));
        expect(result.status).toBe('planned');
    });

    it('maps " planned " (with surrounding spaces) to "planned"', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: ' planned ' }));
        expect(result.status).toBe('planned');
    });

    it('maps "In-Progress" to "in-progress"', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'In-Progress' }));
        expect(result.status).toBe('in-progress');
    });

    it('maps "FINISHED" to "finished"', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'FINISHED' }));
        expect(result.status).toBe('finished');
    });

    it('maps "Cancelled" to "cancelled"', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'Cancelled' }));
        expect(result.status).toBe('cancelled');
    });

    it('falls back to "planned" for an unrecognised status', () => {
        const result = mapFhirEncounterToEncounter(makeEncounter({ status: 'unknown-status' }));
        expect(result.status).toBe('planned');
    });
});

describe('mapFhirEncounterToEncounter – note[] fallback for clinicalNote', () => {
    it('extracts clinicalNote from note[] when no extension is present', () => {
        const enc = makeEncounter({ note: [{ text: 'Patient improving' }] });
        const result = mapFhirEncounterToEncounter(enc);
        expect(result.clinicalNote).toBe('Patient improving');
    });

    it('prefers extension over note[] when both are present', () => {
        const enc = makeEncounter({
            extension: [
                {
                    url: 'https://example.com/clinical-note',
                    valueString: 'Note from extension',
                },
            ],
            note: [{ text: 'Note from note array' }],
        });
        const result = mapFhirEncounterToEncounter(enc);
        expect(result.clinicalNote).toBe('Note from extension');
    });

    it('falls back to note[] when extension note is empty', () => {
        const enc = makeEncounter({
            extension: [
                {
                    url: 'https://example.com/clinical-note',
                    valueString: '   ',
                },
            ],
            note: [{ text: 'Fallback note' }],
        });
        const result = mapFhirEncounterToEncounter(enc);
        expect(result.clinicalNote).toBe('Fallback note');
    });

    it('returns undefined clinicalNote when note[] text is whitespace-only', () => {
        const enc = makeEncounter({ note: [{ text: '   ' }] });
        const result = mapFhirEncounterToEncounter(enc);
        expect(result.clinicalNote).toBeUndefined();
    });

    it('returns undefined clinicalNote when neither extension nor note[] present', () => {
        const enc = makeEncounter();
        const result = mapFhirEncounterToEncounter(enc);
        expect(result.clinicalNote).toBeUndefined();
    });
});
