import {
    APP_TIME_ZONE,
    formatCalendarDateInTimeZone,
    isDateOnly,
} from "../../../../../../../lib/date-time/date-time.utils";
import { formatDate } from "../../../../../../../lib/patient/formatters/shared.formatters";

interface InitialActualTiming {
    actualDate: string;
    actualStartTime: string;
}

export function resolveInitialActualDate(
    plannedDate?: string,
    now: Date = new Date()
): string {
    if (plannedDate && isDateOnly(plannedDate)) {
        return plannedDate;
    }

    return formatCalendarDateInTimeZone(now, APP_TIME_ZONE);
}

export function resolveInitialActualTiming(
    actualStartAt?: string,
    plannedDate?: string,
    now: Date = new Date()
): InitialActualTiming {
    const parsedActualStart = resolveLocalDateAndTimeFromInstant(actualStartAt);

    if (parsedActualStart) {
        return {
            actualDate: parsedActualStart.actualDate,
            actualStartTime: parsedActualStart.actualStartTime,
        };
    }

    return {
        actualDate: resolveInitialActualDate(plannedDate, now),
        actualStartTime: "",
    };
}

function resolveLocalDateAndTimeFromInstant(value?: string): InitialActualTiming | null {
    if (!value || isDateOnly(value)) {
        return null;
    }

    const instant = new Date(value);
    if (Number.isNaN(instant.getTime())) {
        return null;
    }

    const date = formatCalendarDateInTimeZone(instant, APP_TIME_ZONE);
    const time = new Intl.DateTimeFormat("en-US", {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(instant);

    return {
        actualDate: date,
        actualStartTime: time,
    };
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
