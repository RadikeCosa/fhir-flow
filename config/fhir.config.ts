export type FhirVersion = "R4"; // Tipo literal: sólo se permite la versión "R4"

export interface FhirServerConfig {
    baseUrl: string; // URL base del servidor FHIR
    fhirVersion: FhirVersion; // Versión FHIR (usa el tipo anterior)
    defaultHeaders: Record<string, string>; // Cabeceras HTTP por defecto
    pagination: {
        defaultCount: number; // cantidad por defecto en paginación
        maxCount: number; // máximo permitido en paginación
    };
    capabilities: {
        supportsSearch: boolean; // si el servidor soporta búsquedas
        supportsRead: boolean; // si soporta lectura de recursos
        supportsHistory: boolean; // si soporta operaciones de historial
        supportsPagination: boolean; // si soporta paginación en resultados
        supportsElementsParameter: boolean; // soporte para parámetro _elements
        supportsSummaryParameter: boolean; // soporte para parámetro _summary
    };
}

// obtiene FHIR_BASE_URL del entorno
const fhirBaseUrl = process.env.FHIR_BASE_URL;
// obtiene CURRENT_PRACTITIONER_ID del entorno (valor crudo)
const currentPractitionerIdValue = process.env.CURRENT_PRACTITIONER_ID;

// obtiene CURRENT_PRACTITIONER_NAME del entorno (valor crudo)
const currentPractitionerNameValue = process.env.CURRENT_PRACTITIONER_NAME;

// validar que la URL base de FHIR esté presente y no vacía
if (!fhirBaseUrl) {
    // si no está definida la variable de entorno, detener con error claro
    throw new Error("Missing required environment variable: FHIR_BASE_URL");
}

// validar que exista un id de profesional activo
if (!currentPractitionerIdValue) {
    throw new Error("Missing required environment variable: CURRENT_PRACTITIONER_ID");
}

// validar que exista un nombre de profesional activo
if (!currentPractitionerNameValue || currentPractitionerNameValue.trim() === "") {
    throw new Error("Missing required environment variable: CURRENT_PRACTITIONER_NAME");
}

export const fhirConfig: FhirServerConfig = {
    baseUrl: fhirBaseUrl, // asigna la URL base desde la variable de entorno

    fhirVersion: "R4", // versión FHIR usada en la aplicación

    defaultHeaders: {
        Accept: "application/fhir+json", // cabecera Accept para FHIR JSON
        "Content-Type": "application/fhir+json", // Content-Type para requests FHIR
    },

    pagination: {
        defaultCount: 20, // valor por defecto de items por página
        maxCount: 50, // límite máximo de items por página
    },

    capabilities: {
        supportsSearch: true, // habilita funcionalidad de búsqueda
        supportsRead: true, // habilita lectura de recursos
        supportsHistory: true, // habilita consulta de historial
        supportsPagination: true, // habilita paginación
        supportsElementsParameter: true, // habilita parámetro _elements
        supportsSummaryParameter: true, // habilita parámetro _summary
    },
};

// El ID del profesional configurado, validado al inicio del módulo.
export const currentPractitionerId: string = currentPractitionerIdValue;

// Temporary display name for the current practitioner.
// Will be replaced by auth session data when authentication is implemented.
export const currentPractitionerName: string = currentPractitionerNameValue.trim();