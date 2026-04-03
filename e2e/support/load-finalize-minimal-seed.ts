import minimalFinalizeSeed from "../../seeds/e2e-finalize-minimal.json";

const DEFAULT_FHIR_BASE_URL = "http://localhost:8080/fhir";

function resolveFhirBaseUrl(): string {
  const configured = process.env.FHIR_BASE_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_FHIR_BASE_URL;
}

function resolveBundle(): Record<string, unknown> {
  const bundle = structuredClone(minimalFinalizeSeed) as Record<string, unknown>;

  const practitionerId = process.env.CURRENT_PRACTITIONER_ID?.trim();
  if (!practitionerId) {
    return bundle;
  }

  const serialized = JSON.stringify(bundle);
  const patched = serialized.replaceAll("kine-1", practitionerId);
  return JSON.parse(patched) as Record<string, unknown>;
}

export async function loadFinalizeMinimalSeed(): Promise<void> {
  // Contract: seed loading is idempotent (transaction bundle with PUT), but not a full backend reset.
  // We verify encounter status to ensure tests run on the expected lifecycle baseline.
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
      `Failed to load finalize seed (${response.status} ${response.statusText}) against ${baseUrl}: ${body}`,
    );
  }

  const encounterResponse = await fetch(
    `${baseUrl.replace(/\/$/, "")}/Encounter/e2e-finalize-encounter-1`,
    {
      headers: {
        Accept: "application/fhir+json",
      },
    },
  );

  if (!encounterResponse.ok) {
    const body = await encounterResponse.text().catch(() => "");
    throw new Error(
      `Finalize seed verification failed when reading encounter (${encounterResponse.status} ${encounterResponse.statusText}) from ${baseUrl}: ${body}`,
    );
  }

  const seededEncounter = (await encounterResponse.json()) as {
    status?: unknown;
  };

  if (seededEncounter.status !== "in-progress") {
    throw new Error(
      `Finalize seed verification failed: expected Encounter/e2e-finalize-encounter-1 status=in-progress but got ${String(
        seededEncounter.status,
      )}`,
    );
  }
}
