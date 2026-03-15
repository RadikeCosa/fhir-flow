import type { FhirBarthelObservation } from "../../schemas/assessments/barthel-assessment.schema";
import type {
    BarthelAssessment,
    BarthelActivityKey,
    BarthelItem,
} from "../../../../domain/assessments/barthel-assessment";
import { computeBarthelFunctionalLevel } from "../../../../domain/assessments/barthel-assessment";

/**
 * Map the first part of a reference like `Encounter/123` to the id portion.
 */
function extractEncounterId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}

/**
 * Extract a simple performer object from the first performer entry.
 */
function extractPerformer(
    performer?: FhirBarthelObservation["performer"]
): { id: string; display: string } | undefined {
    if (!Array.isArray(performer) || performer.length === 0) return undefined;
    const first = performer[0];
    const reference = first?.reference;
    if (typeof reference !== "string") return undefined;
    const parts = reference.split("/");
    const id = parts.length > 1 ? parts[1] : "";
    const display = typeof first.display === "string" ? first.display : "";
    return { id, display };
}

/**
 * Prefer effectiveDateTime, then issued, else empty string.
 */
function extractDate(effectiveDateTime?: string, issued?: string): string {
    if (typeof effectiveDateTime === "string" && effectiveDateTime.trim() !== "") {
        return effectiveDateTime;
    }
    if (typeof issued === "string" && issued.trim() !== "") {
        return issued;
    }
    return "";
}

const BARTHEL_MAX_SCORES: Record<BarthelActivityKey, number> = {
    feeding: 10,
    bathing: 5,
    grooming: 5,
    dressing: 10,
    bowel: 10,
    bladder: 10,
    toilet: 10,
    transfer: 15,
    mobility: 15,
    stairs: 10,
};

function isBarthelActivityKey(value: unknown): value is BarthelActivityKey {
    return (
        value === "feeding" ||
        value === "bathing" ||
        value === "grooming" ||
        value === "dressing" ||
        value === "bowel" ||
        value === "bladder" ||
        value === "toilet" ||
        value === "transfer" ||
        value === "mobility" ||
        value === "stairs"
    );
}

function mapComponentToItem(component: unknown): BarthelItem | null {
    if (!component || typeof component !== "object") return null;
    const comp = component as {
        code?: { coding?: unknown; text?: unknown };
        valueInteger?: unknown;
    };

    const coding = Array.isArray(comp.code?.coding) ? comp.code.coding : undefined;
    const firstCoding = coding?.[0] as { code?: unknown; display?: unknown } | undefined;
    const rawActivity = firstCoding?.code;
    if (!isBarthelActivityKey(rawActivity)) return null;

    const score = typeof comp.valueInteger === "number" ? comp.valueInteger : 0;

    const displayMax = typeof firstCoding?.display === "string" ? Number(firstCoding.display) : NaN;
    const maxScoreFromDisplay = Number.isFinite(displayMax) ? displayMax : undefined;
    const maxScore =
        typeof maxScoreFromDisplay === "number"
            ? maxScoreFromDisplay
            : BARTHEL_MAX_SCORES[rawActivity];

    return {
        activity: rawActivity,
        score,
        maxScore,
    };
}

export function mapFhirBarthelToDomain(
    resource: FhirBarthelObservation
): BarthelAssessment {
    const patientId = (() => {
        const ref = resource.subject?.reference;
        if (typeof ref !== "string") return "";
        const parts = ref.split("/");
        return parts.length > 1 ? parts[1] : "";
    })();

    const encounterId = extractEncounterId(resource.encounter?.reference);
    const date = extractDate(resource.effectiveDateTime, resource.issued);
    const recordedBy = extractPerformer(resource.performer);

    const items = Array.isArray(resource.component)
        ? resource.component
            .map(mapComponentToItem)
            .filter((item): item is BarthelItem => item !== null)
        : [];

    const totalScore =
        typeof resource.valueInteger === "number"
            ? resource.valueInteger
            : items.reduce((sum, item) => sum + item.score, 0);

    const functionalLevel = computeBarthelFunctionalLevel(totalScore);

    return {
        id: resource.id,
        encounterId,
        patientId,
        date,
        totalScore,
        functionalLevel,
        items,
        recordedBy,
    };
}
