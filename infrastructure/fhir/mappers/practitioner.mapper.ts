import type { Practitioner } from "../../../domain/practitioners/practitioner";
import type { FhirPractitionerResource } from "../schemas/practitioner.schema";
import { formatContactName } from "../../../lib/patient/formatters/patient.formatters";

function pickDisplayName(resource: FhirPractitionerResource): string {
    const preferredName = resource.name?.find((name) => name.use === "official") ?? resource.name?.[0];

    const text = preferredName?.text?.trim();
    if (text) return text;

    return formatContactName({
        given: preferredName?.given ?? [],
        family: preferredName?.family ?? "",
    }).trim();
}

export function mapFhirPractitionerToPractitioner(
    resource: FhirPractitionerResource
): Practitioner {
    return {
        id: resource.id,
        displayName: pickDisplayName(resource),
    };
}
