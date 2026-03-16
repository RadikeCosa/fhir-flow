/**
 * Public API for the FHIR infrastructure layer.
 * UI and application layers must import factories from this module only.
 * Do not import from individual factory files or from repositories,
 * mappers, or schemas directly.
 */

export { createPatientRepository } from "./patient.factory";
export { createEpisodeOfCareRepository } from "./episode-of-care.factory";
export { createEncounterRepository } from "./encounter.factory";
export { createVitalSignRecordRepository } from "./vital-sign-record.factory";
export { createAssessmentRepository } from "./assessment.factory";
export { createProcedureRepository } from "./procedure.factory";
export { createPlanOfCareRepository } from "./plan-of-care.factory";
export { createBarthelAssessmentRepository } from "./barthel-assessment.factory";
export { createEcogAssessmentRepository } from "./ecog-assessment.factory";
export { createNecpalAssessmentRepository } from "./necpal-assessment.factory";
