import type { FhirVitalSignObservation } from "../schemas/vital-sign.schema";
import type { VitalSignRecord, BloodPressureReading } from "../../../domain/vital-sign-record/vital-sign-record";
import { extractId } from "./shared/extract-helpers";

/**
 * Map an array of validated FHIR Observation resources representing vital
 * signs into domain `VitalSignRecord` objects.
 *
 * Grouping: observations are grouped by their capture timestamp
 * (`effectiveDateTime`) and the first performer's reference/display.
 * Unrecognized LOINC codes are silently skipped. The `patientId`
 * parameter is required because Observations do not contain a normalized
 * patient id suitable for the domain model.
 *
 * Blood pressure observations are component-based and require both the
 * systolic (LOINC 8480-6) and diastolic (LOINC 8462-4) components to be
 * present; otherwise the blood pressure is not set.
 */
export function mapFhirObservationsToVitalSignRecords(
    observations: FhirVitalSignObservation[],
    patientId: string
): VitalSignRecord[] {
    const groups = new Map<string, VitalSignRecord>();

    for (const obs of observations) {
        // pick LOINC code from first coding entry
        const code = Array.isArray(obs.code?.coding) && obs.code.coding[0]?.code
            ? obs.code.coding[0].code
            : undefined;

        let type: string | undefined;
        switch (code) {
            case "8867-4":
                type = "heart-rate";
                break;
            case "9279-1":
                type = "respiratory-rate";
                break;
            case "59408-5":
                type = "oxygen-saturation";
                break;
            case "8310-5":
                type = "body-temperature";
                break;
            case "85354-9":
            case "55284-4":
                type = "blood-pressure";
                break;
            default:
                // unrecognized code: skip
                continue;
        }

        // keep full capture timestamp when available (ISO date or datetime)
        const dt = typeof obs.effectiveDateTime === "string" ? obs.effectiveDateTime : "";
        if (dt.length < 10) continue;
        const date = dt.trim();
        const dateOnly = date.slice(0, 10);
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateOnly)) continue;

        // performer key and recordedBy
        const perf = Array.isArray(obs.performer) && obs.performer.length > 0 ? obs.performer[0] : undefined;
        if (!perf) continue;
        const performerRef = typeof perf.reference === "string" && perf.reference ? perf.reference : undefined;
        const performerDisplay = typeof perf.display === "string" ? perf.display : "";
        const performerKey = performerRef ?? performerDisplay;
        if (!performerKey) continue;

        const groupKey = `${date}::${performerKey}`;

        let record = groups.get(groupKey);
        if (!record) {
            // derive recordedBy.id: extract Practitioner id from reference if present
            // Prefer explicit Practitioner/{id} matches, fall back to last path
            // segment to handle alternate reference forms (full URLs, etc.).
            const recordedById = extractId(performerRef);

            record = {
                id: groupKey,
                patientId,
                date,
                recordedBy: {
                    id: recordedById || performerDisplay || "",
                    display: performerDisplay || "",
                },
            } as VitalSignRecord;

            groups.set(groupKey, record);
        }

        // set measurement values depending on type
        if (type === "blood-pressure") {
            const components = Array.isArray(obs.component) ? obs.component : [];
            let syst: number | undefined;
            let dias: number | undefined;
            for (const c of components) {
                const ccode = Array.isArray(c.code?.coding) && c.code.coding[0]?.code ? c.code.coding[0].code : undefined;
                const val = typeof c.valueQuantity?.value === "number" ? c.valueQuantity.value : undefined;
                if (!ccode || typeof val !== "number") continue;
                if (ccode === "8480-6") syst = val;
                if (ccode === "8462-4") dias = val;
            }
            if (typeof syst === "number" && typeof dias === "number") {
                const bp: BloodPressureReading = { systolic: syst, diastolic: dias };
                record.bloodPressure = bp;
            }
        } else {
            // valueQuantity may be an open object according to the union type,
            // so narrow it before accessing `.value` to keep TypeScript happy.
            const vq = obs.valueQuantity as { value?: unknown } | undefined;
            const v = vq && typeof vq.value === "number" ? vq.value : undefined;
            if (typeof v !== "number") continue;
            switch (type) {
                case "heart-rate":
                    record.heartRate = v;
                    break;
                case "respiratory-rate":
                    record.respiratoryRate = v;
                    break;
                case "oxygen-saturation":
                    record.oxygenSaturation = v;
                    break;
                case "body-temperature":
                    record.bodyTemperature = v;
                    break;
            }
        }
    }

    // return sorted by date/capture timestamp descending
    const results = Array.from(groups.values());
    results.sort((a, b) => {
        const aMs = Date.parse(a.date);
        const bMs = Date.parse(b.date);
        if (!Number.isNaN(aMs) && !Number.isNaN(bMs)) {
            return bMs - aMs;
        }
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return results;
}
