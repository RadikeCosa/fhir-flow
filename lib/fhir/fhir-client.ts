/*
 Generic FHIR R4 HTTP client

 Design notes (brief):
 - This module provides a small, well-typed wrapper around global `fetch`.
 - It is the single place allowed to call network I/O in the app (per requirements).
 - It uses `config/fhir.config.ts` for `baseUrl` and default headers.
 - It throws typed errors for HTTP failures and for FHIR OperationOutcome responses.
 - It is UI/framework-agnostic and safe to use from Server Components.

 Important decisions:
 - We intentionally do not include domain-specific logic or resource mappers.
 - Methods return parsed JSON typed with generics; consumers should validate shapes
   (e.g. with Zod) at the boundary if stronger guarantees are required.
 - No global mutable state; the client is instantiable and immutable after creation.
*/

import { fhirConfig } from "../../config/fhir.config";
import { FhirWriteError } from "../../domain/shared/error-types";

// Minimal, flexible FHIR resource type. Projects may replace with stronger types.
export type FhirResource = { resourceType: string } & Record<string, unknown>;

export interface OperationOutcome {
    resourceType: "OperationOutcome";
    issue?: Array<{
        severity?: string;
        code?: string;
        diagnostics?: string;
        details?: unknown;
    }>;
}

/** Base class for errors thrown by this client */
export class FhirError extends Error {
    public data?: unknown;
    constructor(message: string, data?: unknown) {
        super(message);
        this.name = "FhirError";
        this.data = data;
    }
}

/** Thrown for non-2xx HTTP responses that are not OperationOutcome */
export class HttpError extends FhirError {
    public status: number;
    constructor(status: number, message: string, body?: unknown) {
        super(message, body);
        this.name = "HttpError";
        this.status = status;
    }
}

/** Thrown when the server responds with a FHIR OperationOutcome */
export class OperationOutcomeError extends FhirError {
    public outcome: OperationOutcome;
    constructor(outcome: OperationOutcome) {
        const msg = (outcome.issue && outcome.issue.map(i => i.diagnostics || i.code).join("; ")) || "OperationOutcome";
        super(msg, outcome);
        this.name = "OperationOutcomeError";
        this.outcome = outcome;
    }
}

export interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | Array<string | number | boolean>>;
    body?: unknown;
    cache?: RequestCache;
    // optional AbortSignal to allow callers to cancel
    signal?: AbortSignal | null;
}

