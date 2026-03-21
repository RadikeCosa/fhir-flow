export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function isDateOnly(value?: string): boolean {
    if (!value) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function hasTimeComponent(value?: string): boolean {
    if (!value) return false;
    return value.includes("T");
}

export function isValidLocalTimeString(value?: string): boolean {
    if (!value) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export interface LocalDateTimePayload {
    plannedDate: string;
    plannedTime?: string;
}

export function formatCalendarDateInTimeZone(
    date: Date,
    timeZone: string = APP_TIME_ZONE
): string {
    const parts = formatToPartsInTimeZone(date.getTime(), timeZone);
    const month = String(parts.month).padStart(2, "0");
    const day = String(parts.day).padStart(2, "0");
    return `${parts.year}-${month}-${day}`;
}

export function parsePlannedDateAndTime(
    value?: string,
    timeZone: string = APP_TIME_ZONE
): LocalDateTimePayload | undefined {
    if (!value) return undefined;

    if (isDateOnly(value)) {
        return { plannedDate: value };
    }

    if (!hasTimeComponent(value)) return undefined;

    const datetimeMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (datetimeMatch) {
        return {
            plannedDate: datetimeMatch[1],
            plannedTime: datetimeMatch[2],
        };
    }

    // Fallback: try to parse using date object and app timezone as a best effort.
    const instant = new Date(value);
    if (isNaN(instant.getTime())) return undefined;

    const parts = formatToPartsInTimeZone(instant.getTime(), timeZone);

    const month = String(parts.month).padStart(2, "0");
    const day = String(parts.day).padStart(2, "0");
    const hour = String(parts.hour).padStart(2, "0");
    const minute = String(parts.minute).padStart(2, "0");

    return {
        plannedDate: `${parts.year}-${month}-${day}`,
        plannedTime: `${hour}:${minute}`,
    };
}

interface DateTimeParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

function parseLocalDateTime(date: string, time: string): DateTimeParts {
    const dateMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date);
    if (!dateMatch) {
        throw new Error(`Invalid date-only value: ${date}`);
    }

    const timeMatch = /^([0-9]{2}):([0-9]{2})$/.exec(time);
    if (!timeMatch) {
        throw new Error(`Invalid local time value: ${time}`);
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(hour) || Number.isNaN(minute)) {
        throw new Error(`Invalid date or time values: ${date} ${time}`);
    }

    return { year, month, day, hour, minute, second: 0 };
}

function formatToPartsInTimeZone(utcMs: number, timeZone: string): DateTimeParts {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    const parts = dtf.formatToParts(new Date(utcMs));
    const map: Partial<DateTimeParts> = {};

    for (const item of parts) {
        if (item.type === "year") map.year = Number(item.value);
        if (item.type === "month") map.month = Number(item.value);
        if (item.type === "day") map.day = Number(item.value);
        if (item.type === "hour") map.hour = Number(item.value);
        if (item.type === "minute") map.minute = Number(item.value);
        if (item.type === "second") map.second = Number(item.value);
    }

    if (
        map.year === undefined ||
        map.month === undefined ||
        map.day === undefined ||
        map.hour === undefined ||
        map.minute === undefined ||
        map.second === undefined
    ) {
        throw new Error(`Unable to resolve timezone parts for ${new Date(utcMs).toISOString()} in ${timeZone}`);
    }

    return map as DateTimeParts;
}

function isSameLocalTime(a: DateTimeParts, b: DateTimeParts): boolean {
    return (
        a.year === b.year &&
        a.month === b.month &&
        a.day === b.day &&
        a.hour === b.hour &&
        a.minute === b.minute &&
        a.second === b.second
    );
}

export function composeLocalDateTimeToUtcIso(
    localDate: string,
    localTime: string,
    timeZone: string = APP_TIME_ZONE
): string {
    if (!localDate || !localTime) {
        throw new Error("localDate and localTime are required");
    }

    const target = parseLocalDateTime(localDate, localTime);
    const targetUtcCandidateMs = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second, 0);

    let utcMs = targetUtcCandidateMs;

    for (let tries = 0; tries < 4; tries += 1) {
        const zoneParts = formatToPartsInTimeZone(utcMs, timeZone);
        const zonePartsUtcMs = Date.UTC(zoneParts.year, zoneParts.month - 1, zoneParts.day, zoneParts.hour, zoneParts.minute, zoneParts.second, 0);
        const offsetMs = zonePartsUtcMs - utcMs;

        const nextUtcMs = targetUtcCandidateMs - offsetMs;

        if (Math.abs(nextUtcMs - utcMs) < 1000) {
            utcMs = nextUtcMs;
            break;
        }

        utcMs = nextUtcMs;
    }

    const resultingParts = formatToPartsInTimeZone(utcMs, timeZone);
    if (!isSameLocalTime(resultingParts, target)) {
        throw new Error(`Local time ${localDate} ${localTime} does not exist in timezone ${timeZone} (DST gap?)`);
    }

    return new Date(utcMs).toISOString();
}
