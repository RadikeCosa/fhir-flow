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
