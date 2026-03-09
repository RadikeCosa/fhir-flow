import { BadgeInfo } from "./shared.formatters";
import type {
    Procedure,
    ProcedureCategory,
    ProcedureStatus,
} from "../../../domain/procedures/procedure";

/**
 * Convert a procedure category value into a Spanish human-readable label.
 */
export function formatProcedureCategory(category: ProcedureCategory): string {
    switch (category) {
        case "terapia-manual":
            return "Terapia manual";
        case "ejercicio-terapeutico":
            return "Ejercicio terapéutico";
        case "rehabilitacion-neurologica":
            return "Rehabilitación neurológica";
        case "rehabilitacion-respiratoria":
            return "Rehabilitación respiratoria";
        case "fisioterapia":
            return "Fisioterapia";
        case "terapias-complementarias":
            return "Terapias complementarias";
        case "educacion":
            return "Educación";
        default:
            // Should be impossible due to the union type, but satisfy TS
            return category as string;
    }
}

/**
 * Returns a badge info object suitable for displaying the procedure status.
 * Mirrors the pattern used by other formatter modules (eg. episode.formatters).
 */
export function getProcedureStatusBadge(status: ProcedureStatus): BadgeInfo {
    switch (status) {
        case "completed":
            return { label: "Realizado", colorClass: "bg-green-100 text-green-800" };
        case "in-progress":
            return { label: "En curso", colorClass: "bg-primary/10 text-primary" };
        case "not-done":
            return { label: "No realizado", colorClass: "bg-gray-100 text-gray-800" };
        default:
            // Exhaustive switch; TS will error if a case is missing.
            return { label: "Desconocido", colorClass: "bg-gray-100 text-gray-800" };
    }
}

/**
 * Group an array of procedures by their category.  The returned Map preserves
 * insertion order in the same way as the input array; categories with no
 * procedures are omitted.
 */
export function groupProceduresByCategory(
    procedures: Procedure[],
): Map<ProcedureCategory, Procedure[]> {
    const map = new Map<ProcedureCategory, Procedure[]>();

    for (const proc of procedures) {
        const arr = map.get(proc.category) || [];
        arr.push(proc);
        map.set(proc.category, arr);
    }

    return map;
}
