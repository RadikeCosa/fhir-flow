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
            // Force UTC timezone to avoid off-by-one-day errors when the
            // date string has no time component (parsed as UTC midnight).
            const formatter = new Intl.DateTimeFormat("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
            });
            return `Fallecido/a el ${formatter.format(d)}`;
        }
    }
}

/**
 * Simple marital status translator.
 */
export function formatMaritalStatus(status?: string): string {
    // The FHIR v3-MaritalStatus ValueSet (see https://terminology.hl7.org/3.1.0/ValueSet-v3-MaritalStatus.html)
    // contains both English words and one-letter codes. A HAPI server may return
    // either form or even free text with arbitrary casing, so we normalize input
    // and handle both possibilities. Unknown values fall back to "Desconocido".
    if (!status || typeof status !== "string") return "Desconocido";
    const key = status.trim().toLowerCase();

    switch (key) {
        case "married":
        case "m":
            return "Casado/a";
        case "single":
        case "s":
            return "Soltero/a";
        case "widowed":
        case "w":
            return "Viudo/a";
        case "divorced":
        case "d":
            return "Divorciado/a";
        case "separated":
        case "l":
            return "Separado/a legalmente";
        case "t":
            return "Pareja de hecho";
        case "u":
            return "Desconocido";
        default:
            // any other text (free-text or unrecognized code)
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
 * Format a patient's full name for display. Trims and joins given/family
 * parts; falls back to "Sin nombre" when both are blank.
 *
 * Patient names and contact names share the same `{ given, family }` shape
 * today, but are semantically distinct: patient names may later incorporate
 * prefixes (Dr./Dra.) or suffixes. Keeping a dedicated export avoids
 * confusion at the call-site and isolates any future patient-specific
 * formatting to a single place.
 */
export function formatPatientName(
    name?: { given: string; family: string }
): string {
    return formatContactName(name);
}

/**
 * Format a patient's postal address for UI display.
 *
 * The output always includes the primary address line and city.  Postal
 * code is prefixed with "CP" when present.  Province and country are
 * deliberately omitted because every patient lives in Neuquén, Argentina
 * and including them would only add noise.
 */
export function formatAddress(
    address?: { line: string[]; city: string; state?: string; postalCode?: string; country?: string }
): string {
    if (!address) return "";

    const parts: string[] = [];
    if (Array.isArray(address.line) && address.line.length > 0) {
        parts.push(address.line.filter((l) => l.trim() !== "").join(", "));
    }
    if (address.city) parts.push(address.city);
    if (address.postalCode) parts.push(`CP ${address.postalCode}`);

    return parts.join(", ");
}

/**
 * Build a full address string for Google Maps geocoding.
 * Unlike formatAddress (UI display), this version includes province
 * and country for accurate geocoding resolution.
 * Province and country are hardcoded — all patients are from Neuquén, Argentina.
 */
export function formatAddressForGeocoding(
    address?: { line: string[]; city: string }
): string {
    if (!address) return "";

    const segments: string[] = [];
    if (Array.isArray(address.line) && address.line.length > 0) {
        const joined = address.line.filter((l) => l.trim() !== "").join(", ");
        if (joined) segments.push(joined);
    }
    if (address.city) segments.push(address.city);

    // fixed province and country
    segments.push("Neuquén", "Argentina");

    return segments.filter((s) => s && s.trim() !== "").join(", ");
}
