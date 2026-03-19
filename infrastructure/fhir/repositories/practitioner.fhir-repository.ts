import { HttpError, FhirClient } from "../../../lib/fhir/fhir-client";
import { Logger, defaultLogger } from "../../../lib/logger";
import { mapFhirPractitionerToPractitioner } from "../mappers/practitioner.mapper";
import {
    fhirPractitionerSchema,
    type FhirPractitionerResource,
} from "../schemas/practitioner.schema";
import type { Practitioner } from "../../../domain/practitioners/practitioner";
import type { PractitionerRepository } from "../../../domain/practitioners/practitioner.repository";

export class PractitionerFhirRepository implements PractitionerRepository {
    private readonly logger: Logger;

    constructor(private client: FhirClient, logger: Logger = defaultLogger) {
        this.logger = logger;
    }

    private parseAndMap(resource: unknown): Practitioner | null {
        const parsed = fhirPractitionerSchema.safeParse(resource);
        if (parsed.success) {
            return mapFhirPractitionerToPractitioner(parsed.data as FhirPractitionerResource);
        }

        const record = resource as Record<string, unknown>;
        this.logger.warn("[PractitionerFhirRepository] Practitioner validation failed", {
            resourceType: record.resourceType,
            id: record.id,
            errors: parsed.error.flatten(),
        });

        return null;
    }

    public async findById(id: string): Promise<Practitioner | null> {
        try {
            const res = await this.client.read<FhirPractitionerResource>("Practitioner", id);
            return this.parseAndMap(res);
        } catch (err) {
            if (err instanceof HttpError && err.status === 404) {
                return null;
            }

            throw err;
        }
    }
}
