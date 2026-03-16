import type { FhirEcogObservation } from "../../schemas/assessments/ecog-assessment.schema";
import type { EcogAssessment } from "../../../../domain/assessments/ecog-assessment";
import { computeEcogPerformanceLevel } from "../../../../domain/assessments/ecog-assessment";
import {
    extractEncounterId,
    extractPatientId,
    extractPerformer,
    extractDate,
} from "../shared/extract-helpers";

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
        type: "ecog" as const,
        encounterId,
        patientId,
        date,
        score,
        performanceLevel,
        recordedBy,
    };
}
