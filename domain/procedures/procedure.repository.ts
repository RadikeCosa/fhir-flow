/**
 * Repository interface declarations for procedures within the domain layer.
 *
 * These interfaces are intentionally simple and infrastructure-agnostic.  The
 * domain layer uses the repository contract to retrieve procedure data without
 * knowing whether it comes from FHIR, a database, or any other source.
 */

import type { Procedure } from "./procedure";

/**
 * Domain-level contract for reading procedure records.
 */
export interface ProcedureRepository {
    /**
     * Return all procedures associated with the given encounter.
     *
     * Implementations are responsible for mapping external representations
     * into the domain `Procedure` type.
     */
    findAllByEncounterId(encounterId: string): Promise<Procedure[]>;

    /**
     * Return all procedures for the specified patient across all encounters.
     */
    findAllByPatientId(patientId: string): Promise<Procedure[]>;
}
