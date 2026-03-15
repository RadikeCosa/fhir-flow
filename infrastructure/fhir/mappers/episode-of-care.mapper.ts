import type {
    FhirEpisodeOfCare,
    FhirCondition,
    FhirCoverage,
    FhirServiceRequest,
} from "../schemas/episode-of-care.schema";
import type {
    EpisodeOfCare,
    EpisodeStatus,
    EpisodeType,
    EpisodeCondition,
    EpisodeCoverage,
    EpisodeReferral,
} from "../../../domain/episode-of-care/episode-of-care";
import { extractId } from "./shared/extract-helpers";

/**
 * Convert a FHIR status string to our domain EpisodeStatus.  Unknown
 * values fall back to `active` as a sensible default.
 */
function mapStatus(s?: string): EpisodeStatus {
    switch (s) {
        case "planned":
        case "waitlist":
        case "active":
        case "onhold":
        case "finished":
        case "cancelled":
            return s;
        default:
            return "active";
    }
}

/**
 * Iterate all FHIR type entries and map each one to a domain
 * EpisodeType using keyword matching.  The resulting list is deduplicated.
 * If no entry matches we return an empty array.
 */
function mapType(ep?: FhirEpisodeOfCare["type"]): EpisodeType[] {
    if (!Array.isArray(ep) || ep.length === 0) return [];

    const results: EpisodeType[] = [];

    for (const entry of ep) {
        const display =
            entry?.coding && Array.isArray(entry.coding) && entry.coding[0]?.display
                ? entry.coding[0].display
                : "";
        const textVal = entry?.text || "";
        // combine both parts so we don't ignore useful text when display exists
        const combined = `${display} ${textVal}`.trim();

        const lower = combined.toLowerCase();
        if (lower.includes("motor")) {
            results.push("motora");
            continue;
        }
        if (lower.includes("respirat")) {
            results.push("respiratoria");
            continue;
        }
        if (lower.includes("paliat")) {
            results.push("paliativa");
            continue;
        }
        // any non-matching values are ignored (no "mixta" fallback)
    }

    // remove duplicates while preserving order
    return Array.from(new Set(results));
}

/**
 * Pick a primary identifier value; fallback to the resource id.
 */
function pickIdentifier(
    ids: FhirEpisodeOfCare["identifier"] | undefined,
    fallback: string
): string {
    if (Array.isArray(ids) && ids.length > 0) {
        const v = ids[0]?.value;
        if (typeof v === "string" && v.trim() !== "") {
            return v;
        }
    }
    return fallback;
}

/**
 * Convert a FHIR Condition resource into our domain representation.
 */

/**
 * Derive a human‑friendly system name from a FHIR coding.system URI.  We
 * don't need perfect accuracy; the goal is to render something legible in the
 * UI like "ICD-10" or "SNOMED".  If the URI is unrecognised we fall back to
 * the last path segment uppercased or the raw URI.
 */
function mapCodeSystem(system?: string): string | undefined {
    if (!system) return undefined;
    const lower = system.toLowerCase();
    if (lower.includes("icd-10")) return "ICD-10";
    if (lower.includes("snomed")) return "SNOMED";
    if (lower.includes("loinc")) return "LOINC";
    if (lower.includes("rxnorm")) return "RxNorm";
    // try extracting the last segment after '/'
    const parts = system.split("/");
    const last = parts[parts.length - 1];
    if (last && last !== system) return last.toUpperCase();
    return system;
}


// The returned `description` is taken verbatim from the FHIR Condition's
// coding display or text.  If the bundle or server stores the text in
// English (as seen in the seed data), the UI will show English.  To change
// the language the resource must be created/updated with a different value;
// the mapper does not perform any translation.
function mapCondition(cond: FhirCondition): EpisodeCondition {
    const code =
        Array.isArray(cond.code?.coding) && cond.code.coding[0]?.code
            ? cond.code.coding[0].code
            : "";
    const description =
        (Array.isArray(cond.code?.coding) && cond.code.coding[0]?.display) ||
        cond.code?.text ||
        "";

    const codeSystem =
        Array.isArray(cond.code?.coding) && cond.code.coding[0]?.system
            ? mapCodeSystem(cond.code.coding[0].system)
            : undefined;

    return {
        code,
        description,
        codeSystem,
        bodySite: Array.isArray(cond.bodySite) && cond.bodySite[0]?.text ? cond.bodySite[0].text : undefined,
        severity: cond.severity?.text,
        onsetDate: cond.onsetDateTime,
        notes:
            Array.isArray(cond.note) && cond.note[0]?.text ? cond.note[0].text : undefined,
    };
}

/**
 * Convert Coverage resource to domain.
 */
function mapCoverage(cov: FhirCoverage): EpisodeCoverage {
    return {
        payorName: Array.isArray(cov.payor) && cov.payor[0]?.display ? cov.payor[0].display : "",
        planName: Array.isArray(cov.class) && cov.class[0]?.name ? cov.class[0].name : undefined,
        subscriberId: cov.subscriberId,
        periodStart: cov.period?.start,
        periodEnd: cov.period?.end,
    };
}

/**
 * Convert Practitioner resource to referral info.
 */
function mapReferral(sr: FhirServiceRequest): EpisodeReferral {
    const practitionerName = sr.requester?.display ?? "";

    const practitionerId = extractId(sr.requester?.reference);

    const requestDate = sr.authoredOn ?? undefined;
    const reasonText = Array.isArray(sr.reasonCode) && sr.reasonCode[0]?.text ? sr.reasonCode[0].text : undefined;
    const requestNote = Array.isArray(sr.note) && sr.note[0]?.text ? sr.note[0].text : undefined;

    return {
        practitionerId,
        practitionerName,
        requestDate,
        reasonText,
        requestNote,
    };
}

/**
 * Top‑level mapper exposed to infrastructure.  Callers must guarantee the
 * arguments were already validated against the corresponding schemas.  The
 * provided `condition` is required; coverage and referral are optional.
 */
export function mapFhirEpisodeOfCareToDomain(
    episode: FhirEpisodeOfCare,
    condition: FhirCondition,
    coverage?: FhirCoverage,
    serviceRequest?: FhirServiceRequest
): EpisodeOfCare {
    const patientId = extractId(episode.patient?.reference);

    const result: EpisodeOfCare = {
        id: episode.id,
        identifier: pickIdentifier(episode.identifier, episode.id),
        status: mapStatus(episode.status),
        type: mapType(episode.type),
        startDate: episode.period?.start || "",
        endDate: episode.period?.end,
        condition: mapCondition(condition),
        patientId,
    };

    if (coverage) {
        result.coverage = mapCoverage(coverage);
    }
    if (serviceRequest) {
        result.referral = mapReferral(serviceRequest);
    }

    return result;
}
