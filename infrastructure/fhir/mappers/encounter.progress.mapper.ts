import type { SaveEncounterProgressInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { CLINICAL_NOTE_EXTENSION_URL } from "../../../lib/fhir/systems";

function hasText(value: unknown): value is string {
    return typeof value === "string" && value.trim() !== "";
}

export function mapToInProgressEncounterUpdate(
    existingEncounter: Record<string, unknown>,
    input: SaveEncounterProgressInput
): unknown {
    if (!input.encounterId || input.encounterId.trim() === "") {
        throw new FhirMapperError("Encounter ID cannot be empty", "MISSING_ENCOUNTER_ID");
    }

    const encounterResource: Record<string, unknown> = {
        ...existingEncounter,
        resourceType: "Encounter",
        id: input.encounterId,
        status: "in-progress",
    };

    const period =
        typeof existingEncounter.period === "object" && existingEncounter.period !== null
            ? { ...(existingEncounter.period as Record<string, unknown>) }
            : {};

    encounterResource.period = {
        ...period,
        start: input.actualStartAt,
    };

    if (hasText(input.reasonDisplay)) {
        encounterResource.reasonCode = [{ text: input.reasonDisplay.trim() }];
    }

    if (input.reasonDisplay != null && !hasText(input.reasonDisplay)) {
        delete encounterResource.reasonCode;
    }

    if (hasText(input.clinicalNote)) {
        const note = input.clinicalNote.trim();
        encounterResource.note = [{ text: note }];

        const existingExtensions = Array.isArray(existingEncounter.extension)
            ? existingEncounter.extension.filter((entry) => {
                if (typeof entry !== "object" || entry === null) return true;
                const maybe = entry as Record<string, unknown>;
                return maybe.url !== CLINICAL_NOTE_EXTENSION_URL;
            })
            : [];

        encounterResource.extension = [
            ...existingExtensions,
            {
                url: CLINICAL_NOTE_EXTENSION_URL,
                valueString: note,
            },
        ];
    }

    if (input.clinicalNote != null && !hasText(input.clinicalNote)) {
        delete encounterResource.note;
        if (Array.isArray(existingEncounter.extension)) {
            const remainingExtensions = existingEncounter.extension.filter((entry) => {
                if (typeof entry !== "object" || entry === null) return true;
                const maybe = entry as Record<string, unknown>;
                return maybe.url !== CLINICAL_NOTE_EXTENSION_URL;
            });

            if (remainingExtensions.length > 0) {
                encounterResource.extension = remainingExtensions;
            } else {
                delete encounterResource.extension;
            }
        }
    }

    return {
        request: {
            method: "PUT",
            url: `Encounter/${input.encounterId}`,
        },
        resource: encounterResource,
    };
}
