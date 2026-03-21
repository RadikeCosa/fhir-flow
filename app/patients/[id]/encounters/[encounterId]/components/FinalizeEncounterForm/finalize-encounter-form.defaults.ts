import {
    APP_TIME_ZONE,
    formatCalendarDateInTimeZone,
    isDateOnly,
} from "../../../../../../../lib/date-time/date-time.utils";
import { formatDate } from "../../../../../../../lib/patient/formatters/shared.formatters";

export function resolveInitialActualDate(
    plannedDate?: string,
    now: Date = new Date()
): string {
    if (plannedDate && isDateOnly(plannedDate)) {
        return plannedDate;
    }

    return formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
}

export function formatPlannedContext(
    plannedDate?: string,
    plannedTime?: string
): string {
    if (!plannedDate || !isDateOnly(plannedDate)) {
        return "Sin fecha planificada";
    }

    const formattedDate = formatDate(plannedDate) ?? plannedDate;

    if (!plannedTime) {
        return `${formattedDate} • Sin horario definido`;
    }

    return `${formattedDate} ${plannedTime}`;
}
