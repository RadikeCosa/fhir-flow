import type { InProgressEncounterDetailInitialValues } from "@/domain/encounters/encounter-detail-initial-values";
import type { ProcedureCategory, ProcedureCode } from "@/domain/procedures/procedure";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";

export interface InProgressEncounterFormInitialValues {
    clinicalNote: string;
    reasonDisplay: string;
    evaScore?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    bodyTemperature?: number;
    procedures: Array<{
        category: ProcedureCategory;
        code: ProcedureCode;
        bodySite?: string;
        note?: string;
    }>;
}

/**
 * Maps in-progress encounter detail clinical read data into a form-friendly
 * editable shape.
 *
 * Multiple-record strategy (minimal and stable for T3):
 * - Vital signs: use one "latest" record and map scalar fields from it.
 * - EVA: use one "latest" assessment score.
 * - Procedures: preserve all procedures linked to the encounter.
 */
export function mapInProgressEncounterDetailToFormInitialValues(
    source: InProgressEncounterDetailInitialValues,
): InProgressEncounterFormInitialValues {
    console.info("[eva-read][mapper][source-evaAssessments]", {
        count: source.evaAssessments.length,
        items: source.evaAssessments.map((item) => ({
            id: item.id,
            date: item.date,
            score: item.score,
            encounterId: item.encounterId,
        })),
    });
    const latestVital = pickLatestVitalSign(source.vitalSigns);
    const latestEva = pickLatestEvaAssessment(source.evaAssessments);
    console.info("[eva-read][mapper][latestEva]", latestEva
        ? {
            id: latestEva.id,
            date: latestEva.date,
            score: latestEva.score,
            encounterId: latestEva.encounterId,
        }
        : null);
    console.info("[eva-read][mapper][evaScore]", latestEva?.score);

    return {
        clinicalNote: source.clinicalNote ?? "",
        reasonDisplay: source.reasonDisplay ?? "",
        evaScore: latestEva?.score,
        bloodPressureSystolic: latestVital?.bloodPressure?.systolic,
        bloodPressureDiastolic: latestVital?.bloodPressure?.diastolic,
        heartRate: latestVital?.heartRate,
        respiratoryRate: latestVital?.respiratoryRate,
        oxygenSaturation: latestVital?.oxygenSaturation,
        bodyTemperature: latestVital?.bodyTemperature,
        procedures: source.procedures.map((procedure) => ({
            category: procedure.category,
            code: procedure.code,
            bodySite: procedure.bodySite,
            note: procedure.note,
        })),
    };
}

function pickLatestVitalSign(records: VitalSignRecord[]): VitalSignRecord | undefined {
    return pickLatestByDate(records, (record) => record.date);
}

function pickLatestEvaAssessment(records: EvaAssessment[]): EvaAssessment | undefined {
    return pickLatestByDate(records, (record) => record.date);
}

function pickLatestByDate<T>(
    records: T[],
    getDate: (record: T) => string,
): T | undefined {
    let latest: { record: T; timestamp: number; index: number } | undefined;

    records.forEach((record, index) => {
        const timestamp = toTimestamp(getDate(record));

        if (!latest) {
            latest = { record, timestamp, index };
            return;
        }

        if (timestamp > latest.timestamp) {
            latest = { record, timestamp, index };
            return;
        }

        if (timestamp === latest.timestamp && index > latest.index) {
            latest = { record, timestamp, index };
        }
    });

    return latest?.record;
}

function toTimestamp(value: string): number {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}
