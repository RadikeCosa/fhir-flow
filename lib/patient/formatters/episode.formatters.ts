import { BadgeInfo } from "./shared.formatters";

/**
 * Translate an EpisodeStatus into a badge suitable for display in the UI.
 * Spanish labels and light/dark colour choices are provided.
 */
export function translateEpisodeStatus(status: string | undefined): BadgeInfo {
    switch (status) {
        case "planned":
            return { label: "Planificado", colorClass: "bg-blue-100 text-blue-800" };
        case "waitlist":
            return { label: "En espera", colorClass: "bg-yellow-100 text-yellow-800" };
        case "active":
            return { label: "Activo", colorClass: "bg-green-100 text-green-800" };
        case "onhold":
            return { label: "En pausa", colorClass: "bg-orange-100 text-orange-800" };
        case "finished":
            return { label: "Finalizado", colorClass: "bg-gray-100 text-gray-800" };
        case "cancelled":
            return { label: "Cancelado", colorClass: "bg-red-100 text-red-800" };
        default:
            return { label: "Desconocido", colorClass: "bg-gray-100 text-gray-800" };
    }
}

/**
 * Produce a badge for a condition severity string.  The mapping is loose; any
 * text containing "moder" → naranja, "sever" / "alto" → rojo, "leve" →
 * verde, else gris.
 */
export function getSeverityBadge(sev?: string): BadgeInfo {
    if (!sev || sev.trim() === "") {
        return { label: "No registrada", colorClass: "bg-gray-100 text-gray-800" };
    }

    const lower = sev.toLowerCase();
    if (lower.includes("moder")) {
        return { label: "Moderada", colorClass: "bg-yellow-100 text-yellow-800" };
    }
    if (lower.includes("alto") || lower.includes("sever")) {
        return { label: "Severa", colorClass: "bg-red-100 text-red-800" };
    }
    if (lower.includes("leve") || lower.includes("mild")) {
        return { label: "Leve", colorClass: "bg-green-100 text-green-800" };
    }
    // fallback
    return { label: sev, colorClass: "bg-gray-100 text-gray-800" };
}

/**
 * Convierte el valor de `EpisodeType` a un texto adecuado para mostrar en la
 * UI. El comportamiento actual es capitalizar sólo la primera letra,
 * dejando el resto en minúsculas; se mantiene aún independiente de CSS para
 * facilitar cambios futuros (traducciones, sinónimos, etc.).
 */
export function formatEpisodeType(type?: string): string {
    if (!type || typeof type !== "string") return "";
    const lower = type.toLowerCase();
    return lower[0].toUpperCase() + lower.slice(1);
}
