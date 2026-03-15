import type { FhirNecpalObservation } from "../../schemas/assessments/necpal-assessment.schema";
import type {
    NecpalAssessment,
    NecpalIndicator,
    NecpalResult,
} from "../../../../domain/assessments/necpal-assessment";
import { computeNecpalResult } from "../../../../domain/assessments/necpal-assessment";

// TODO: These helper functions are duplicated in other mappers (e.g., barthel-assessment.mapper.ts).
// Consider extracting shared mapper helpers into a common utility file.

/**
 * Map the first part of a reference like `Encounter/123` to the id portion.
 */
function extractEncounterId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}

/**
 * Map the first part of a reference like `Patient/123` to the id portion.
 */
function extractPatientId(ref?: string): string {
    if (typeof ref !== "string") return "";
    const parts = ref.split("/");
    return parts.length > 1 ? parts[1] : "";
}

/**
 * Extract a simple performer object from the first performer entry.
 */
function extractPerformer(
    performer?: FhirNecpalObservation["performer"]
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

function extractIndicators(
    components?: FhirNecpalObservation["component"]
): NecpalIndicator {
    const SURPRISE_CODE = "surprise-question";
    const DEMAND_CODE = "demand-indicator";
    const NEED_CODE = "need-indicator";
    const DISEASE_CODE = "disease-indicator";

    const defaults: NecpalIndicator = {
        surpriseQuestion: false,
        demandIndicator: false,
        needIndicator: false,
        diseaseIndicator: false,
    };

    if (!Array.isArray(components) || components.length === 0) {
        return defaults;
    }

    const findValue = (codeToMatch: string): boolean => {
        const match = components.find((component) => {
            const coding = Array.isArray(component?.code?.coding)
                ? component.code.coding
                : undefined;
            const first = coding?.[0] as { code?: unknown } | undefined;
            const rawCode = typeof first?.code === "string" ? first.code : undefined;
            return rawCode === codeToMatch;
        });
        const value = match?.valueBoolean;
        return typeof value === "boolean" ? value : false;
    };

    return {
        surpriseQuestion: findValue(SURPRISE_CODE),
        demandIndicator: findValue(DEMAND_CODE),
        needIndicator: findValue(NEED_CODE),
        diseaseIndicator: findValue(DISEASE_CODE),
    };
}

export function mapFhirNecpalToDomain(
    resource: FhirNecpalObservation
): NecpalAssessment {
    const patientId = extractPatientId(resource.subject?.reference);
    const encounterId = extractEncounterId(resource.encounter?.reference);
    const date = extractDate(resource.effectiveDateTime, resource.issued);
    const recordedBy = extractPerformer(resource.performer);
    const indicators = extractIndicators(resource.component);

    const derivedPositiveScreen = indicators.surpriseQuestion === false;
    const derivedResult = computeNecpalResult(indicators.surpriseQuestion);

    const positiveScreen =
        typeof resource.valueBoolean === "boolean"
            ? resource.valueBoolean
            : derivedPositiveScreen;

    const result: NecpalResult =
        typeof resource.valueBoolean === "boolean"
            ? resource.valueBoolean
                ? "positive"
                : "negative"
            : derivedResult;

    return {
        id: resource.id,
        encounterId,
        patientId,
        date,
        recordedBy,
        indicators,
        positiveScreen,
        result,
    };
}
