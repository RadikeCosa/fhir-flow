import FhirClient, { type FhirResource } from "../../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../../lib/logger";
import { fetchAllPages } from "../../../../lib/fhir/bundle-utils";
import {
    fhirEvaObservationSchema,
    type FhirEvaObservation,
} from "../../schemas/assessments/eva-assessment.schema";
import { mapFhirObservationsToEvaAssessments } from "../../mappers/assessments/eva-assessment.mapper";

import type { AssessmentRepository } from "../../../../domain/assessments/assessment.repository";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";

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
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    private parseObservation(obj: unknown): FhirEvaObservation | null {
        const parsed = fhirEvaObservationSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[EvaAssessmentFhirRepository] Observation validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    public async findEvaByPatientId(patientId: string): Promise<EvaAssessment[]> {
        const bundle = await this.client.search<unknown>("Observation", {
            subject: `Patient/${patientId}`,
            code: "72514-3",
            category: "survey",
            _sort: "-date",
            _count: "50",
        });

        const resources = await fetchAllPages<FhirResource>(this.client, bundle);
        const valid: FhirEvaObservation[] = [];

        for (const res of resources) {
            const parsed = this.parseObservation(res);
            if (parsed) {
                valid.push(parsed);
            }
        }

        return mapFhirObservationsToEvaAssessments(valid);
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
            _count: "50",
        });

        const resources = await fetchAllPages<FhirResource>(this.client, bundle);
        const valid: FhirEvaObservation[] = [];

        for (const res of resources) {
            const parsed = this.parseObservation(res);
            if (parsed) {
                valid.push(parsed);
            }
        }

        return mapFhirObservationsToEvaAssessments(valid);
    }
}
