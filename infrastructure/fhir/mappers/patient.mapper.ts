import type { FhirPatientResource } from "../schemas/patient.schema";
import type { Patient, PatientGender } from "../../../domain/patient";

/** ---------- Identifier ---------- */

function pickIdentifier(
    identifiers: FhirPatientResource["identifier"] | undefined,
    fallbackId: string
): string {
    if (Array.isArray(identifiers)) {
        const valid = identifiers.find(
            (id) => typeof id?.value === "string" && id.value.trim() !== ""
        );
        if (valid && typeof valid.value === "string" && valid.value !== "") return valid.value;
    }

    return fallbackId;
}

/** ---------- Name ---------- */

function pickName(
    names?: FhirPatientResource["name"]
): { given: string; family: string } {
    if (!Array.isArray(names) || names.length === 0) {
        return { given: "", family: "" };
    }

    const preferred =
        names.find((n) => n?.use === "official") ?? names[0];

    const given = Array.isArray(preferred?.given)
        ? preferred.given.filter(Boolean).join(" ")
        : "";

    const family =
        typeof preferred?.family === "string"
            ? preferred.family
            : "";

    return { given, family };
}

/** ---------- Gender ---------- */

const genderMap: Record<string, PatientGender> = {
    male: "male",
    female: "female",
    other: "other",
    unknown: "unknown",
};

function mapGender(g?: string): PatientGender {
    return g && genderMap[g] ? genderMap[g] : "unknown";
}

/** ---------- Telecom ---------- */

function pickTelecom(
    telecom?: FhirPatientResource["telecom"]
): { phone?: string; email?: string } {
    if (!Array.isArray(telecom)) return {};

    let phone: string | undefined;
    let email: string | undefined;

    for (const t of telecom) {
        const value =
            typeof t?.value === "string" && t.value.trim() !== ""
                ? t.value
                : undefined;

        if (!value) continue;

        if (!phone && t.system === "phone") phone = value;
        if (!email && t.system === "email") email = value;

        if (phone && email) break;
    }

    return { phone, email };
}

/** ---------- Address ---------- */

function pickAddress(
    addresses?: FhirPatientResource["address"]
): { line: string[]; city: string; country: string } | undefined {
    if (!Array.isArray(addresses) || addresses.length === 0) return;

    const preferred =
        addresses.find((a) => a?.use === "home") ??
        addresses[0];

    if (!preferred) return;

    const line = Array.isArray(preferred.line)
        ? preferred.line.filter((l): l is string => typeof l === "string")
        : [];

    const city =
        typeof preferred.city === "string"
            ? preferred.city
            : "";

    const country =
        typeof preferred.country === "string"
            ? preferred.country
            : "";

    return { line, city, country };
}

/** ---------- BirthDate ---------- */
/**
 * FHIR date format:
 * YYYY | YYYY-MM | YYYY-MM-DD
 */
function parseBirthDate(value?: string): string | undefined {
    if (
        typeof value === "string" &&
        /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)
    ) {
        return value;
    }
}

/** ---------- Mapper ---------- */

/**
 * Map a validated FHIR Patient resource to the domain `Patient`.
 *
 * Assumes schema validation already happened upstream.
 */
export function mapFhirPatientToPatient(
    resource: FhirPatientResource
): Patient {
    const identifier = pickIdentifier(
        resource.identifier,
        resource.id
    );

    const name = pickName(resource.name);
    const gender = mapGender(resource.gender);
    const birthDate = parseBirthDate(resource.birthDate);
    const telecom = pickTelecom(resource.telecom);
    const address = pickAddress(resource.address);

    return {
        id: resource.id,
        identifier,
        name,
        birthDate,
        gender,
        phone: telecom.phone,
        email: telecom.email,
        address,
        active:
            typeof resource.active === "boolean"
                ? resource.active
                : true,
    };
}