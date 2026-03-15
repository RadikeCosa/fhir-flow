import type { FhirNecpalObservation } from "../../schemas/assessments/necpal-assessment.schema";
import type {
    NecpalAssessment,
    NecpalIndicator,
    NecpalResult,
} from "../../../../domain/assessments/necpal-assessment";
import { computeNecpalResult } from "../../../../domain/assessments/necpal-assessment";
import {
    extractEncounterId,
    extractPatientId,
    extractPerformer,
    extractDate,
} from "../shared/extract-helpers";

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
