import type { FhirEcogObservation } from "../schemas/ecog-assessment.schema";
import type { EcogAssessment } from "../../../domain/assessments/ecog-assessment";
import { computeEcogPerformanceLevel } from "../../../domain/assessments/ecog-assessment";

/**
 * TODO: These helpers are duplicated across assessment mappers and should be
 * extracted into a shared utility.
 */
function extractEncounterId(ref?: string): string {
    if (typeof ref !== "string" || !ref.includes("/")) {
        return "";
    }

    const parts = ref.split("/");
    return parts[parts.length - 1] || "";
}

function extractPatientId(ref?: string): string {
    if (typeof ref !== "string" || !ref.includes("/")) {
        return "";
    }

    const parts = ref.split("/");
    return parts[parts.length - 1] || "";
}

function extractDate(effectiveDateTime?: string, issued?: string): string {
    if (typeof effectiveDateTime === "string" && effectiveDateTime.trim() !== "") {
        return effectiveDateTime;
    }

    if (typeof issued === "string" && issued.trim() !== "") {
        return issued;
    }

    return "";
}

function extractPerformer(
    performer?: Array<{ reference?: string; display?: string }>
): { id: string; display: string } | undefined {
    if (!Array.isArray(performer) || performer.length === 0) {
        return;
    }

    const first = performer[0];
    if (typeof first?.reference !== "string" || !first.reference.includes("/")) {
        return;
    }

    const parts = first.reference.split("/");

    return {
        id: parts[parts.length - 1] || "",
        display: typeof first.display === "string" ? first.display : "",
    };
}

export function mapFhirEcogToDomain(resource: FhirEcogObservation): EcogAssessment {
    const encounterId = extractEncounterId(resource.encounter?.reference);
    const patientId = extractPatientId(resource.subject?.reference);
    const date = extractDate(resource.effectiveDateTime, resource.issued);
    const recordedBy = extractPerformer(resource.performer);

    // Default to 0 when valueInteger is missing to keep mapping total and safe.
    const score = typeof resource.valueInteger === "number" ? resource.valueInteger : 0;
    const performanceLevel = computeEcogPerformanceLevel(score);

    return {
        id: resource.id,
        encounterId,
        patientId,
        date,
        score,
        performanceLevel,
        recordedBy,
    };
}
