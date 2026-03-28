/**
 * Build persistable clinical resource entries (Observation/Procedure)
 * from a finalize-compatible clinical payload.
 *
 * Pure mapper: no I/O, no side effects.
 */
import type { FinalizeEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { mapToFhirVitalSignObservations } from "./vital-sign-record.write.mapper";
import { mapToFhirEvaObservation } from "./assessments/eva.write.mapper";
import { mapToFhirProcedures } from "./procedure.write.mapper";

export function buildClinicalResourcesBundleEntries(
    input: FinalizeEncounterInput
): Array<unknown> {
    const vitalEntries = mapToFhirVitalSignObservations(input);
    const evaEntry = mapToFhirEvaObservation(input);
    const procedureEntries = mapToFhirProcedures(input);

    const entries = [...vitalEntries];

    if (evaEntry) {
        entries.push(evaEntry);
    }

    entries.push(...procedureEntries);

    return entries;
}
