/**
 * A lightweight logging interface used across the application.
 *
 * Implementations should be injected where needed to avoid framework coupling.
 */
export interface Logger {
    /**
     * Log a warning-level message.
     *
     * @param context - a brief description of where the warning originated
     * @param data - optional structured data to help diagnose the warning
     */
    warn(context: string, data: Record<string, unknown>): void;
}

/**
 * Development-only fallback. Replace with a production-grade logger
 * (e.g. Datadog, Sentry) by injecting a different Logger implementation.
 * Do not rely on this class in production.
 */
export class ConsoleLogger implements Logger {
    warn(context: string, data: Record<string, unknown>): void {
        console.warn({ context, ...data });
    }
}

/**
 * Default logger instance used when no explicit logger is provided.
 */
export const defaultLogger: Logger = new ConsoleLogger();
