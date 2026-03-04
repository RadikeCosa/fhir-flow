import type {
    FhirEpisodeOfCare,
    FhirCondition,
    FhirCoverage,
    FhirPractitioner,
} from "../schemas/episode-of-care.schema";
import type {
    EpisodeOfCare,
    EpisodeStatus,
    EpisodeType,
    EpisodeCondition,
    EpisodeCoverage,
    EpisodeReferral,
} from "../../../domain/episode-of-care";

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
 * Determine domain EpisodeType based on the first type coding/text value.
 */
function mapType(ep?: FhirEpisodeOfCare["type"]): EpisodeType {
    if (!Array.isArray(ep) || ep.length === 0) return "mixta";

    const first = ep[0];
    const text =
        (first?.coding && Array.isArray(first.coding) && first.coding[0]?.display) ||
        first?.text ||
        "";

    const lower = text.toLowerCase();
    if (lower.includes("motor")) return "motora";
    if (lower.includes("respirat")) return "respiratoria";
    if (lower.includes("paliat")) return "paliativa";
    return "mixta";
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
function mapCondition(cond: FhirCondition): EpisodeCondition {
    const code =
        Array.isArray(cond.code?.coding) && cond.code.coding[0]?.code
            ? cond.code.coding[0].code
            : "";
    const description =
        (Array.isArray(cond.code?.coding) && cond.code.coding[0]?.display) ||
        cond.code?.text ||
        "";

    return {
        code,
        description,
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
function mapReferral(prac: FhirPractitioner): EpisodeReferral {
    let display = "";
    if (Array.isArray(prac.name) && prac.name.length > 0) {
        const n = prac.name[0];
        const given = Array.isArray(n.given) ? n.given.filter(Boolean).join(" ") : "";
        const family = n.family || "";
        display = `${given} ${family}`.trim();
    }

    return {
        practitionerId: prac.id,
        practitionerName: display,
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
    referralPractitioner?: FhirPractitioner
): EpisodeOfCare {
    const patientId =
        typeof episode.patient?.reference === "string"
            ? episode.patient.reference.replace(/^Patient\//, "")
            : "";

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
    if (referralPractitioner) {
        result.referral = mapReferral(referralPractitioner);
    }

    return result;
}
