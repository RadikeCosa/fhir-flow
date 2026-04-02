/**
 * Build a FHIR transaction bundle containing encounter, observations, and
 * procedures for finalizing an encounter.
 *
 * Pure mapper: no I/O, no side effects.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { mapToFhirEncounterUpdate } from "./encounter.finalize.mapper";
import { buildClinicalResourcesBundleEntries } from "./clinical-resources-bundle.mapper";

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

export function buildFinalizeEncounterBundle(
    input: FinalizeEncounterInput,
    existingSnapshot?: ExistingEncounterClinicalSnapshot
): unknown {
    const encounterEntry = mapToFhirEncounterUpdate(input);

    if (!encounterEntry || typeof encounterEntry !== "object") {
        throw new FhirMapperError("Encounter update entry is required", "MISSING_ENCOUNTER_ENTRY");
    }

    const snapshot = existingSnapshot ?? {
        observationIds: [],
        procedureIds: [],
    };

    const deleteObservationEntries = snapshot.observationIds.map((id) =>
        buildDeleteEntry("Observation", id)
    );
    const deleteProcedureEntries = snapshot.procedureIds.map((id) =>
        buildDeleteEntry("Procedure", id)
    );

    const clinicalResourceEntries = buildClinicalResourcesBundleEntries({
        ...input,
        effectiveDateTime: input.actualEndAt,
    });

    const entries = [
        encounterEntry,
        ...deleteObservationEntries,
        ...deleteProcedureEntries,
        ...clinicalResourceEntries,
    ];

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: entries,
    };
}
