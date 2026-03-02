
declare namespace NodeJS {
    interface ProcessEnv {
        /**
         * Base URL of the FHIR server that the application will communicate with.
         * Required at build-time, therefore non-optional.
         */
        FHIR_BASE_URL: string;

        // Add other environment variables here as needed, e.g.:
        // NEXT_PUBLIC_API_URL: string;
    }
}
