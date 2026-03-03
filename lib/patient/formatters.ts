/**
 * Presentation utilities for Patient data (age & gender formatting).
 * Kept independent from FHIR/domain mapping — UI formatting only.
 */

export function computeAgeFromBirthDate(birthDate?: string, now: Date = new Date()): string | undefined {
    if (!birthDate || typeof birthDate !== "string") return undefined;

    // Accepts FHIR date formats: YYYY | YYYY-MM | YYYY-MM-DD
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(birthDate)) return undefined;

    const parts = birthDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parts[1] ? parseInt(parts[1], 10) : 1;
    const day = parts[2] ? parseInt(parts[2], 10) : 1;

    // Use UTC to avoid timezone side-effects when comparing dates
    const dob = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(dob.getTime())) return undefined;

    const nowUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    let age = nowUtc.getUTCFullYear() - dob.getUTCFullYear();

    // Adjust if birthday has not occurred yet this year
    const dobMonth = dob.getUTCMonth();
    const dobDay = dob.getUTCDate();
    if (nowUtc.getUTCMonth() < dobMonth || (nowUtc.getUTCMonth() === dobMonth && nowUtc.getUTCDate() < dobDay)) {
        age -= 1;
    }

    if (age < 0) return undefined;

    return age === 1 ? `${age} año` : `${age} años`;
}

export function translateGenderToSpanish(g?: string): string {
    switch (g) {
        case "male":
            return "masculino";
        case "female":
            return "femenino";
        case "other":
            return "otro";
        default:
            return "desconocido";
    }
}

/**
 * Format deceased status for display.
 * - `true` → "Fallecido/a"
 * - ISO date string → "Fallecido/a el DD de <mes> de YYYY"
 * - `false`/`undefined` → undefined
 */
export function formatDeceased(
    deceased?: boolean | string
): string | undefined {
    if (deceased === true) return "Fallecido/a";
    if (typeof deceased === "string" && deceased.trim() !== "") {
        const d = new Date(deceased);
        if (!isNaN(d.getTime())) {
            // idioma español, formato largo
            const formatter = new Intl.DateTimeFormat("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            return `Fallecido/a el ${formatter.format(d)}`;
        }
    }
}

/**
 * Simple marital status translator.
 */
export function formatMaritalStatus(status?: string): string {
    switch (status) {
        case "married":
            return "Casado/a";
        case "single":
            return "Soltero/a";
        case "widowed":
            return "Viudo/a";
        case "divorced":
            return "Divorciado/a";
        case "separated":
            return "Separado/a";
        default:
            return "Desconocido";
    }
}

/**
 * Combine given and family names for display. Falls back when missing.
 */
export function formatContactName(
    name?: { given: string; family: string }
): string {
    if (!name) return "Sin nombre";

    const parts: string[] = [];
    if (name.given && name.given.trim() !== "") parts.push(name.given.trim());
    if (name.family && name.family.trim() !== "") parts.push(name.family.trim());

    if (parts.length === 0) return "Sin nombre";
    return parts.join(" ");
}

/**
 * Build a printable address string suitable for display or Maps queries.
 */
export function formatAddress(
    address?: { line: string[]; city: string; country: string; postalCode?: string }
): string {
    if (!address) return "";

    const parts: string[] = [];
    if (Array.isArray(address.line) && address.line.length > 0) {
        parts.push(address.line.filter((l) => l.trim() !== "").join(", "));
    }
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(`CP ${address.postalCode}`);
    if (address.country) parts.push(address.country);

    return parts.join(", ");
}
