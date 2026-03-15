import { FhirClient } from "../../../../lib/fhir/fhir-client";
import { safeGetEntries } from "../../../../lib/fhir/bundle-utils";
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
    constructor(private client: FhirClient = new FhirClient()) { }

    private parseObservation(obj: unknown): FhirBarthelObservation | null {
        const parsed = fhirBarthelObservationSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    public async findByEncounterId(encounterId: string): Promise<BarthelAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                encounter: `Encounter/${encounterId}`,
                code: "96761-6",
            });

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const obs = this.parseObservation(e.resource);
                if (!obs) continue;
                return mapFhirBarthelToDomain(obs);
            }

            return null;
        } catch {
            throw new Error(
                `Failed to fetch Barthel assessment for encounter: ${encounterId}`
            );
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

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const obs = this.parseObservation(e.resource);
                if (!obs) continue;
                return mapFhirBarthelToDomain(obs);
            }

            return null;
        } catch {
            throw new Error(
                `Failed to fetch latest Barthel assessment for patient: ${patientId}`
            );
        }
    }
}
