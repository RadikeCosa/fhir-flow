export function coerceOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
            return undefined;
        }

        const normalized = trimmed.replace(",", ".");
        const parsed = Number(normalized);

        if (!Number.isFinite(parsed)) {
            return value as unknown as number;
        }

        return parsed;
    }

    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            return value;
        }

        return value;
    }

    return value as unknown as number;
}
