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
}
