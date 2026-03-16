import { FhirClient, HttpError } from "../../../../lib/fhir/fhir-client";
import { safeGetResources } from "../../../../lib/fhir/bundle-utils";
import {
    fhirEcogObservationSchema,
    FhirEcogObservation,
} from "../../schemas/assessments/ecog-assessment.schema";
import { mapFhirEcogToDomain } from "../../mappers/assessments/ecog-assessment.mapper";

import type { EcogAssessmentRepository } from "../../../../domain/assessments/ecog-assessment.repository";
import type { EcogAssessment } from "../../../../domain/assessments/ecog-assessment";

/**
 * FHIR-backed repository for ECOG assessments.
 *
 * Only Observation resources categorized as "survey" and coded with
 * LOINC 89247-1 are requested, which effectively filters the server
 * response to ECOG assessments. Incoming resources are individually
 * validated against a Zod schema; invalid or unexpected entries are
 * silently skipped so a malformed bundle does not break retrieval.
 */
export class EcogAssessmentFhirRepository implements EcogAssessmentRepository {
    constructor(private client: FhirClient) { }

    private parseObservation(obj: unknown): FhirEcogObservation | null {
        const parsed = fhirEcogObservationSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    /**
     * Return the ECOG assessment associated with a particular encounter, if any.
     * Invalid resources are silently skipped during schema validation.
     */
    public async findByEncounterId(
        encounterId: string
    ): Promise<EcogAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                encounter: `Encounter/${encounterId}`,
                code: "89247-1",
                category: "survey",
            });

            const resources = safeGetResources(bundle);
            for (const res of resources) {
                const obs = this.parseObservation(res);
                if (!obs) continue;
                return mapFhirEcogToDomain(obs);
            }

            return null;
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Return the latest ECOG assessment for a patient.
     * Uses FHIR sort by date descending and returns the first valid match;
     * invalid resources are silently skipped.
     */
    public async findLatestByPatientId(
        patientId: string
    ): Promise<EcogAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                subject: `Patient/${patientId}`,
                code: "89247-1",
                category: "survey",
                _sort: "-date",
                _count: "1",
            });

            const resources = safeGetResources(bundle);
            for (const res of resources) {
                const obs = this.parseObservation(res);
                if (!obs) continue;
                return mapFhirEcogToDomain(obs);
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
