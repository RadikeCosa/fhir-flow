import type { FhirCarePlan, FhirGoal } from "../schemas/plan-of-care.schema";
import type {
    PlanOfCare,
    CareGoal,
    CareGoalStatus,
    CareGoalCategory,
    PlannedActivity,
    ActivityStatus,
    PlanOfCareStatus,
} from "../../../domain/plan-of-care/plan-of-care";
import { extractId } from "./shared/extract-helpers";

/**
 * Prefer the primary date; fall back to the secondary date; otherwise empty.
 */
function mapPlanStatus(status?: string): PlanOfCareStatus {
    switch (status) {
        case "draft":
        case "active":
        case "completed":
            return status;
        case "revoked":
            return "cancelled";
        default:
            return "draft";
    }
}

function mapGoalStatus(status?: string): CareGoalStatus {
    switch (status) {
        case "proposed":
        case "accepted":
        case "active":
        case "completed":
        case "cancelled":
            return status;
        default:
            return "proposed";
    }
}

function mapGoalCategory(extensions?: FhirGoal["extension"]): CareGoalCategory {
    if (!Array.isArray(extensions) || extensions.length === 0) return "short-term";

    const found = extensions.find((ext) =>
        typeof ext?.url === "string" && ext.url.includes("goal-category")
    );
    const raw =
        (found &&
            (typeof found.valueCode === "string"
                ? found.valueCode
                : typeof found.valueString === "string"
                    ? found.valueString
                    : undefined)) || "";

    switch (raw) {
        case "short-term":
            return "short-term";
        case "long-term":
            return "long-term";
        default:
            return "short-term";
    }
}

function mapActivityStatus(status?: string): ActivityStatus {
    switch (status) {
        case "not-started":
        case "in-progress":
        case "completed":
        case "cancelled":
            return status;
        default:
            return "not-started";
    }
}

function mapGoalToCareGoal(goal: FhirGoal): CareGoal {
    const description = goal.description?.text ?? "";

    const targetDate = Array.isArray(goal.target) && goal.target.length > 0
        ? goal.target[0]?.dueDate ?? ""
        : "";

    return {
        id: goal.id,
        description,
        category: mapGoalCategory(goal.extension),
        status: mapGoalStatus(goal.lifecycleStatus),
        targetDate: targetDate || undefined,
    };
}

type FhirCarePlanActivity = {
    detail?: {
        status?: string;
        description?: string;
        scheduledTiming?: {
            repeat?: {
                frequency?: number;
                period?: number;
                periodUnit?: string;
            };
        };
    };
} & Record<string, unknown>;

function mapActivity(activity: FhirCarePlanActivity, index: number): PlannedActivity | null {
    const detail = activity?.detail;
    if (!detail) return null;

    const status = mapActivityStatus(detail.status);
    const description = detail.description ?? "";

    const repeat = detail.scheduledTiming?.repeat;
    const frequencyPerWeek =
        repeat?.periodUnit === "wk" && typeof repeat.frequency === "number"
            ? repeat.frequency
            : undefined;

    return {
        id: `activity-${index}`,
        description,
        status,
        frequencyPerWeek,
    };
}

/**
 * Map a validated FHIR CarePlan + resolved Goal resources into the domain PlanOfCare.
 */
export function mapFhirCarePlanToDomain(
    carePlan: FhirCarePlan,
    goals: FhirGoal[]
): PlanOfCare {
    const patientId = extractId(carePlan.subject?.reference);
    const encounterId = extractId(carePlan.encounter?.reference);
    const authorId = carePlan.author?.reference
        ? extractId(carePlan.author.reference)
        : undefined;

    // TODO: CarePlan doesn't reliably include episodeOfCare; repository layer may
    // need to resolve it via encounters or other linked resources.
    const episodeOfCareId = "";

    const periodStart = carePlan.period?.start || "";
    const periodEnd = carePlan.period?.end;

    const clinicalReasoning =
        Array.isArray(carePlan.note) && carePlan.note.length > 0
            ? carePlan.note[0]?.text ?? undefined
            : undefined;

    const activities = Array.isArray(carePlan.activity)
        ? carePlan.activity.map(mapActivity).filter((a): a is PlannedActivity => a !== null)
        : [];

    const mappedGoals = Array.isArray(goals)
        ? goals.map(mapGoalToCareGoal)
        : [];

    const authorName = carePlan.author?.display ?? "";

    return {
        id: carePlan.id,
        status: mapPlanStatus(carePlan.status),
        patientId,
        episodeOfCareId,
        encounterId,
        periodStart,
        periodEnd,
        goals: mappedGoals,
        activities,
        clinicalReasoning,
        authorId,
        authorName,
        createdAt: carePlan.created ?? "",
    };
}
