import type { Patient } from "./patient";

/** Pagination parameters for repository queries (reusable). */
export type PaginationParams = {
    /** 1-based page index; when omitted the implementation may use a default */
    page?: number;
    /** Items per page; when omitted the implementation may use a default */
    pageSize?: number;
};

/** Generic paginated result returned by repository queries. */
export type PaginatedResult<T> = {
    items: T[];
    total?: number; // optional total count when available
    nextUrl?: string; // optional next-page URL exposed by infra when available
};

/** Filters that can be applied when querying patients.
 *
 * Keep this shape small and explicit; new filter fields can be added
 * in the future to extend query capabilities without changing the API.
 */
export type PatientFilters = {
    /** Partial or full name match (implementation-defined matching rules). */
    name?: string;
    /** Primary identifier (MRN, national id, etc.). */
    identifier?: string;
};


/** Unified query object grouping filters and pagination.
 *
 * This keeps repository calls explicit and extensible while avoiding
 * overlapping methods for similar retrieval use-cases.
 */
export type PatientQuery = {
    filters?: PatientFilters;
    pagination?: PaginationParams;
};

/**
 * Repository interface for the `Patient` aggregate.
 *
 * Purpose:
 * - Declares the domain-level contract for reading Patient data.
 * - Remains infrastructure-agnostic: implementations map between external
 *   models (FHIR, DB rows, etc.) and the `Patient` domain model.
 * - Exposes a single, clear query method (`findMany`) for list-style
 *   retrievals to avoid overlap and ambiguity between `findAll` and
 *   `search` semantics.
 */
export interface PatientRepository {
    /** Retrieve a patient by internal domain `id`. Returns the `Patient` or `null`. */
    findById(id: string): Promise<Patient | null>;

    /**
     * Find many patients by a unified `PatientQuery`.
     *
     * - `filters` contains domain-level filter criteria (name, identifier).
     * - `pagination` contains reusable pagination parameters.
     *
     * Returns a `PaginatedResult<Patient>` containing the matching items
     * and optional pagination metadata.
     */
    findMany(query?: PatientQuery): Promise<PaginatedResult<Patient>>;
}
