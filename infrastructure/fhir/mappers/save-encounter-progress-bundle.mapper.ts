import type { SaveEncounterProgressInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { buildClinicalResourcesBundleEntries } from "./clinical-resources-bundle.mapper";
import { mapToInProgressEncounterUpdate } from "./encounter.progress.mapper";

export interface ExistingEncounterClinicalSnapshot {
    observationIds: string[];
    procedureIds: string[];
}

function buildDeleteEntry(resourceType: "Observation" | "Procedure", id: string): unknown {
    return {
        request: {
            method: "DELETE",
            url: `${resourceType}/${id}`,
        },
    };
}

export function buildSaveEncounterProgressBundle(
    input: SaveEncounterProgressInput,
    existingEncounter: Record<string, unknown>,
    existingSnapshot: ExistingEncounterClinicalSnapshot
): unknown {
    const encounterEntry = mapToInProgressEncounterUpdate(existingEncounter, input);

    if (!encounterEntry || typeof encounterEntry !== "object") {
        throw new FhirMapperError("Encounter progress update entry is required", "MISSING_ENCOUNTER_ENTRY");
    }

    const deleteObservationEntries = existingSnapshot.observationIds.map((id) =>
        buildDeleteEntry("Observation", id)
    );
    const deleteProcedureEntries = existingSnapshot.procedureIds.map((id) =>
        buildDeleteEntry("Procedure", id)
    );

    const clinicalResourceEntries = buildClinicalResourcesBundleEntries({
        ...input,
        effectiveDateTime: input.recordedAt,
    });

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: [
            encounterEntry,
            ...deleteObservationEntries,
            ...deleteProcedureEntries,
            ...clinicalResourceEntries,
        ],
    };
}
