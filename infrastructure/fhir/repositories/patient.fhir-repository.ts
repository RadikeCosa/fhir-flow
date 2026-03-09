import { HttpError, FhirClient } from "../../../lib/fhir/fhir-client";
import { safeGetEntries, getBundleTotal, getPaginationLinks } from "../../../lib/fhir/bundle-utils";
import { fhirPatientSchema, FhirPatientResource } from "../schemas/patient.schema";
import { mapFhirPatientToPatient } from "../mappers/patient.mapper";

import type {
    PatientRepository,
    PatientQuery,
    PaginatedResult,
} from "../../../domain/patients/patient.repository";
import type { Patient } from "../../../domain/patients/patient";

/**
 * Parameters used when calling FHIR search for patients. Typed explicitly
 * to avoid generic records in the implementation.
 */
type FhirSearchParams = {
    name?: string;
    identifier?: string;
    _count?: number;
    _offset?: number;
};

/**
 * FHIR-based implementation of the `PatientRepository` contract.
 *
 * Orchestrates network calls, validation and mapping from raw FHIR
 * resources into the domain `Patient` model. All infrastructure concerns
 * are confined here; callers depend only on the domain interface.
 */
export class PatientFhirRepository implements PatientRepository {
    /** HTTP client used to talk to FHIR server; inject for easier testing. */
    constructor(private client: FhirClient = new FhirClient()) { }

    /**
     * Central helper: validate and map a raw resource into domain model.
     * Returns `null` if validation fails.
     */
    private parseAndMap(resource: unknown): Patient | null {
        const parsed = fhirPatientSchema.safeParse(resource);
        if (!parsed.success) return null;
        return mapFhirPatientToPatient(parsed.data);
    }

    /**
     * Build FHIR search parameters from a domain query object.
     */
    private buildSearchParams(query?: PatientQuery): FhirSearchParams {
        const params: FhirSearchParams = {};
        if (!query) return params;

        const f = query.filters;
        if (f) {
            if (f.name) params.name = f.name;
            if (f.identifier) params.identifier = f.identifier;
        }

        const p = query.pagination;
        if (p) {
            const page = p.page && p.page >= 1 ? p.page : 1;
            const count = p.pageSize;
            if (count !== undefined) params._count = count;
            if (count !== undefined) {
                params._offset = (page - 1) * count;
                if (params._offset < 0) params._offset = 0;
            }
        }

        return params;
    }

    /**
     * Retrieve a patient by domain id. Returns `null` when not found or when
     * the FHIR resource does not pass schema validation.
     */
    public async findById(id: string): Promise<Patient | null> {
        try {
            const res = await this.client.read<FhirPatientResource>("Patient", id);
            return this.parseAndMap(res);
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Execute a query over patients using FHIR search parameters.
     */
    public async findMany(query?: PatientQuery): Promise<PaginatedResult<Patient>> {
        const params = this.buildSearchParams(query);

        const bundle = await this.client.search<unknown>("Patient", params);

        const entries = safeGetEntries(bundle);
        const items: Patient[] = [];

        for (const e of entries) {
            if (e.resource) {
                const mapped = this.parseAndMap(e.resource);
                if (mapped) items.push(mapped);
            }
        }

        const total = getBundleTotal(bundle);
        const links = getPaginationLinks(bundle);

        return {
            items,
            total,
            nextUrl: links.next,
        };
    }
}
