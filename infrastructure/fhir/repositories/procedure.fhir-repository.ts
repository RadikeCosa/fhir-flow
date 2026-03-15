import { FhirClient, HttpError } from "../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../lib/logger";
import { safeGetResources } from "../../../lib/fhir/bundle-utils";
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
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    /**
     * Validate a raw object against the procedure schema. Returns the typed
     * resource or `null` when validation fails.
     */
    private parseProcedure(obj: unknown): FhirProcedure | null {
        const parsed = fhirProcedureSchema.safeParse(obj);
        if (parsed.success) return parsed.data;

        const record = obj as Record<string, unknown>;
        this.logger.warn("[ProcedureFhirRepository] Procedure validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });
        return null;
    }

    private async searchAndMapProcedures(params: Record<string, string>): Promise<Procedure[]> {
        const bundle = await this.client.search<unknown>("Procedure", params);
        const resources = safeGetResources(bundle);
        const results: Procedure[] = [];

        for (const res of resources) {
            const proc = this.parseProcedure(res);
            if (!proc) continue;

            const mapped = mapFhirProcedureToDomain(proc);
            if (mapped) results.push(mapped);
        }

        return results;
    }

    public async findAllByEncounterId(encounterId: string): Promise<Procedure[]> {
        try {
            return await this.searchAndMapProcedures({
                encounter: `Encounter/${encounterId}`,
                _sort: "date",
            });
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return [];
            }
            throw err;
        }
    }

    public async findAllByPatientId(patientId: string): Promise<Procedure[]> {
        try {
            return await this.searchAndMapProcedures({
                patient: patientId,
                _sort: "-date",
            });
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return [];
            }
            throw err;
        }
    }
}
