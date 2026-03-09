import { FhirClient } from "../../../lib/fhir/fhir-client";
import { ProcedureFhirRepository } from "../repositories/procedure.fhir-repository";
import type { ProcedureRepository } from "../../../domain/procedures/procedure.repository";

/**
 * Factory that produces a FHIR-backed ProcedureRepository instance.
 *
 * The domain layer depends only on the `ProcedureRepository` interface; this
 * factory wires up the concrete FHIR implementation. A caller may supply a
 * custom `FhirClient` (e.g. for tests); otherwise a new default client is
 * created.
 */
export function createProcedureRepository(
    client?: FhirClient
): ProcedureRepository {
    const c = client ?? new FhirClient();
    return new ProcedureFhirRepository(c);
}
