import crossSurfaceNoMixSeed from "../../seeds/e2e-cross-surface-no-mix.json";

const DEFAULT_FHIR_BASE_URL = "http://localhost:8080/fhir";

function resolveFhirBaseUrl(): string {
    const configured = process.env.FHIR_BASE_URL?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_FHIR_BASE_URL;
}

function resolveBundle(): Record<string, unknown> {
    const bundle = structuredClone(crossSurfaceNoMixSeed) as Record<string, unknown>;

    const practitionerId = process.env.CURRENT_PRACTITIONER_ID?.trim();
    if (!practitionerId) {
        return bundle;
    }

    const serialized = JSON.stringify(bundle);
    const patched = serialized.replaceAll("kine-1", practitionerId);
    return JSON.parse(patched) as Record<string, unknown>;
}

async function verifyEncounterStatus(
    baseUrl: string,
    encounterId: string,
    expectedStatus: string,
): Promise<void> {
    const encounterResponse = await fetch(
        `${baseUrl.replace(/\/$/, "")}/Encounter/${encounterId}`,
        {
            headers: {
                Accept: "application/fhir+json",
            },
        },
    );

    if (!encounterResponse.ok) {
        const body = await encounterResponse.text().catch(() => "");
        throw new Error(
            `Cross-surface seed verification failed when reading Encounter/${encounterId} (${encounterResponse.status} ${encounterResponse.statusText}) from ${baseUrl}: ${body}`,
        );
    }

    const encounter = (await encounterResponse.json()) as {
        status?: unknown;
    };

    if (encounter.status !== expectedStatus) {
        throw new Error(
            `Cross-surface seed verification failed: expected Encounter/${encounterId} status=${expectedStatus} but got ${String(encounter.status)}`,
        );
    }
}

export async function loadCrossSurfaceNoMixSeed(): Promise<void> {
    const baseUrl = resolveFhirBaseUrl();
    const bundle = resolveBundle();

    const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/fhir+json",
            Accept: "application/fhir+json",
        },
        body: JSON.stringify(bundle),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
            `Failed to load cross-surface seed (${response.status} ${response.statusText}) against ${baseUrl}: ${body}`,
        );
    }

    await verifyEncounterStatus(baseUrl, "e2e-cross-surface-target-encounter-1", "in-progress");
    await verifyEncounterStatus(baseUrl, "e2e-cross-surface-sibling-encounter-1", "finished");
}