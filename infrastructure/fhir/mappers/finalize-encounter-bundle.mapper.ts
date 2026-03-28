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

export function buildFinalizeEncounterBundle(input: FinalizeEncounterInput): unknown {
    const encounterEntry = mapToFhirEncounterUpdate(input);

    if (!encounterEntry || typeof encounterEntry !== "object") {
        throw new FhirMapperError("Encounter update entry is required", "MISSING_ENCOUNTER_ENTRY");
    }

    const clinicalResourceEntries = buildClinicalResourcesBundleEntries({
        ...input,
        effectiveDateTime: input.actualEndAt,
    });

    const entries = [encounterEntry, ...clinicalResourceEntries];

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: entries,
    };
}
