export type FhirVersion = "R4";

export interface FhirServerConfig {
    baseUrl: string;
    fhirVersion: FhirVersion;
    defaultHeaders: Record<string, string>;
    pagination: {
        defaultCount: number;
        maxCount: number;
    };
    capabilities: {
        supportsSearch: boolean;
        supportsRead: boolean;
        supportsHistory: boolean;
        supportsPagination: boolean;
        supportsElementsParameter: boolean;
        supportsSummaryParameter: boolean;
    };
}

const fhirBaseUrl = process.env.FHIR_BASE_URL;

if (!fhirBaseUrl) {
    throw new Error("Missing required environment variable: FHIR_BASE_URL");
}

export const fhirConfig: FhirServerConfig = {
    baseUrl: fhirBaseUrl,

    fhirVersion: "R4",

    defaultHeaders: {
        Accept: "application/fhir+json",
        "Content-Type": "application/fhir+json",
    },

    pagination: {
        defaultCount: 20,
        maxCount: 50,
    },

    capabilities: {
        supportsSearch: true,
        supportsRead: true,
        supportsHistory: true,
        supportsPagination: true,
        supportsElementsParameter: true,
        supportsSummaryParameter: true,
    },
};