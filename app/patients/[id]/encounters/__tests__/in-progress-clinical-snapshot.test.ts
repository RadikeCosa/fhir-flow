import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";

const repositories = vi.hoisted(() => ({
  vitalRepo: {
    findAllByEncounterId: vi.fn(),
  },
  assessmentRepo: {
    findEvaByEncounterId: vi.fn(),
  },
  procedureRepo: {
    findAllByEncounterId: vi.fn(),
  },
}));

vi.mock("@/infrastructure/fhir/factories", () => ({
  createVitalSignRecordRepository: () => repositories.vitalRepo,
  createAssessmentRepository: () => repositories.assessmentRepo,
  createProcedureRepository: () => repositories.procedureRepo,
}));

const encounterFixture: Encounter = {
  id: "enc-1",
  status: "in-progress",
  episodeOfCareId: "ep-1",
  patientId: "pat-1",
  visitType: "follow-up",
  participant: null,
  plannedDate: undefined,
  plannedTime: undefined,
  actualStartAt: "2026-03-10T12:00:00.000Z",
  actualEndAt: undefined,
  periodStart: "2026-03-10T12:00:00.000Z",
  periodEnd: undefined,
  durationMinutes: undefined,
  reasonDisplay: "Control",
  clinicalNote: "Nota parcial",
};

const vitalFixture: VitalSignRecord = {
  id: "vital-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  date: "2026-03-10",
  recordedBy: {
    id: "pr-1",
    display: "Nurse",
  },
  heartRate: 80,
};

const evaFixture: EvaAssessment = {
  id: "eva-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  type: "eva",
  date: "2026-03-10",
  score: 4,
  recordedBy: {
    id: "pr-1",
    display: "Nurse",
  },
};

const procedureFixture: Procedure = {
  id: "proc-1",
  patientId: "pat-1",
  encounterId: "enc-1",
  status: "completed",
  category: "fisioterapia",
  code: "ultrasonido-terapeutico",
  display: "Evaluación",
};

describe("in-progress-clinical-snapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([]);
    repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([]);
    repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([]);
  });

  it("loads encounter-scoped clinical snapshot", async () => {
    repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([vitalFixture]);
    repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([evaFixture]);
    repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([procedureFixture]);

    const { loadEncounterClinicalSnapshot } = await import(
      "../in-progress-clinical-snapshot"
    );

    const snapshot = await loadEncounterClinicalSnapshot("enc-1");

    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");

    expect(snapshot).toEqual({
      vitalSigns: [vitalFixture],
      evaAssessments: [evaFixture],
      procedures: [procedureFixture],
    });
  });

  it("builds in-progress initial values from encounter and snapshot", async () => {
    const { buildInProgressInitialValues } = await import(
      "../in-progress-clinical-snapshot"
    );

    const initialValues = buildInProgressInitialValues(encounterFixture, {
      vitalSigns: [vitalFixture],
      evaAssessments: [evaFixture],
      procedures: [procedureFixture],
    });

    expect(initialValues).toEqual({
      encounterId: "enc-1",
      clinicalNote: "Nota parcial",
      reasonDisplay: "Control",
      vitalSigns: [vitalFixture],
      evaAssessments: [evaFixture],
      procedures: [procedureFixture],
    });
  });
});
