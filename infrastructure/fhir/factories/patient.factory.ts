import { FhirClient } from "../../../lib/fhir/fhir-client";
import { PatientFhirRepository } from "../repositories/patient.fhir-repository";
import type { PatientRepository } from "../../../domain/patients/patient.repository";


/**
 * Factory for a PatientRepository implementation backed by FHIR.
 *
 * This module is the composition root for patient infrastructure. By
 * centralizing wiring here we ensure the rest of the app only depends on
 * the `PatientRepository` interface. The factory accepts an optional
 * `FhirClient` instance which is useful for tests or when the client
 * needs custom configuration; if omitted a default client is constructed.
 */
export function createPatientRepository(client?: FhirClient): PatientRepository {
    const c = client ?? new FhirClient();
    return new PatientFhirRepository(c);
}

