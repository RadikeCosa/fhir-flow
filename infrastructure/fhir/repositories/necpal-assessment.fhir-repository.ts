import { FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetEntries } from "../../../lib/fhir/bundle-utils";
import {
    fhirNecpalObservationSchema,
    FhirNecpalObservation,
} from "../schemas/necpal-assessment.schema";
import { mapFhirNecpalToDomain } from "../mappers/necpal-assessment.mapper";

import type { NecpalAssessmentRepository } from "../../../domain/assessments/necpal-assessment.repository";
import type { NecpalAssessment } from "../../../domain/assessments/necpal-assessment";

/**
 * FHIR-based implementation of the `NecpalAssessmentRepository` contract.
 */
export class NecpalAssessmentFhirRepository implements NecpalAssessmentRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    private parseObservation(obj: unknown): FhirNecpalObservation | null {
        const parsed = fhirNecpalObservationSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    public async findByEncounterId(
        encounterId: string
    ): Promise<NecpalAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                encounter: `Encounter/${encounterId}`,
                code: "96779-8",
            });

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const obs = this.parseObservation(e.resource);
                if (!obs) continue;
                return mapFhirNecpalToDomain(obs);
            }

            return null;
        } catch {
            throw new Error(
                `Failed to fetch NECPAL assessment for encounter: ${encounterId}`
            );
        }
    }

    public async findLatestByPatientId(
        patientId: string
    ): Promise<NecpalAssessment | null> {
        try {
            const bundle = await this.client.search<unknown>("Observation", {
                subject: `Patient/${patientId}`,
                code: "96779-8",
                _sort: "-date",
                _count: "1",
            });

            const entries = safeGetEntries(bundle);
            for (const e of entries) {
                if (!e.resource) continue;
                const obs = this.parseObservation(e.resource);
                if (!obs) continue;
                return mapFhirNecpalToDomain(obs);
            }

            return null;
        } catch {
            throw new Error(
                `Failed to fetch latest NECPAL assessment for patient: ${patientId}`
            );
        }
    }
}
