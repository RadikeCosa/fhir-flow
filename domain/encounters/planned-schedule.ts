export type PlannedSchedule =
    | {
        kind: "date";
        plannedDate: string;
    }
    | {
        kind: "datetime";
        plannedDate: string;
        plannedTime: string;
        plannedAtUtc: string;
    };
