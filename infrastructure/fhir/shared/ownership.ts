const OWNERSHIP_TAG_SYSTEM = "https://fhir-flow.app/ownership" as const;
const OWNERSHIP_TAG_CODE = "managed-by-fhir-flow" as const;

export const FHIR_FLOW_OWNERSHIP_TAG = {
    system: OWNERSHIP_TAG_SYSTEM,
    code: OWNERSHIP_TAG_CODE,
} as const;

export const FHIR_FLOW_OWNERSHIP_SEARCH_TOKEN =
    `${OWNERSHIP_TAG_SYSTEM}|${OWNERSHIP_TAG_CODE}` as const;

export function hasFhirFlowOwnershipTag(resource: unknown): boolean {
    if (typeof resource !== "object" || resource === null) {
        return false;
    }

    const candidate = resource as {
        meta?: {
            tag?: Array<{ system?: unknown; code?: unknown }>;
        };
    };

    if (!Array.isArray(candidate.meta?.tag)) {
        return false;
    }

    return candidate.meta.tag.some(
        (tag) =>
            tag.system === FHIR_FLOW_OWNERSHIP_TAG.system &&
            tag.code === FHIR_FLOW_OWNERSHIP_TAG.code
    );
}
