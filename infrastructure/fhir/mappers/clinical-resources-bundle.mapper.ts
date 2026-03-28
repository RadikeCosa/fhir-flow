/**
 * Build persistable clinical resource entries (Observation/Procedure)
 * from a finalize-compatible clinical payload.
 *
 * Pure mapper: no I/O, no side effects.
 */
import type {
    ClinicalResourceContext,
    PersistableClinicalPayload,
} from "./shared/persistable-clinical-payload";
import { mapToFhirVitalSignObservations } from "./vital-sign-record.write.mapper";
import { mapToFhirEvaObservation } from "./assessments/eva.write.mapper";
import { mapToFhirProcedures } from "./procedure.write.mapper";

export interface ClinicalResourcesBundleInput {
    context: ClinicalResourceContext;
    payload: PersistableClinicalPayload;
}

export function buildClinicalResourcesBundleEntries(
    input: ClinicalResourcesBundleInput
): Array<unknown> {
    const vitalEntries = mapToFhirVitalSignObservations({
        ...input.context,
        ...input.payload,
    });
    const evaEntry = mapToFhirEvaObservation({
        ...input.context,
        evaScore: input.payload.evaScore,
    });
    const procedureEntries = mapToFhirProcedures({
        ...input.context,
        procedures: input.payload.procedures,
    });

    const entries = [...vitalEntries];

    if (evaEntry) {
        entries.push(evaEntry);
    }

    entries.push(...procedureEntries);

    return entries;
}
