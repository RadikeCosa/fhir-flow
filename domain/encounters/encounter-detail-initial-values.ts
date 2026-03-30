import type { EvaAssessment } from "../assessments/eva-assessment";
import type { Procedure } from "../procedures/procedure";
import type { VitalSignRecord } from "../vital-sign-record/vital-sign-record";

/**
 * Explicit contract between the encounter detail loader and UI for
 * `in-progress` encounters.
 *
 * Source of truth:
 * - Encounter base fields (`clinicalNote`, `reasonDisplay`) from `Encounter` read by id.
 * - Encounter clinical datasets read from repositories linked by `encounterId`
 *   (`findAllByEncounterId` / `findEvaByEncounterId`).
 *
 * Notes:
 * - This is intentionally *not* the form schema payload.
 * - Values remain in domain read shape to keep mapping decisions outside the loader.
 * - Finalize-only fields that require composition (for example `actualEndTime`) are
 *   intentionally excluded and will be handled in a later mapping step.
 */
export interface InProgressEncounterDetailInitialValues {
    encounterId: string;

    /**
     * Optional free-text fields that may not exist in persisted Encounter data.
     */
    clinicalNote?: string;
    reasonDisplay?: string;

    /**
     * Raw domain datasets linked by `encounterId`.
     *
     * They can be empty arrays when no partial data was saved yet.
     */
    vitalSigns: VitalSignRecord[];
    evaAssessments: EvaAssessment[];
    procedures: Procedure[];
}
