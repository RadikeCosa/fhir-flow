/**
 * Global environment variables typing.
 *
 * This file extends the global ProcessEnv to provide strict typing
 * for environment variables used across the application.
 *
 * It contains type definitions only (no runtime validation).
 */

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /**
             * Base URL of the FHIR server that the application communicates with.
             * Must be defined at build-time.
             *
             * Example:
             * FHIR_BASE_URL=https://hapi.fhir.org/baseR4
             */
            FHIR_BASE_URL: string;

            /**
             * Practitioner ID used for clinical context in reads and writes.
             * Example: kine-1
             */
            CURRENT_PRACTITIONER_ID: string;

            /**
             * Human-readable practitioner name shown in UI and persisted in write payloads.
             * Example: Lic. Ramiro Perez
             */
            CURRENT_PRACTITIONER_NAME: string;
        }
    }
}

// Ensures this file is treated as a module and avoids global scope issues
export { };