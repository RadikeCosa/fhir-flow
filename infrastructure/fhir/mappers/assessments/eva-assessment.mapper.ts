import type { FhirEvaObservation } from "../../schemas/assessments/eva-assessment.schema";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";
import { extractEncounterId, extractId } from "../shared/extract-helpers";

/**
 * Map raw FHIR Observation resources to the domain `EvaAssessment` type.
 *
 * The returned array is sorted in descending order by `date` so that the
 * most recent record is always at index 0.
 */
export function mapFhirObservationsToEvaAssessments(
    observations: FhirEvaObservation[]
): EvaAssessment[] {
    const results: EvaAssessment[] = [];

    for (const obs of observations) {
        const id = obs.id;
        const patientId = extractId(obs.subject?.reference);
        const encounterId = extractEncounterId(obs.encounter?.reference);

        // derive date from effectiveDateTime
        const dt = typeof obs.effectiveDateTime === "string" ? obs.effectiveDateTime : "";
        if (dt.length < 10) continue;
        const datePortion = dt.slice(0, 10);
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(datePortion)) continue;
        const date = dt;

        // pull score
        const score = typeof obs.valueInteger === "number" ? obs.valueInteger : undefined;
        if (typeof score !== "number") continue;

        // recordedBy (use first performer)
        const perf = Array.isArray(obs.performer) && obs.performer.length > 0 ? obs.performer[0] : undefined;
        let recordedByDisplay = "";
        let recordedById = "";
        if (perf) {
            recordedByDisplay = typeof perf.display === "string" ? perf.display : "";
            recordedById = extractId(perf.reference);
        }

        results.push({
            id,
            patientId,
            encounterId: encounterId || undefined,
            type: "eva",
            date,
            score,
            recordedBy: {
                id: recordedById || recordedByDisplay || "",
                display: recordedByDisplay || "Desconocido",
            },
        });
    }

    results.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return results;
}
