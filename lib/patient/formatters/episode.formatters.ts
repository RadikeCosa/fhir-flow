import { BadgeInfo, formatDate } from "./shared.formatters";
import type {
    EpisodeType,
    EpisodeReferral,
} from "../../../domain/episode-of-care/episode-of-care";

/**
 * Translate an EpisodeStatus into a badge suitable for display in the UI.
 * Spanish labels and light/dark colour choices are provided.
 */
export function translateEpisodeStatus(status: string | undefined): BadgeInfo {
    switch (status) {
        case "planned":
            return { label: "Planificado", colorClass: "bg-badge-info-bg text-badge-info-text" };
        case "waitlist":
            return { label: "En espera", colorClass: "bg-badge-warning-bg text-badge-warning-text" };
        case "active":
            return { label: "Activo", colorClass: "bg-badge-success-bg text-badge-success-text" };
        case "onhold":
            return { label: "En pausa", colorClass: "bg-badge-orange-bg text-badge-orange-text" };
        case "finished":
            return { label: "Finalizado", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
        case "cancelled":
            return { label: "Cancelado", colorClass: "bg-badge-error-bg text-badge-error-text" };
        default:
            return { label: "Desconocido", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
    }
}

/**
 * Produce a badge for a condition severity string.  The mapping is loose; any
 * text containing "moder" → naranja, "sever" / "alto" → rojo, "leve" →
 * verde, else gris.
 */
export function getSeverityBadge(sev?: string): BadgeInfo {
    if (!sev || sev.trim() === "") {
        return { label: "No registrada", colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
    }

    const lower = sev.toLowerCase();
    if (lower.includes("moder")) {
        return { label: "Moderada", colorClass: "bg-badge-warning-bg text-badge-warning-text" };
    }
    if (lower.includes("alto") || lower.includes("sever")) {
        return { label: "Severa", colorClass: "bg-badge-error-bg text-badge-error-text" };
    }
    if (lower.includes("leve") || lower.includes("mild")) {
        return { label: "Leve", colorClass: "bg-badge-success-bg text-badge-success-text" };
    }
    // fallback
    return { label: sev, colorClass: "bg-badge-neutral-bg text-badge-neutral-text" };
}

/**
 * Convierte el valor de `EpisodeType` a un texto adecuado para mostrar en la
 * UI. El comportamiento actual es capitalizar sólo la primera letra,
 * dejando el resto en minúsculas; se mantiene aún independiente de CSS para
 * facilitar cambios futuros (traducciones, sinónimos, etc.).
 */
export function formatEpisodeType(types?: EpisodeType[]): string {
    if (!Array.isArray(types) || types.length === 0) {
        return "Sin tipo";
    }

    const labels = types.map((t) => {
        switch (t) {
            case "motora":
                return "Motor";
            case "respiratoria":
                return "Respiratorio";
            case "paliativa":
                return "Paliativo";
            default:
                // fallback for any unexpected future value, cast to string so
                // we can manipulate it safely without triggering never errors.
                const lower = (t as string).toLowerCase();
                return lower[0].toUpperCase() + lower.slice(1);
        }
    });

    return labels.join(" + ");
}

/**
 * Format a referral line combining practitioner name and request date.
 * Output formats:
 * - both: "Dr. X · DD/MM/YYYY"
 * - name only: "Dr. X"
 * - date only: "DD/MM/YYYY"
 * - neither: empty string
 */
export function formatReferralLine(ref?: EpisodeReferral): string {
    if (!ref) return "";
    const name = ref.practitionerName?.trim() ?? "";
    const dateFmt = formatDate(ref.requestDate);

    if (name && dateFmt) return `${name} · ${dateFmt}`;
    if (name) return name;
    if (dateFmt) return dateFmt;
    return "";
}
