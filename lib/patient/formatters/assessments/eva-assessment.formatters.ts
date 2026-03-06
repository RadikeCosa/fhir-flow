import type { BadgeInfo } from "../shared.formatters";
import type { EvaAssessment } from "../../../../domain/assessments/eva-assessment";
import { EVA_RANGES } from "../../../../domain/assessments/eva-assessment";

/**
 * Determine a badge appropriate for a given EVA score.
 *
 * Clinically, the EVA scale ranges from 0 (no pain) to 10
 * (worst imaginable pain). Badges use color semantics to give a
 * quick visual indication of severity. The range definitions are
 * sourced from `EVA_RANGES` so thresholds stay in sync with the
 * domain model.
 */
export function getEvaBadge(score: number): BadgeInfo {
    if (score === EVA_RANGES.none.min) {
        return { label: EVA_RANGES.none.label, colorClass: "bg-green-100 text-green-800" };
    }

    if (score >= EVA_RANGES.mild.min && score <= EVA_RANGES.mild.max) {
        return { label: EVA_RANGES.mild.label, colorClass: "bg-green-100 text-green-800" };
    }

    if (score >= EVA_RANGES.moderate.min && score <= EVA_RANGES.moderate.max) {
        return { label: EVA_RANGES.moderate.label, colorClass: "bg-yellow-100 text-yellow-800" };
    }

    if (score >= EVA_RANGES.severe.min && score <= EVA_RANGES.severe.max) {
        return { label: EVA_RANGES.severe.label, colorClass: "bg-red-100 text-red-800" };
    }

    if (score === EVA_RANGES.worst.min && score === EVA_RANGES.worst.max) {
        return { label: EVA_RANGES.worst.label, colorClass: "bg-red-100 text-red-800" };
    }

    return { label: "Desconocido", colorClass: "bg-gray-100 text-gray-800" };
}

/**
 * Format an EVA score for display.
 */
export function formatEvaScore(score: number): string {
    return `${score} / 10`;
}

/**
 * Return the most recent EVA assessment from a sorted list.
 *
 * The mapper guarantees the input is ordered descending by date,
 * so the first element (index 0) is the latest record. If no
 * records exist, `null` is returned.
 */
export function getLatestEva(records: EvaAssessment[]): EvaAssessment | null {
    return records.length > 0 ? records[0] : null;
}

/**
 * Possible trends between the two most recent EVA records.
 */
export type EvaTrend = "mejora" | "empeora" | "estable" | "sin-datos";

/**
 * Determine the trend of pain between the most recent and previous
 * EVA assessments.
 *
 * `records[0]` is the newest entry and `records[1]` the one
 * immediately preceding it, as guaranteed by mapper sorting.
 * A negative score difference (newer minus older) indicates an
 * improvement because lower numbers represent less pain. When
 * fewer than two records are available, the trend is "sin-datos".
 */
export function getEvaTrend(records: EvaAssessment[]): EvaTrend {
    if (records.length < 2) return "sin-datos";
    const diff = records[0].score - records[1].score;
    if (diff < 0) return "mejora";
    if (diff > 0) return "empeora";
    return "estable";
}
