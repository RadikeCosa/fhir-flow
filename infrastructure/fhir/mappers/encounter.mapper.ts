import type { FhirEncounter } from "../schemas/encounter.schema";
import type {
    Encounter,
    EncounterStatus,
    EncounterVisitType,
    EncounterParticipant,
} from "../../../domain/encounters/encounter";
import { extractId } from "./shared/extract-helpers";

/**
 * Translate a raw FHIR status string into the domain union.  Unrecognised
 * values fall back to `planned` which is a safe, non-error default.
 */
function mapStatus(s?: string): EncounterStatus {
    switch (s) {
        case "planned":
        case "in-progress":
        case "finished":
        case "cancelled":
            return s;
        default:
            return "planned";
    }
}

/**
 * Map a possible visit type code to the domain value.  Defaults to
 * `follow-up` when the code is missing or unexpected.
 */
function mapVisitType(code?: string): EncounterVisitType {
    switch (code) {
        case "initial":
            return "initial";
        case "follow-up":
            return "follow-up";
        case "discharge":
            return "discharge";
        default:
            return "follow-up";
    }
}

/**
 * Build participant object from the first entry of the array, or return
 * `null` when none is present.
 */
function mapParticipant(
    partArr?: FhirEncounter["participant"]
): EncounterParticipant | null {
    if (!Array.isArray(partArr) || partArr.length === 0) return null;
    const first = partArr[0];
    const practitionerId = extractId(first.individual?.reference);
    const practitionerName = first.individual?.display || "";
    let role = "";
    if (
        Array.isArray(first.type) &&
        first.type[0]?.coding &&
        Array.isArray(first.type[0].coding) &&
        first.type[0].coding[0]?.display
    ) {
        role = first.type[0].coding[0].display || "";
    }
    return { practitionerId, practitionerName, role };
}

/**
 * Round to nearest minute.
 */
function computeDuration(start?: string, end?: string): number | undefined {
    if (!start || !end) return undefined;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return undefined;
    const diffMs = e.getTime() - s.getTime();
    return Math.round(diffMs / 60000);
}

/**
 * Top-level mapper exposed to the infrastructure layer.  Assumes the
 * resource has already been validated against `fhirEncounterSchema`.
 */
export function mapFhirEncounterToEncounter(resource: FhirEncounter): Encounter {
    const episodeOfCareId =
        Array.isArray(resource.episodeOfCare) && resource.episodeOfCare.length > 0
            ? extractId(resource.episodeOfCare[0].reference)
            : "";
    const patientId = extractId(resource.subject?.reference);

    const visitTypeCode =
        Array.isArray(resource.type) &&
            resource.type[0]?.coding &&
            Array.isArray(resource.type[0].coding)
            ? resource.type[0].coding[0]?.code
            : undefined;

    const participant = mapParticipant(resource.participant);

    const periodStart = resource.period?.start || "";
    const periodEnd = resource.period?.end;
    const durationMinutes = computeDuration(periodStart, periodEnd);

    let reasonCode: string | undefined;
    let reasonDisplay: string | undefined;
    if (Array.isArray(resource.reasonCode) && resource.reasonCode.length > 0) {
        const r = resource.reasonCode[0];
        if (Array.isArray(r.coding) && r.coding.length > 0) {
            reasonCode = r.coding[0].code || undefined;
            reasonDisplay = r.text || r.coding[0].display || undefined;
        } else {
            reasonDisplay = r.text || undefined;
        }
    }

    // look for clinical‑note extension in the resource
    let clinicalNote: string | undefined;
    if (Array.isArray(resource.extension)) {
        type ClinicalNoteExtension = { [x: string]: unknown; url?: string; valueString?: string };

        const clinicalExt = resource.extension.find(
            (e): e is ClinicalNoteExtension => {
                const url = (e as { url?: unknown }).url;
                return typeof url === "string" && url.includes("clinical-note");
            }
        );

        if (
            clinicalExt &&
            typeof clinicalExt.valueString === "string" &&
            clinicalExt.valueString.trim() !== ""
        ) {
            clinicalNote = clinicalExt.valueString;
        }
    }

    return {
        id: resource.id,
        status: mapStatus(resource.status),
        episodeOfCareId,
        patientId,
        visitType: mapVisitType(visitTypeCode),
        participant,
        periodStart,
        periodEnd,
        durationMinutes,
        reasonCode,
        reasonDisplay,
        clinicalNote,
    };
}
