import { BadgeInfo } from "./shared.formatters";
import type { Encounter, EncounterStatus, EncounterVisitType } from "../../../domain/encounters/encounter";
import type { Procedure } from "../../../domain/procedures/procedure";
import type { VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "../../../domain/assessments/eva-assessment";

export interface EncounterHistorySummary {
    preview: string | null;
    hasVitalSigns: boolean;
    hasEvaRecords: boolean;
    hasProcedures: boolean;
}

function normalizeSummaryText(value?: string): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim().replace(/\s+/g, " ");

    return normalized.length > 0 ? normalized : null;
}

function truncateSummaryText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getEncounterHistorySummary(
    encounter: Pick<Encounter, "reasonDisplay" | "clinicalNote">,
    vitalSigns: VitalSignRecord[],
    evaRecords: EvaAssessment[],
    procedures: Procedure[]
): EncounterHistorySummary {
    const reasonSummary = normalizeSummaryText(encounter.reasonDisplay);
    const noteSummary = normalizeSummaryText(encounter.clinicalNote);

    const previewSource = reasonSummary ?? noteSummary;

    return {
        preview: previewSource ? truncateSummaryText(previewSource, 120) : null,
        hasVitalSigns: vitalSigns.length > 0,
        hasEvaRecords: evaRecords.length > 0,
        hasProcedures: procedures.length > 0,
    };
}

/**
 * Translate a domain visit type into a human-readable Spanish label.
 */
export function formatEncounterVisitType(visitType: EncounterVisitType): string {
    switch (visitType) {
        case "initial":
            return "Visita inicial";
        case "follow-up":
            return "Visita de seguimiento";
        case "re-assessment":
            return "Re-evaluación";
        case "discharge":
            return "Alta";
        default:
            // should be unreachable due to union type
            return visitType as string;
    }
}

/**
 * Produce a badge info object appropriate for an encounter status.
 */
export function getEncounterStatusBadge(status: EncounterStatus): BadgeInfo {
    switch (status) {
        case "planned":
            return { label: "Planificada", colorClass: "bg-badge-info-bg text-badge-info-text" };
        case "in-progress":
            return { label: "En curso", colorClass: "bg-badge-warning-bg text-badge-warning-text" };
        case "finished":
            return { label: "Finalizada", colorClass: "bg-badge-success-bg text-badge-success-text" };
        case "cancelled":
            return { label: "Cancelada", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
        default:
            return { label: "Desconocido", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
    }
}

export function getVisitTypeBadge(visitType: EncounterVisitType): BadgeInfo {
    switch (visitType) {
        case "initial":
            return { label: "Inicial", colorClass: "bg-badge-info-bg text-badge-info-text" };
        case "follow-up":
            return { label: "Seguimiento", colorClass: "bg-badge-warning-bg text-badge-warning-text" };
        case "re-assessment":
            return { label: "Re-evaluación", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
        case "discharge":
            return { label: "Alta", colorClass: "bg-badge-success-bg text-badge-success-text" };
        default:
            return { label: visitType, colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
    }
}

/**
 * Format an encounter duration (minutes) for display.
 * Returns null when duration is undefined.
 */
export function formatEncounterDuration(durationMinutes: number | undefined): string | null {
    if (typeof durationMinutes === "number") {
        return `${durationMinutes} min`;
    }
    return null;
}

/**
 * Returns the representative encounter start used by read surfaces.
 * - finished: actualStartAt, with legacy fallback to periodStart
 * - others: periodStart
 */
export function getEncounterRepresentativeStart(
    encounter: Pick<Encounter, "status" | "actualStartAt" | "periodStart">
): string {
    if (encounter.status === "finished") {
        return encounter.actualStartAt ?? encounter.periodStart;
    }
    return encounter.periodStart;
}

/**
 * Returns the representative encounter end used by read surfaces.
 * - finished: actualEndAt, with legacy fallback to periodEnd
 * - others: periodEnd
 */
export function getEncounterRepresentativeEnd(
    encounter: Pick<Encounter, "status" | "actualEndAt" | "periodEnd">
): string | undefined {
    if (encounter.status === "finished") {
        return encounter.actualEndAt ?? encounter.periodEnd;
    }
    return encounter.periodEnd;
}
