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
            return { label: "Planificada", colorClass: "bg-blue-100 text-blue-800" };
        case "in-progress":
            return { label: "En curso", colorClass: "bg-yellow-100 text-yellow-800" };
        case "finished":
            return { label: "Finalizada", colorClass: "bg-green-100 text-green-800" };
        case "cancelled":
            return { label: "Cancelada", colorClass: "bg-gray-100 text-gray-800" };
        default:
            return { label: "Desconocido", colorClass: "bg-gray-100 text-gray-800" };
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
