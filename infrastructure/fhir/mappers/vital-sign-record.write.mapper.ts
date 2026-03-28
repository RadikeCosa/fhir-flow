/**
 * Build FHIR Observation entries for vital signs from a finalize encounter input.
 * Pure mapper: no HTTP side effects.
 */
import type { PersistableClinicalPayload } from "./shared/persistable-clinical-payload";
import type { ClinicalResourceContext } from "./shared/persistable-clinical-payload";

type VitalSignsPayload = Pick<
    PersistableClinicalPayload,
    | "heartRate"
    | "respiratoryRate"
    | "oxygenSaturation"
    | "bodyTemperature"
    | "bloodPressureSystolic"
    | "bloodPressureDiastolic"
>;

export type VitalSignsResourceInput = ClinicalResourceContext & VitalSignsPayload;

const VITAL_SIGNS_CATEGORY = [
    {
        coding: [
            {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
            },
        ],
    },
];

function createBaseObservationResource(input: VitalSignsResourceInput): Record<string, unknown> {
    return {
        resourceType: "Observation",
        status: "final",
        category: VITAL_SIGNS_CATEGORY,
        subject: {
            reference: `Patient/${input.patientId}`,
        },
        encounter: {
            reference: `Encounter/${input.encounterId}`,
        },
        performer: [
            {
                reference: `Practitioner/${input.performerId}`,
                display: input.practitionerName,
            },
        ],
        effectiveDateTime: input.actualEndAt,
    };
}

export function mapToFhirVitalSignObservations(input: VitalSignsResourceInput): Array<unknown> {
    const entries: Array<unknown> = [];

    const base = createBaseObservationResource(input);

    if (typeof input.heartRate === "number") {
        entries.push({
            request: { method: "POST", url: "Observation" },
            resource: {
                ...base,
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "8867-4",
                            display: "Heart rate",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.heartRate,
                    unit: "beats/minute",
                    system: "http://unitsofmeasure.org",
                    code: "/min",
                },
            },
        });
    }

    if (typeof input.respiratoryRate === "number") {
        entries.push({
            request: { method: "POST", url: "Observation" },
            resource: {
                ...base,
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "9279-1",
                            display: "Respiratory rate",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.respiratoryRate,
                    unit: "breaths/minute",
                    system: "http://unitsofmeasure.org",
                    code: "/min",
                },
            },
        });
    }

    if (typeof input.oxygenSaturation === "number") {
        entries.push({
            request: { method: "POST", url: "Observation" },
            resource: {
                ...base,
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "59408-5",
                            display: "Oxygen saturation",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.oxygenSaturation,
                    unit: "%",
                    system: "http://unitsofmeasure.org",
                    code: "%",
                },
            },
        });
    }

    if (typeof input.bodyTemperature === "number") {
        entries.push({
            request: { method: "POST", url: "Observation" },
            resource: {
                ...base,
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "8310-5",
                            display: "Body temperature",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.bodyTemperature,
                    unit: "Cel",
                    system: "http://unitsofmeasure.org",
                    code: "Cel",
                },
            },
        });
    }

    if (typeof input.bloodPressureSystolic === "number" || typeof input.bloodPressureDiastolic === "number") {
        const components: Array<Record<string, unknown>> = [];
        if (typeof input.bloodPressureSystolic === "number") {
            components.push({
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "8480-6",
                            display: "Systolic blood pressure",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.bloodPressureSystolic,
                    unit: "mmHg",
                    system: "http://unitsofmeasure.org",
                    code: "mm[Hg]",
                },
            });
        }

        if (typeof input.bloodPressureDiastolic === "number") {
            components.push({
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: "8462-4",
                            display: "Diastolic blood pressure",
                        },
                    ],
                },
                valueQuantity: {
                    value: input.bloodPressureDiastolic,
                    unit: "mmHg",
                    system: "http://unitsofmeasure.org",
                    code: "mm[Hg]",
                },
            });
        }

        if (components.length > 0) {
            entries.push({
                request: { method: "POST", url: "Observation" },
                resource: {
                    ...base,
                    code: {
                        coding: [
                            {
                                system: "http://loinc.org",
                                code: "85354-9",
                                display: "Blood pressure panel",
                            },
                        ],
                    },
                    component: components,
                },
            });
        }
    }

    return entries;
}
