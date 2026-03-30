import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { Patient } from "@/domain/patients/patient";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";

const repositories = vi.hoisted(() => ({
  encounterRepo: {
    findById: vi.fn(),
  },
  patientRepo: {
    findById: vi.fn(),
  },
  vitalRepo: {
    findAllByEncounterId: vi.fn(),
  },
  assessmentRepo: {
    findEvaByEncounterId: vi.fn(),
  },
  procedureRepo: {
    findAllByEncounterId: vi.fn(),
  },
  currentPractitioner: {
    displayName: "Profesional Actual",
  },
}));

vi.mock("@/infrastructure/fhir/factories", () => ({
  createEncounterRepository: () => repositories.encounterRepo,
  createPatientRepository: () => repositories.patientRepo,
  createVitalSignRecordRepository: () => repositories.vitalRepo,
  createAssessmentRepository: () => repositories.assessmentRepo,
  createProcedureRepository: () => repositories.procedureRepo,
}));

vi.mock("@/lib/server/current-practitioner", () => ({
  getCurrentPractitioner: vi.fn(async () => repositories.currentPractitioner),
}));

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: "enc-1",
    status: "finished",
    episodeOfCareId: "ep-1",
    patientId: "pat-1",
    visitType: "follow-up",
    participant: null,
    plannedDate: undefined,
    plannedTime: undefined,
    actualStartAt: "2026-03-10T12:00:00.000Z",
    actualEndAt: "2026-03-10T12:30:00.000Z",
    periodStart: "2026-03-10T12:00:00.000Z",
    periodEnd: "2026-03-10T12:30:00.000Z",
    durationMinutes: 30,
    reasonDisplay: "Control",
    clinicalNote: undefined,
    ...overrides,
  };
}

const patientFixture: Patient = {
  id: "pat-1",
  identifier: "123456",
  active: true,
  name: {
    given: "Ana",
    family: "García",
  },
};

const vitalFixture: VitalSignRecord = {
  id: "vital-1",
  patientId: patientFixture.id,
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
  patientId: patientFixture.id,
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
  patientId: patientFixture.id,
  encounterId: "enc-1",
  type: "manual-therapy",
  status: "completed",
  code: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "386053000",
        display: "Evaluación",
      },
    ],
  },
  performedDateTime: "2026-03-10T12:15:00.000Z",
};

describe("getEncounterDetailData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositories.patientRepo.findById.mockResolvedValue(patientFixture);

    repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([]);
    repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([]);
    repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([]);
  });

  it("hydrates encounter clinical datasets for in-progress encounters", async () => {
    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({ status: "in-progress" }),
    );
    repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([vitalFixture]);
    repositories.assessmentRepo.findEvaByEncounterId.mockResolvedValue([evaFixture]);
    repositories.procedureRepo.findAllByEncounterId.mockResolvedValue([procedureFixture]);

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, "enc-1");

    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");

    expect(result.vitalSigns).toEqual([vitalFixture]);
    expect(result.evaRecords).toEqual([evaFixture]);
    expect(result.procedures).toEqual([procedureFixture]);
  });

  it("returns empty clinical datasets for in-progress encounters without associated records", async () => {
    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({ status: "in-progress" }),
    );

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, "enc-1");

    expect(result.vitalSigns).toEqual([]);
    expect(result.evaRecords).toEqual([]);
    expect(result.procedures).toEqual([]);
  });

  it("for finished encounters, queries vitals by encounterId and returns repository records", async () => {
    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({ status: "finished" }),
    );

    const otherEncounterVital: VitalSignRecord = {
      ...vitalFixture,
      id: "vital-other",
      encounterId: "enc-2",
    };

    repositories.vitalRepo.findAllByEncounterId.mockResolvedValue([otherEncounterVital]);

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, "enc-1");

    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(result.vitalSigns).toEqual([otherEncounterVital]);
  });
});
