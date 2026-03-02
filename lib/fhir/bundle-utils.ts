import { z } from "zod";
import type { FhirResource } from "./fhir-client";

// Minimal Zod schemas for FHIR Bundle fragments used by these helpers.
const resourceSchema = z.object({ resourceType: z.string() }).passthrough();

const entrySchema = z
    .object({
        fullUrl: z.string().optional(),
        resource: resourceSchema.optional(),
    })
    .passthrough();

const linkSchema = z
    .object({
        relation: z.string(),
        url: z.string(),
    })
    .passthrough();

const bundleSchema = z
    .object({
        resourceType: z.string(),
        type: z.string().optional(),
        total: z.number().optional(),
        entry: z.array(entrySchema).optional(),
        link: z.array(linkSchema).optional(),
    })
    .passthrough();

type BundleEntry = z.infer<typeof entrySchema>;

function isResource(obj: unknown): obj is FhirResource {
    return resourceSchema.safeParse(obj).success;
}

/**
 * Safely extract the `entry` array from a FHIR Bundle.
 * Returns an empty array when the bundle is missing, invalid, or has no entries.
 */
export function safeGetEntries(bundle: unknown): BundleEntry[] {
    const parsed = bundleSchema.safeParse(bundle);
    if (!parsed.success) return [];
    return parsed.data.entry ?? [];
}

/**
 * Extract the `resource` from each bundle entry, skipping missing or invalid resources.
 * Returns an empty array when bundle is invalid or has no resources.
 */
export function safeGetResources<T extends FhirResource = FhirResource>(bundle: unknown): T[] {
    const entries = safeGetEntries(bundle);
    const results: T[] = [];
    for (const e of entries) {
        if (e.resource && isResource(e.resource)) {
            results.push(e.resource as T);
        }
    }
    return results;
}

/**
 * Extract `total` from a FHIR Bundle. Returns `undefined` when absent or the bundle is invalid.
 */
export function getBundleTotal(bundle: unknown): number | undefined {
    const parsed = bundleSchema.safeParse(bundle);
    if (!parsed.success) return undefined;
    return typeof parsed.data.total === "number" ? parsed.data.total : undefined;
}

/**
 * Get the URL for a given link `relation` (e.g. 'self', 'next', 'prev').
 * Returns `undefined` when the link is missing or bundle is invalid.
 */
export function getBundleLink(bundle: unknown, relation: string): string | undefined {
    const parsed = bundleSchema.safeParse(bundle);
    if (!parsed.success) return undefined;
    const links = parsed.data.link ?? [];
    const match = links.find((l) => l.relation === relation && typeof l.url === "string");
    return match ? match.url : undefined;
}

/**
 * Extract pagination links: `self`, `next`, and `prev` (when present).
 * Always returns a plain object with keys possibly undefined.
 */
export function getPaginationLinks(bundle: unknown): { self?: string; next?: string; prev?: string } {
    return {
        self: getBundleLink(bundle, "self"),
        next: getBundleLink(bundle, "next"),
        prev: getBundleLink(bundle, "prev"),
    };
}

/**
 * Filter resources in a Bundle by `resourceType`.
 * Returns a typed array `T[]` (caller may specify `T`) and never throws.
 */
export function filterResourcesByType<T extends FhirResource = FhirResource>(bundle: unknown, resourceType: string): T[] {
    const resources = safeGetResources<FhirResource>(bundle);
    return resources.filter((r): r is T => r.resourceType === resourceType);
}

const bundleUtils = {
    safeGetEntries,
    safeGetResources,
    getBundleTotal,
    getBundleLink,
    getPaginationLinks,
    filterResourcesByType,
};

export default bundleUtils;
