// Shared utilities used across multiple formatter modules
import { APP_TIME_ZONE, hasTimeComponent, isDateOnly } from "../../date-time/date-time.utils";

/**
 * Result type for functions that produce a labelled badge.
 */
export interface BadgeInfo {
    label: string;
    // Tailwind CSS classes to apply to the badge span
    colorClass: string;
    severity?: "normal" | "warning" | "critical";
}

/**
 * Format an ISO date string into "DD/MM/YYYY" for display.  Returns undefined
 * if the input is missing or invalid.
 */
export function formatDate(date?: string): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    // timeZone: "UTC" is intentional — date-only strings (no time component)
    // are parsed as UTC midnight; without this, local offsets (e.g. UTC-3)
    // would shift the displayed date back by one day.
    const formatter = new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });
    return formatter.format(d);
}

/**
 * Format an ISO datetime string into "DD/MM/YYYY HH:mm" for display.
 * When the string contains a time component (T separator) it is rendered in
 * local time so the displayed hour matches the practitioner's timezone.
 * Date-only strings fall back to UTC to avoid off-by-one day shifts.
 * Returns undefined if the input is missing or invalid.
 */
export function formatDateTime(date?: string): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;

    const hasTime = hasTimeComponent(date);

    const formatter = new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: hasTime ? APP_TIME_ZONE : "UTC",
    });
    return formatter.format(d);
}

/**
 * Returns presentation for planned date/time values.
 * - Date-only => "DD/MM/YYYY • Sin horario definido"
 * - Date-time => "DD/MM/YYYY HH:mm"
 */
export function formatPlannedDateTime(value?: string): string | undefined {
    if (!value) return undefined;

    if (isDateOnly(value)) {
        const formattedDate = formatDate(value);
        if (!formattedDate) return undefined;
        return `${formattedDate} • Sin horario definido`;
    }

    return formatDateTime(value);
}

/**
 * Format planned schedule from explicit read-model fields.
 * - plannedDate is always rendered when present
 * - plannedTime is optional and falls back to "Sin horario definido"
 */
export function formatPlannedSchedule(
    plannedDate?: string,
    plannedTime?: string
): {
    plannedDateLabel?: string;
    plannedTimeLabel?: string;
} {
    if (!plannedDate) {
        return {
            plannedDateLabel: undefined,
            plannedTimeLabel: undefined,
        };
    }

    return {
        plannedDateLabel: formatDate(plannedDate) ?? plannedDate,
        plannedTimeLabel: plannedTime || "Sin horario definido",
    };
}
