/**
 * Extracts the last segment from a FHIR reference in the form "ResourceType/id".
 * Returns an empty string when the input is not a string or does not contain '/'.
 */
export function extractId(ref?: string): string {
    if (typeof ref !== "string" || !ref.includes("/")) return "";

    const parts = ref.split("/");
    return parts[parts.length - 1] || "";
}

/**
 * Alias of extractId for patient references.
 */
export const extractPatientId = extractId;

/**
 * Alias of extractId for encounter references.
 */
export const extractEncounterId = extractId;

/**
 * Extracts performer information from the first performer entry.
 * Returns undefined when the array is empty or the first item has no string reference.
 */
export function extractPerformer(
    performer?: Array<{ reference?: string; display?: string }>
): { id: string; display: string } | undefined {
    if (!Array.isArray(performer) || performer.length === 0) return;

    const first = performer[0];
    if (typeof first?.reference !== "string") return;

    return {
        id: extractId(first.reference),
        display: typeof first.display === "string" ? first.display : "",
    };
}

/**
 * Picks the first available date value from effectiveDateTime or issued.
 * Returns an empty string when both values are missing or empty.
 */
export function extractDate(
    effectiveDateTime?: string,
    issued?: string
): string {
    if (typeof effectiveDateTime === "string" && effectiveDateTime.trim() !== "") {
        return effectiveDateTime;
    }

    if (typeof issued === "string" && issued.trim() !== "") {
        return issued;
    }

    return "";
}
