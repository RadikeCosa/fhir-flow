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
import type { ClinicalResourcesBundleInput } from "./clinical-resources-bundle.mapper";

function mapFinalizeInputToClinicalBundleInput(
    input: FinalizeEncounterInput
): ClinicalResourcesBundleInput {
    return {
        context: {
            encounterId: input.encounterId,
            patientId: input.patientId,
            performerId: input.performerId,
            practitionerName: input.practitionerName,
            actualEndAt: input.actualEndAt,
        },
        payload: {
            heartRate: input.heartRate,
            respiratoryRate: input.respiratoryRate,
            oxygenSaturation: input.oxygenSaturation,
            bodyTemperature: input.bodyTemperature,
            bloodPressureSystolic: input.bloodPressureSystolic,
            bloodPressureDiastolic: input.bloodPressureDiastolic,
            evaScore: input.evaScore,
            procedures: input.procedures,
        },
    };
}

export function buildFinalizeEncounterBundle(input: FinalizeEncounterInput): unknown {
    const encounterEntry = mapToFhirEncounterUpdate(input);

    if (!encounterEntry || typeof encounterEntry !== "object") {
        throw new FhirMapperError("Encounter update entry is required", "MISSING_ENCOUNTER_ENTRY");
    }

    const clinicalResourceEntries = buildClinicalResourcesBundleEntries(
        mapFinalizeInputToClinicalBundleInput(input)
    );

    const entries = [encounterEntry, ...clinicalResourceEntries];

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: entries,
    };
}
