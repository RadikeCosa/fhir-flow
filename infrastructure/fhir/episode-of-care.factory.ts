import { FhirClient } from "../../lib/fhir/fhir-client";
import { EpisodeOfCareFhirRepository } from "./episode-of-care.fhir-repository";
import type { EpisodeOfCareRepository } from "../../domain/episode-of-care.repository";

/**
 * Composition root for the episode-of-care repository implementation.  By
 * centralising creation here callers only depend on the domain interface.
 * An optional `FhirClient` can be provided for tests or custom
 * configuration; otherwise a default instance is used.
 */
export function createEpisodeOfCareRepository(
    client?: FhirClient
): EpisodeOfCareRepository {
    const c = client ?? new FhirClient();
    return new EpisodeOfCareFhirRepository(c);
}
