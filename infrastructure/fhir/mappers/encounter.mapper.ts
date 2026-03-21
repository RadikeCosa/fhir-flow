import type { FhirEncounter } from "../schemas/encounter.schema";
import type {
    Encounter,
    EncounterStatus,
    EncounterVisitType,
    EncounterParticipant,
} from "../../../domain/encounters/encounter";
import {
    composeLocalDateTimeToUtcIso,
    parsePlannedDateAndTime,
    isDateOnly,
} from "../../../lib/date-time/date-time.utils";
import { extractId } from "./shared/extract-helpers";

/**
 * Translate a raw FHIR status string into the domain union.  Unrecognised
 * values fall back to `planned` which is a safe, non-error default.
 *
 * Normalizes input by trimming and lowercasing so values like "Planned" or
 * " planned " are accepted.
 */
function mapStatus(s?: string): EncounterStatus {
    if (!s) return "planned";
    const clean = s.trim().toLowerCase();
    switch (clean) {
        case "planned":
        case "in-progress":
        case "finished":
        case "cancelled":
            return clean as EncounterStatus;
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
        case "re-assessment":
            return "re-assessment";
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

function mapLegacyPlannedPeriodStart(periodStart?: string, status?: EncounterStatus): {
    plannedDate?: string;
    plannedTime?: string;
} {
    if (!periodStart || status !== "planned") {
        return {};
    }

    const parsed = parsePlannedDateAndTime(periodStart);
    if (!parsed) return {};

    // For legacy planned, we accept date-only or datetime values.
    return {
        plannedDate: parsed.plannedDate,
        plannedTime: parsed.plannedTime,
    };
}

function resolveAliasPeriodStart(
    actualStartAt?: string,
    legacyPeriodStart?: string,
    plannedDate?: string,
    plannedTime?: string
): string {
    if (actualStartAt) return actualStartAt;
    if (legacyPeriodStart) return legacyPeriodStart;
    if (plannedDate && plannedTime) {
        try {
            return composeLocalDateTimeToUtcIso(plannedDate, plannedTime);
        } catch {
            // If conversion fails, fallback to the raw planned date as compatibility
            // alias (date-only, or invalid expressions should not crash mapper).
            return `${plannedDate}`;
        }
    }
    if (plannedDate) return plannedDate;
    return "";
}

function resolveAliasPeriodEnd(actualEndAt?: string): string | undefined {
    return actualEndAt; // only actual end should drive periodEnd alias.
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

    const rawPeriodStart = resource.period?.start;
    const periodEndFromResource = resource.period?.end;

    const planned = mapLegacyPlannedPeriodStart(rawPeriodStart, mapStatus(resource.status));

    const actualStartAt =
        mapStatus(resource.status) === "finished" || mapStatus(resource.status) === "in-progress"
            ? rawPeriodStart
            : undefined;
    const actualEndAt =
        mapStatus(resource.status) === "finished" ? periodEndFromResource : undefined;

    const periodStart = resolveAliasPeriodStart(actualStartAt, rawPeriodStart, planned.plannedDate, planned.plannedTime);
    const periodEnd = resolveAliasPeriodEnd(actualEndAt);

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

    // Also support standard FHIR `note[]` — use first note.text when the
    // extension was absent or empty (backward-compatible fallback).
    if (!clinicalNote && Array.isArray(resource.note) && resource.note.length > 0) {
        const firstNote = resource.note[0];
        if (firstNote && typeof firstNote.text === "string" && firstNote.text.trim() !== "") {
            clinicalNote = firstNote.text;
        }
    }

    return {
        id: resource.id,
        status: mapStatus(resource.status),
        episodeOfCareId,
        patientId,
        visitType: mapVisitType(visitTypeCode),
        participant,
        plannedDate: planned.plannedDate,
        plannedTime: planned.plannedTime,
        actualStartAt,
        actualEndAt,
        periodStart,
        periodEnd,
        durationMinutes,
        reasonCode,
        reasonDisplay,
        clinicalNote,
    };
}
