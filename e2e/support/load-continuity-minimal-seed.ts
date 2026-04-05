import minimalContinuitySeed from "../../seeds/e2e-continuity-minimal.json";

const DEFAULT_FHIR_BASE_URL = "http://localhost:8080/fhir";

function resolveFhirBaseUrl(): string {
  const configured = process.env.FHIR_BASE_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_FHIR_BASE_URL;
}

function resolveBundle(): Record<string, unknown> {
  const bundle = structuredClone(minimalContinuitySeed) as Record<string, unknown>;

  const practitionerId = process.env.CURRENT_PRACTITIONER_ID?.trim();
  if (!practitionerId) {
    return bundle;
  }

  const serialized = JSON.stringify(bundle);
  const patched = serialized.replaceAll("kine-1", practitionerId);
  return JSON.parse(patched) as Record<string, unknown>;
}

export async function loadContinuityMinimalSeed(): Promise<void> {
  // Contract: seed loading is idempotent (transaction bundle with PUT), but not a full backend reset.
  // The helper must assert baseline state so each test starts from a known encounter lifecycle status.
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
      `Failed to load continuity seed (${response.status} ${response.statusText}) against ${baseUrl}: ${body}`,
    );
  }

  const encounterResponse = await fetch(
    `${baseUrl.replace(/\/$/, "")}/Encounter/e2e-continuity-encounter-1`,
    {
      headers: {
        Accept: "application/fhir+json",
      },
    },
  );

  if (!encounterResponse.ok) {
    const body = await encounterResponse.text().catch(() => "");
    throw new Error(
      `Continuity seed verification failed when reading encounter (${encounterResponse.status} ${encounterResponse.statusText}) from ${baseUrl}: ${body}`,
    );
  }

  const seededEncounter = (await encounterResponse.json()) as {
    status?: unknown;
  };

  if (seededEncounter.status !== "planned") {
    throw new Error(
      `Continuity seed verification failed: expected Encounter/e2e-continuity-encounter-1 status=planned but got ${String(
        seededEncounter.status,
      )}`,
    );
  }

  const finishedSiblingResponse = await fetch(
    `${baseUrl.replace(/\/$/, "")}/Encounter/e2e-continuity-encounter-finished-sibling-1`,
    {
      headers: {
        Accept: "application/fhir+json",
      },
    },
  );

  if (!finishedSiblingResponse.ok) {
    const body = await finishedSiblingResponse.text().catch(() => "");
    throw new Error(
      `Continuity seed verification failed when reading finished sibling (${finishedSiblingResponse.status} ${finishedSiblingResponse.statusText}) from ${baseUrl}: ${body}`,
    );
  }

  const finishedSibling = (await finishedSiblingResponse.json()) as {
    status?: unknown;
  };

  if (finishedSibling.status !== "finished") {
    throw new Error(
      `Continuity seed verification failed: expected Encounter/e2e-continuity-encounter-finished-sibling-1 status=finished but got ${String(
        finishedSibling.status,
      )}`,
    );
  }
}
