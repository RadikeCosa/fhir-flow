import { FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetResources } from "../../../lib/fhir/bundle-utils";
import { fhirVitalSignObservationSchema, type FhirVitalSignObservation } from "../schemas/vital-sign.schema";
import { mapFhirObservationsToVitalSignRecords } from "../mappers/vital-sign.mapper";

import type {
    VitalSignRecordRepository,
} from "../../../domain/vital-sign-record/vital-sign-record.repository";
import type { VitalSignRecord } from "../../../domain/vital-sign-record/vital-sign-record";

/**
 * FHIR-based implementation of the `VitalSignRecordRepository` contract.
 *
 * This class is responsible for querying the FHIR server for Observation
 * resources in the "vital-signs" category, validating each resource against
 * a Zod schema, and then mapping the validated objects into the simple
 * domain model. Invalid resources are ignored rather than causing an
 * error, and both `_sort` and `_count` parameters are supplied to the
 * server to reduce client-side iteration.
 */
export class VitalSignRecordFhirRepository implements VitalSignRecordRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    /**
     * Retrieve all vital sign records for a patient, sorted by date
     * descending.  Invalid or unrecognised Observation resources are
     * skipped.  See mapper for grouping logic.
     */
    public async findAllByPatientId(patientId: string): Promise<VitalSignRecord[]> {
        const bundle = await this.client.search<unknown>("Observation", {
            subject: `Patient/${patientId}`,
            category: "vital-signs",
            _sort: "-date",
            _count: "100",
        });

        const resources = safeGetResources(bundle);
        // only keep observations that pass schema validation; type explicitly
        const valid: FhirVitalSignObservation[] = [];

        for (const res of resources) {
            const parsed = fhirVitalSignObservationSchema.safeParse(res);
            if (parsed.success) {
                valid.push(parsed.data);
            }
        }

        return mapFhirObservationsToVitalSignRecords(valid, patientId);
    }

    /**
     * Retrieve vital sign records for a given encounter.  Behaves like the
     * patient-based query but uses an encounter filter instead.  The
     * returned observations are validated and grouped in the same manner;
     * patientId is inferred from the first valid observation (if present).
     */
    public async findAllByEncounterId(encounterId: string): Promise<VitalSignRecord[]> {
        const bundle = await this.client.search<unknown>("Observation", {
            encounter: `Encounter/${encounterId}`,
            category: "vital-signs",
            _sort: "-date",
            _count: "100",
        });

        const resources = safeGetResources(bundle);
        const valid: FhirVitalSignObservation[] = [];

        for (const res of resources) {
            const parsed = fhirVitalSignObservationSchema.safeParse(res);
            if (parsed.success) {
                valid.push(parsed.data);
            }
        }

        if (valid.length === 0) {
            return [];
        }

        // Try to extract patientId from first observation's subject reference.
        // `subject` is passthrough-typed from Zod, so we narrow safely first.
        let patientId = "";
        const subj = valid[0].subject;
        if (subj && typeof subj === "object" && "reference" in subj) {
            const reference = (subj as { reference?: unknown }).reference;
            if (typeof reference === "string") {
                const parts = reference.split("/");
                patientId = parts[parts.length - 1] || "";
            }
        }

        return mapFhirObservationsToVitalSignRecords(valid, patientId);
    }
}
