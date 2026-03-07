import { FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetResources } from "../../../lib/fhir/bundle-utils";
import { fhirEvaObservationSchema, type FhirEvaObservation } from "../schemas/assessments/eva-assessment.schema";
import { mapFhirObservationsToEvaAssessments } from "../mappers/assessments/eva-assessment.mapper";

import type { AssessmentRepository } from "../../../domain/assessments/assessment.repository";
import type { EvaAssessment } from "../../../domain/assessments/eva-assessment";

/**
 * FHIR-backed repository for EVA assessments.
 *
 * Only Observation resources categorized as "survey" and coded with
 * LOINC 72514-3 are requested, which effectively filters the server
 * response to EVA assessments. Incoming resources are individually
 * validated against a Zod schema; invalid or unexpected entries are
 * silently dropped to prevent a malformed bundle from crashing the
 * retrieval logic.
 */
export class EvaAssessmentFhirRepository implements AssessmentRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    public async findEvaByPatientId(patientId: string): Promise<EvaAssessment[]> {
        const bundle = await this.client.search<unknown>("Observation", {
            subject: `Patient/${patientId}`,
            code: "72514-3",
            category: "survey",
            _sort: "-date",
            _count: "100",
        });

        const resources = safeGetResources(bundle);
        const valid: FhirEvaObservation[] = [];

        for (const res of resources) {
            const parsed = fhirEvaObservationSchema.safeParse(res);
            if (parsed.success) {
                valid.push(parsed.data);
            }
        }

        return mapFhirObservationsToEvaAssessments(valid, patientId);
    }

    /**
     * Load EVA observations constrained to a particular encounter.
     * Filtering, validation and mapping mirror `findEvaByPatientId`;
     * only the search parameter differs.
     */
    public async findEvaByEncounterId(encounterId: string): Promise<EvaAssessment[]> {
        const bundle = await this.client.search<unknown>("Observation", {
            code: "72514-3",
            encounter: `Encounter/${encounterId}`,
            category: "survey",
            _sort: "-date",
            _count: "100",
        });

        const resources = safeGetResources(bundle);
        const valid: FhirEvaObservation[] = [];

        for (const res of resources) {
            const parsed = fhirEvaObservationSchema.safeParse(res);
            if (parsed.success) {
                valid.push(parsed.data);
            }
        }

        // patientId not strictly needed by mapper but required by its signature
        let patientId = "";
        if (valid.length > 0 && valid[0].subject?.reference) {
            const parts = valid[0].subject.reference.split("/");
            patientId = parts[parts.length - 1] || "";
        }

        return mapFhirObservationsToEvaAssessments(valid, patientId);
    }
}
