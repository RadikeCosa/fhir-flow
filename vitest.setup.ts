import { afterAll } from 'vitest';

const envDefaults = {
    FHIR_BASE_URL: 'http://localhost:8080/fhir',
    CURRENT_PRACTITIONER_ID: 'kine-1',
} as const;

const originalEnvValues = {
    FHIR_BASE_URL: process.env.FHIR_BASE_URL,
    CURRENT_PRACTITIONER_ID: process.env.CURRENT_PRACTITIONER_ID,
} as const;

for (const [key, defaultValue] of Object.entries(envDefaults)) {
    if (!process.env[key]) {
        process.env[key] = defaultValue;
    }
}

afterAll(() => {
    for (const [key, originalValue] of Object.entries(originalEnvValues)) {
        if (originalValue === undefined) {
            delete process.env[key];
            continue;
        }

        process.env[key] = originalValue;
    }
});