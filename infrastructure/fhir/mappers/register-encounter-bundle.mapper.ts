import type { RegisterEncounterInput } from "../../../domain/encounters/encounter.write-input";
import { mapToRegisterEncounterEntry } from "./encounter.register.mapper";
import { buildClinicalResourcesBundleEntries } from "./clinical-resources-bundle.mapper";

function hasClinicalPayload(input: RegisterEncounterInput): boolean {
    return (
        input.heartRate !== undefined
        || input.respiratoryRate !== undefined
        || input.oxygenSaturation !== undefined
        || input.bodyTemperature !== undefined
        || input.bloodPressureSystolic !== undefined
        || input.bloodPressureDiastolic !== undefined
        || input.evaScore !== undefined
        || input.procedures.length > 0
    );
}

export function buildRegisterEncounterBundle(
    encounterId: string,
    input: RegisterEncounterInput
): unknown {
    const encounterEntry = mapToRegisterEncounterEntry(encounterId, input);

    if (!hasClinicalPayload(input)) {
        return {
            resourceType: "Bundle",
            type: "transaction",
            entry: [encounterEntry],
        };
    }

    const effectiveDateTime = input.completionMode === "complete"
        ? input.actualEndAt ?? input.actualStartAt
        : input.actualStartAt;

    const clinicalEntries = buildClinicalResourcesBundleEntries({
        encounterId,
        patientId: input.patientId,
        performerId: input.performerId,
        practitionerName: input.practitionerName,
        effectiveDateTime,
        heartRate: input.heartRate,
        respiratoryRate: input.respiratoryRate,
        oxygenSaturation: input.oxygenSaturation,
        bodyTemperature: input.bodyTemperature,
        bloodPressureSystolic: input.bloodPressureSystolic,
        bloodPressureDiastolic: input.bloodPressureDiastolic,
        evaScore: input.evaScore,
        procedures: input.procedures,
    });

    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: [encounterEntry, ...clinicalEntries],
    };
}
