import { FhirClient, HttpError } from "../../../lib/fhir/fhir-client";
import { safeGetEntries } from "../../../lib/fhir/bundle-utils";
import type { FhirProcedure } from "../schemas/procedure.schema";
import { fhirProcedureSchema } from "../schemas/procedure.schema";
import { mapFhirProcedureToDomain } from "../mappers/procedure.mapper";

import type { ProcedureRepository } from "../../../domain/procedures/procedure.repository";
import type { Procedure } from "../../../domain/procedures/procedure";

/**
 * FHIR-based implementation of the `ProcedureRepository` domain contract.
 *
 * This class encapsulates HTTP interaction, validation, and mapping. It
 * never returns raw FHIR objects; invalid entries are silently discarded and
 * missing data results in empty lists rather than thrown errors.
 */
export class ProcedureFhirRepository implements ProcedureRepository {
    constructor(private client: FhirClient = new FhirClient()) { }

    /**
     * Validate a raw object against the procedure schema. Returns the typed
     * resource or `null` when validation fails.
     */
    private parseProcedure(obj: unknown): FhirProcedure | null {
        const parsed = fhirProcedureSchema.safeParse(obj);
        return parsed.success ? parsed.data : null;
    }

    public async findAllByEncounterId(encounterId: string): Promise<Procedure[]> {
        try {
            const bundle = await this.client.search<unknown>("Procedure", {
                encounter: `Encounter/${encounterId}`,
                _sort: "date",
            });

            const entries = safeGetEntries(bundle);
            const results: Procedure[] = [];

            for (const e of entries) {
                if (e.resource) {
                    const proc = this.parseProcedure(e.resource);
                    if (proc) {
                        const mapped = mapFhirProcedureToDomain(proc);
                        if (mapped) {
                            results.push(mapped);
                        }
                    }
                }
            }

            return results;
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return [];
            }
            throw err;
        }
    }

    public async findAllByPatientId(patientId: string): Promise<Procedure[]> {
        try {
            const bundle = await this.client.search<unknown>("Procedure", {
                patient: patientId,
                _sort: "-date",
            });

            const entries = safeGetEntries(bundle);
            const results: Procedure[] = [];

            for (const e of entries) {
                if (e.resource) {
                    const proc = this.parseProcedure(e.resource);
                    if (proc) {
                        const mapped = mapFhirProcedureToDomain(proc);
                        if (mapped) {
                            results.push(mapped);
                        }
                    }
                }
            }

            return results;
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return [];
            }
            throw err;
        }
    }
}
