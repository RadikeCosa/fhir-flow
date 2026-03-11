// Shared utilities used across multiple formatter modules

/**
 * Result type for functions that produce a labelled badge.
 */
export interface BadgeInfo {
    label: string;
    // Tailwind CSS classes to apply to the badge span
    colorClass: string;
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

    // If the string has no explicit time component treat it as a date-only
    // value (UTC midnight) to match the behaviour of formatDate.
    const hasTime = date.includes("T");

    const formatter = new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: hasTime ? undefined : "UTC",
    });
    return formatter.format(d);
}
