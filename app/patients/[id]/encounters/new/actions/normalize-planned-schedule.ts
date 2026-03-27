import type { PlannedSchedule } from "../../../../../../domain/encounters/planned-schedule";
import { composeLocalDateTimeToUtcIso } from "../../../../../../lib/date-time/date-time.utils";

interface NormalizePlannedScheduleInput {
    plannedDate: string;
    plannedTime?: string;
}

export function normalizePlannedSchedule({
    plannedDate,
    plannedTime,
}: NormalizePlannedScheduleInput): PlannedSchedule {
    if (!plannedTime) {
        return {
            kind: "date",
            plannedDate,
        };
    }

    return {
        kind: "datetime",
        plannedDate,
        plannedTime,
        plannedAtUtc: composeLocalDateTimeToUtcIso(plannedDate, plannedTime),
    };
}
