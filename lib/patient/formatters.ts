export * from "./formatters/index";

import { formatDate } from "./formatters";
import type { EpisodeStatus } from "../../domain/episode-of-care/episode-of-care";

/**
 * Produce a short label describing the episode start depending on status.
 * - `active` → "Activo desde DD/MM/YYYY"
 * - `finished` → "Finalizado el DD/MM/YYYY"
 * - `planned` → "Planificado para DD/MM/YYYY"
 * - other → formatted date only
 */
export function formatEpisodeStartLabel(startDate: string, status: EpisodeStatus): string {
    const fd = formatDate(startDate) ?? "";
    switch (status) {
        case "active":
            return `Activo desde ${fd}`;
        case "finished":
            return `Finalizado el ${fd}`;
        case "planned":
            return `Planificado para ${fd}`;
        default:
            return fd;
    }
}
