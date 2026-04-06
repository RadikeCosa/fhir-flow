import crossSurfaceNoMixSeed from "../../seeds/e2e-cross-surface-no-mix.json";

const DEFAULT_FHIR_BASE_URL = "http://127.0.0.1:8080/fhir";
const resolvedReadyTimeout = Number.parseInt(
  process.env.FHIR_READY_TIMEOUT_MS ?? "60000",
  10,
);
const FHIR_READY_TIMEOUT_MS = Number.isFinite(resolvedReadyTimeout)
  ? resolvedReadyTimeout
  : 60000;
const FHIR_READY_POLL_MS = 500;

function resolveFhirBaseUrl(): string {
  const configured = process.env.FHIR_BASE_URL?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_FHIR_BASE_URL;
}

function resolveBundle(): Record<string, unknown> {
  const bundle = structuredClone(crossSurfaceNoMixSeed) as Record<
    string,
    unknown
  >;

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

async function waitForFhirAvailability(baseUrl: string): Promise<void> {
  const metadataUrl = `${baseUrl.replace(/\/$/, "")}/metadata`;
  const timeoutAt = Date.now() + FHIR_READY_TIMEOUT_MS;
  let lastError: unknown = null;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(metadataUrl, {
        headers: {
          Accept: "application/fhir+json",
        },
      });

      if (response.ok) {
        return;
      }

      lastError = new Error(
        `FHIR readiness probe failed (${response.status} ${response.statusText}) at ${metadataUrl}`,
      );
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, FHIR_READY_POLL_MS);
    });
  }

  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `FHIR server is not reachable for cross-surface seed within ${FHIR_READY_TIMEOUT_MS}ms at ${metadataUrl}. Last probe error: ${detail}. Verify FHIR_BASE_URL and that the FHIR server is up before running Playwright.`,
  );
}

export async function loadCrossSurfaceNoMixSeed(): Promise<void> {
  const baseUrl = resolveFhirBaseUrl();
  const bundle = resolveBundle();

  await waitForFhirAvailability(baseUrl);

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

  await verifyEncounterStatus(
    baseUrl,
    "e2e-cross-surface-target-encounter-1",
    "in-progress",
  );
  await verifyEncounterStatus(
    baseUrl,
    "e2e-cross-surface-sibling-encounter-1",
    "finished",
  );
}
