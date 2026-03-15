import { BadgeInfo } from "./shared.formatters";
import type { EncounterStatus, EncounterVisitType } from "../../../domain/encounters/encounter";

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
