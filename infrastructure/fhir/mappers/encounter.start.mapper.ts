import { FhirMapperError } from "../../../domain/shared/error-types";
import type { FhirEncounter } from "../schemas/encounter.schema";

export function mapToStartedEncounterUpdate(
    encounter: FhirEncounter,
    actualStartAt: string
): FhirEncounter {
    if (!encounter.id || encounter.id.trim() === "") {
        throw new FhirMapperError("Encounter ID cannot be empty", "MISSING_ENCOUNTER_ID");
    }

    if (!encounter.subject?.reference) {
        throw new FhirMapperError(
            "Encounter subject reference is required",
            "MISSING_ENCOUNTER_SUBJECT"
        );
    }

    if (!encounter.episodeOfCare || encounter.episodeOfCare.length === 0) {
        throw new FhirMapperError(
            "Encounter episodeOfCare is required",
            "MISSING_ENCOUNTER_EPISODE_OF_CARE"
        );
    }

    if (!encounter.participant || encounter.participant.length === 0) {
        throw new FhirMapperError(
            "Encounter participant is required",
            "MISSING_ENCOUNTER_PARTICIPANT"
        );
    }

    if (!("class" in encounter) || !encounter.class) {
        throw new FhirMapperError(
            "Encounter class is required",
            "MISSING_ENCOUNTER_CLASS"
        );
    }

    if (!encounter.type || encounter.type.length === 0) {
        throw new FhirMapperError(
            "Encounter type is required",
            "MISSING_ENCOUNTER_TYPE"
        );
    }

    const currentPeriod = encounter.period ?? {};

    return {
        ...encounter,
        status: "in-progress",
        period: {
            ...currentPeriod,
            start: actualStartAt,
            end: undefined,
        },
    };
}