export class FhirClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(opts?: { baseUrl?: string; defaultHeaders?: Record<string, string> }) {
        // Use config by default; allow overriding in tests.
        this.baseUrl = opts?.baseUrl ?? fhirConfig.baseUrl;
        this.defaultHeaders = opts?.defaultHeaders ?? fhirConfig.defaultHeaders;
    }

    private isAbsoluteUrl(value: string): boolean {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ensure request paths are relative to the configured FHIR base path.
     * Example: base `/fhir` + path `/fhir/Observation?...` -> `Observation?...`
     */
    private normalizeRelativePath(path: string): string {
        const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
        const [pathname, search = ""] = withLeadingSlash.split("?");

        let basePath = "";
        try {
            basePath = new URL(this.baseUrl).pathname.replace(/\/+$/, "");
        } catch {
            basePath = "";
        }

        let normalizedPath = pathname;
        if (basePath && basePath !== "/" && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
            normalizedPath = pathname.slice(basePath.length) || "/";
        }

        const noLeadingSlash = normalizedPath.replace(/^\/+/, "");
        return search ? `${noLeadingSlash}?${search}` : noLeadingSlash;
    }

    /**
     * Build a full URL using the configured baseUrl and an application path.
     * `path` may be relative, absolute-path, or full absolute URL.
     */
    private buildUrl(path: string, params?: RequestOptions["params"]): string {
        const url = this.isAbsoluteUrl(path)
            ? new URL(path)
            : new URL(`${this.baseUrl.replace(/\/+$/, "")}/${this.normalizeRelativePath(path)}`);

        if (params) {
            for (const [k, v] of Object.entries(params)) {
                if (v === undefined || v === null) continue;
                if (Array.isArray(v)) {
                    for (const item of v) url.searchParams.append(k, String(item));
                } else {
                    url.searchParams.append(k, String(v));
                }
            }
        }

        return url.toString();
    }

    /**
     * Low-level fetch used by multiple methods. Returns the Response and the
     * parsed body (JSON or text) so callers can inspect headers/status.
     */
    private async doFetch(url: string, fetchOptions: RequestInit): Promise<{ response: Response; parsedBody: unknown; contentType: string }> {
        let res: Response;
        try {
            res = await fetch(url, fetchOptions);
        } catch (err) {
            throw new FhirError(`Network request failed for ${url}: ${String(err)}`, err);
        }

        const contentType = res.headers.get("content-type") || "";

        // Attempt to parse JSON when possible
        let parsedBody: unknown = null;
        if (contentType.includes("application/json") || contentType.includes("application/fhir+json") || contentType.includes("+json")) {
            try {
                parsedBody = await res.json();
            } catch {
                parsedBody = null;
            }
        } else {
            try {
                parsedBody = await res.text();
            } catch {
                parsedBody = null;
            }
        }

        return { response: res, parsedBody, contentType };
    }

    /**
     * Low-level request helper. Throws typed errors on non-2xx responses or
     * when server returns a FHIR OperationOutcome.
     */
    public async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
        const {
            method = "GET",
            headers = {},
            params,
            body,
            cache,
            signal = null,
        } = options;

        const url = this.buildUrl(path, params);

        const mergedHeaders: Record<string, string> = { ...this.defaultHeaders, ...headers };

        const fetchOptions: RequestInit = {
            method,
            headers: mergedHeaders,
            cache,
            signal: signal ?? undefined,
        };

        if (body !== undefined && body !== null) {
            // send JSON body; consumers may stringify complex payloads themselves
            fetchOptions.body = JSON.stringify(body);
            // ensure content-type exists (don't overwrite if user provided one)
            mergedHeaders["Content-Type"] = mergedHeaders["Content-Type"] ?? "application/fhir+json";
        }

        const { response: res, parsedBody } = await this.doFetch(url, fetchOptions);

        // Type guard reused in multiple places
        const isOutcome = (obj: unknown): obj is OperationOutcome => {
            if (typeof obj !== "object" || obj === null) return false;
            const maybe = obj as Record<string, unknown>;
            return maybe.resourceType === "OperationOutcome";
        };

        // If not OK, convert to an HttpError or OperationOutcomeError
        if (!res.ok) {
            if (isOutcome(parsedBody)) {
                throw new OperationOutcomeError(parsedBody);
            }

            // provide useful error message and include parsed body when available
            const message = `HTTP ${res.status} ${res.statusText}`;
            throw new HttpError(res.status, message, parsedBody);
        }

        // Success but check for OperationOutcome in 200s (some servers return it with 200)
        if (isOutcome(parsedBody)) {
            throw new OperationOutcomeError(parsedBody);
        }

        // Return parsed JSON if available, otherwise return raw text (typed as unknown)
        return (parsedBody as T) ?? (null as unknown as T);
    }

    // Convenience CRUD-style methods -------------------------------------------------

    /** Read a resource by type and id */
    public async read<T extends FhirResource = FhirResource>(
        resourceType: string,
        id: string,
        options: Pick<RequestOptions, "cache"> = {}
    ): Promise<T> {
        const path = `/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
        return this.request<T>(path, { method: "GET", ...options });
    }

    /** Search for resources using query params. Returns the parsed Bundle or raw result. */
    public async search<T = unknown>(
        resourceType: string,
        searchParams: RequestOptions["params"] = {},
        options: Pick<RequestOptions, "cache"> = {}
    ): Promise<T> {
        const path = `/${encodeURIComponent(resourceType)}`;
        return this.request<T>(path, { method: "GET", params: searchParams, ...options });
    }

    /**
     * Fetch a full URL (typically from a Bundle `link` entry) while applying
     * the same error handling and OperationOutcome detection as `request`.
     */
    public async fetchByUrl<T = unknown>(url: string): Promise<T> {
        return this.request<T>(url, { method: "GET" });
    }

    /** Create a new resource (POST) */
    public async create<T = unknown>(resourceType: string, body: unknown): Promise<T> {
        const path = `/${encodeURIComponent(resourceType)}`;
        return this.request<T>(path, { method: "POST", body });
    }

    /** Update a resource by id (PUT). For PATCH/conditional updates caller may use `request` directly. */
    public async update<T = unknown>(resourceType: string, id: string, body: unknown): Promise<T> {
        const path = `/${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`;
        return this.request<T>(path, { method: "PUT", body });
    }

    /**
     * Create a single FHIR resource via HTTP POST.
     *
     * Extracts the created resource's ID from the response body or Location header.
     * Detects and rejects OperationOutcome in 2xx responses.
     *
     * @param resourceType - FHIR resource type (e.g., "Encounter", "Observation")
     * @param body - Raw resource body (should be validated by caller)
     * @returns Promise<{ id: string }> - the created resource's ID
     *
     * Throws FhirWriteError if:
     * - HTTP response is non-2xx
     * - Response contains OperationOutcome (even in 200)
     * - Cannot extract ID from body or Location header
     */
    public async post(resourceType: string, body: unknown): Promise<{ id: string }> {
        const path = `/${encodeURIComponent(resourceType)}`;
        const url = this.buildUrl(path);

        const { response, parsedBody } = await this.doFetch(url, {
            method: "POST",
            headers: { ...this.defaultHeaders, "Content-Type": "application/fhir+json" },
            body: JSON.stringify(body),
        });

        // Detect OperationOutcome in any 2xx response
        const isOutcome = (obj: unknown): obj is OperationOutcome => {
            if (typeof obj !== "object" || obj === null) return false;
            const maybe = obj as Record<string, unknown>;
            return maybe.resourceType === "OperationOutcome";
        };

        // If not OK, throw FhirWriteError
        if (!response.ok) {
            const message = `HTTP ${response.status} creating ${resourceType}`;
            throw new FhirWriteError(
                message,
                response.status,
                isOutcome(parsedBody) ? parsedBody : undefined,
                "HTTP_ERROR"
            );
        }

        // If OK but contains OperationOutcome, treat as error.
        if (isOutcome(parsedBody)) {
            throw new FhirWriteError(
                `OperationOutcome in response when creating ${resourceType}`,
                200,
                parsedBody,
                "OPERATION_OUTCOME"
            );
        }

        // Extract ID from response body or Location header
        let id: string | undefined;

        if (typeof parsedBody === "object" && parsedBody !== null) {
            const resource = parsedBody as Record<string, unknown>;
            if (typeof resource.id === "string") {
                id = resource.id;
            }
        }

        if (!id) {
            const location = response.headers.get("location") || "";
            if (location) {
                const parts = location.split("/");
                for (let i = 0; i < parts.length - 1; i++) {
                    if (parts[i] === resourceType && i + 1 < parts.length) {
                        id = parts[i + 1];
                        break;
                    }
                }
            }
        }

        if (!id) {
            throw new FhirWriteError(
                `Cannot extract ID from response when creating ${resourceType}`,
                response.status,
                undefined,
                "MISSING_ID"
            );
        }

        return { id };
    }

    /**
     * Send a FHIR transaction bundle via POST to the base URL (not /Bundle).
     *
     * Errors are not swallowed; they propagate as FhirWriteError for server
     * status or FHIR OperationOutcome conditions.
     */
    public async postBundle(bundle: unknown): Promise<void> {
        const url = this.baseUrl;
        const expectedEntries = (
            typeof bundle === "object" && bundle !== null && Array.isArray((bundle as { entry?: unknown[] }).entry)
                ? (bundle as { entry: unknown[] }).entry.length
                : 0
        );

        const { response, parsedBody } = await this.doFetch(url, {
            method: "POST",
            headers: { ...this.defaultHeaders, "Content-Type": "application/fhir+json" },
            body: JSON.stringify(bundle),
        });

        const isOutcome = (obj: unknown): obj is OperationOutcome => {
            if (typeof obj !== "object" || obj === null) return false;
            const maybe = obj as Record<string, unknown>;
            return maybe.resourceType === "OperationOutcome";
        };

        const isBundle = (obj: unknown): obj is {
            resourceType: "Bundle";
            type?: string;
            entry?: Array<{ resource?: unknown; response?: { status?: string } }>;
        } => {
            if (typeof obj !== "object" || obj === null) return false;
            const maybe = obj as Record<string, unknown>;
            return maybe.resourceType === "Bundle";
        };

        if (!response.ok) {
            if (isOutcome(parsedBody)) {
                throw new FhirWriteError(
                    "Bundle HTTP request failed with OperationOutcome",
                    response.status,
                    parsedBody,
                    "BUNDLE_HTTP_ERROR"
                );
            }

            throw new FhirWriteError(
                `Bundle HTTP request failed with status ${response.status}`,
                response.status,
                undefined,
                "BUNDLE_HTTP_ERROR"
            );
        }

        if (isOutcome(parsedBody)) {
            throw new FhirWriteError(
                "Bundle response is OperationOutcome",
                response.status,
                parsedBody,
                "BUNDLE_OPERATION_OUTCOME"
            );
        }

        if (isBundle(parsedBody)) {
            const bundleData = parsedBody;
            if (bundleData.type !== "transaction-response") {
                throw new FhirWriteError(
                    "Bundle response is not transaction-response",
                    response.status,
                    undefined,
                    "BUNDLE_INVALID_RESPONSE"
                );
            }

            if (expectedEntries > 0 && (bundleData.entry?.length ?? 0) !== expectedEntries) {
                throw new FhirWriteError(
                    "Bundle response entry count does not match request",
                    response.status,
                    undefined,
                    "BUNDLE_INVALID_RESPONSE"
                );
            }

            const outcomeEntry = (bundleData.entry ?? [])
                .map((entry) => entry.resource)
                .find(isOutcome);

            if (outcomeEntry) {
                throw new FhirWriteError(
                    "Bundle response contains OperationOutcome entry",
                    response.status,
                    outcomeEntry,
                    "BUNDLE_OPERATION_OUTCOME"
                );
            }

            const failedEntries = (bundleData.entry ?? []).filter((entry) => {
                const status = entry.response?.status;
                return typeof status === "string" && !status.startsWith("2");
            });
            const entriesWithoutStatus = (bundleData.entry ?? []).filter(
                (entry) => typeof entry.response?.status !== "string"
            );

            if (failedEntries.length > 0) {
                throw new FhirWriteError(
                    "Bundle response contains failed entries",
                    response.status,
                    undefined,
                    "BUNDLE_ENTRY_FAILED"
                );
            }

            if (entriesWithoutStatus.length > 0) {
                throw new FhirWriteError(
                    "Bundle response contains entries without status",
                    response.status,
                    undefined,
                    "BUNDLE_INVALID_RESPONSE"
                );
            }

            return;
        }

        throw new FhirWriteError(
            "Bundle response is missing or invalid",
            response.status,
            undefined,
            "BUNDLE_INVALID_RESPONSE"
        );
    }
}

export default FhirClient;
