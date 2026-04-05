import { describe, expect, it, vi, beforeAll } from 'vitest';

let EvaAssessmentFhirRepository: typeof import('../assessments/eva-assessment.fhir-repository').EvaAssessmentFhirRepository;
type RepoClient = NonNullable<ConstructorParameters<typeof EvaAssessmentFhirRepository>[0]>;

function makeEvaBundle(observations: object[]) {
    return {
        resourceType: 'Bundle',
        entry: observations.map((resource) => ({ resource })),
    };
}

beforeAll(async () => {
    process.env.FHIR_BASE_URL = process.env.FHIR_BASE_URL || 'http://example.com';
    process.env.CURRENT_PRACTITIONER_ID = process.env.CURRENT_PRACTITIONER_ID || 'pr-123';
    ({ EvaAssessmentFhirRepository } = await import('../assessments/eva-assessment.fhir-repository'));
});

const makeObservation = (overrides: Record<string, unknown> = {}) => ({
    resourceType: 'Observation',
    id: 'obs-1',
    effectiveDateTime: '2022-01-01',
    valueInteger: 7,
    performer: [{ reference: 'Practitioner/pr-123', display: 'Dr. Test' }],
    subject: { reference: 'Patient/p-001' },
    ...overrides,
});

describe('EvaAssessmentFhirRepository', () => {
    it('returns mapped assessments when the client returns a valid bundle', async () => {
        const bundle = makeEvaBundle([makeObservation()]);
        const mockClient = {
            search: vi.fn().mockResolvedValue(bundle),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);
        const result = await repo.findEvaByPatientId('p-001');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: 'obs-1',
            patientId: 'p-001',
            type: 'eva',
            date: '2022-01-01',
            score: 7,
            recordedBy: { id: 'pr-123', display: 'Dr. Test' },
        });
    });

    it('returns [] when the bundle has no entry field', async () => {
        const mockClient = {
            search: vi.fn().mockResolvedValue({ resourceType: 'Bundle' }),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);
        const result = await repo.findEvaByPatientId('p-001');

        expect(result).toEqual([]);
    });

    it('skips invalid observations that fail schema validation', async () => {
        const invalidObs = { resourceType: 'Observation' }; // missing id
        const bundle = makeEvaBundle([invalidObs]);
        const mockClient = {
            search: vi.fn().mockResolvedValue(bundle),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);
        const result = await repo.findEvaByPatientId('p-001');

        expect(result).toEqual([]);
    });

    it('re-throws when the client search rejects', async () => {
        const error = new Error('network');
        const mockClient = {
            search: vi.fn().mockRejectedValue(error),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);

        await expect(repo.findEvaByPatientId('p-001')).rejects.toThrow(error);
    });

    it('calls search with encounter parameter when finding by encounter id', async () => {
        const bundle = makeEvaBundle([makeObservation()]);
        const mockClient = {
            search: vi.fn().mockResolvedValue(bundle),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);
        const result = await repo.findEvaByEncounterId('enc-001');

        expect(result).toHaveLength(1);
        expect(mockClient.search).toHaveBeenCalledWith(
            'Observation',
            expect.objectContaining({ encounter: 'Encounter/enc-001' }),
            expect.objectContaining({ cache: 'no-store' })
        );
    });

    it('returns [] when encounter search returns an empty bundle', async () => {
        const mockClient = {
            search: vi.fn().mockResolvedValue({ resourceType: 'Bundle' }),
            fetchByUrl: async () => ({} as unknown),
        } as unknown as RepoClient;

        const repo = new EvaAssessmentFhirRepository(mockClient);
        const result = await repo.findEvaByEncounterId('enc-001');

        expect(result).toEqual([]);
    });
});
