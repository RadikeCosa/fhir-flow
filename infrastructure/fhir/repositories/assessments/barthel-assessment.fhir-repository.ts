import { FhirClient, HttpError } from "../../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../../lib/logger";
import { safeGetResources } from "../../../../lib/fhir/bundle-utils";
import {
    fhirBarthelObservationSchema,
    FhirBarthelObservation,
} from "../../schemas/assessments/barthel-assessment.schema";
import { mapFhirBarthelToDomain } from "../../mappers/assessments/barthel-assessment.mapper";

import type { BarthelAssessmentRepository } from "../../../../domain/assessments/barthel-assessment.repository";
import type { BarthelAssessment } from "../../../../domain/assessments/barthel-assessment";

/**
 * FHIR-based implementation of the `BarthelAssessmentRepository` contract.
 */
export class BarthelAssessmentFhirRepository implements BarthelAssessmentRepository {
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    private parseObservation(obj: unknown): FhirBarthelObservation | null {
        const parsed = fhirBarthelObservationSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[BarthelAssessmentFhirRepository] Observation validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    public async findByEncounterId(encounterId: string): Promise<BarthelAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                encounter: `Encounter/${encounterId}`,
                code: "96761-6",
            });

            const resources = safeGetResources(bundle);
            for (const res of resources) {
                const obs = this.parseObservation(res);
                if (!obs) continue;
                return mapFhirBarthelToDomain(obs);
            }

            return null;
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }

    public async findLatestByPatientId(patientId: string): Promise<BarthelAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                subject: `Patient/${patientId}`,
                code: "96761-6",
                _sort: "-date",
                _count: "1",
            });

            const resources = safeGetResources(bundle);
            for (const res of resources) {
                const obs = this.parseObservation(res);
                if (!obs) continue;
                return mapFhirBarthelToDomain(obs);
            }

            return null;
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }
}
