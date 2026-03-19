/**
 * Build a FHIR transaction bundle containing encounter, observations, and
 * procedures for finalizing an encounter.
 *
 * Pure mapper: no I/O, no side effects.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { FhirMapperError } from "../../../domain/shared/error-types";
import { mapToFhirEncounterUpdate } from "./encounter.finalize.mapper";
import { mapToFhirVitalSignObservations } from "./vital-sign-record.write.mapper";
import { mapToFhirEvaObservation } from "./assessments/eva.write.mapper";
import { mapToFhirProcedures } from "./procedure.write.mapper";

export function buildFinalizeEncounterBundle(input: FinalizeEncounterInput): unknown {
    const encounterEntry = mapToFhirEncounterUpdate(input);

    if (!encounterEntry || typeof encounterEntry !== "object") {
        throw new FhirMapperError("Encounter update entry is required", "MISSING_ENCOUNTER_ENTRY");
    }

    const vitalEntries = mapToFhirVitalSignObservations(input);
    const evaEntry = mapToFhirEvaObservation(input);
    const procedureEntries = mapToFhirProcedures(input);

    const entries = [encounterEntry, ...vitalEntries];

    if (evaEntry) {
        entries.push(evaEntry);
    }
    entries.push(...procedureEntries);

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: entries,
    };
}
