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
    expect(result.inProgressInitialValues).toEqual({
      encounterId: "enc-1",
      clinicalNote: undefined,
      reasonDisplay: "Control",
      vitalSigns: [vitalFixture],
      evaAssessments: [evaFixture],
      procedures: [procedureFixture],
    });
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
    expect(result.inProgressInitialValues).toEqual({
      encounterId: "enc-1",
      clinicalNote: undefined,
      reasonDisplay: "Control",
      vitalSigns: [],
      evaAssessments: [],
      procedures: [],
    });
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
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith("enc-1");
    expect(result.vitalSigns).toEqual([otherEncounterVital]);
    expect(result.inProgressInitialValues).toBeUndefined();
  });

  it("hydrates only the clinical datasets of the requested encounterId", async () => {
    const requestedEncounterId = "enc-requested";
    const otherEncounterId = "enc-other";

    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({ id: requestedEncounterId, status: "finished" }),
    );

    const requestedVital: VitalSignRecord = {
      ...vitalFixture,
      id: "vital-requested",
      encounterId: requestedEncounterId,
    };
    const requestedEva: EvaAssessment = {
      ...evaFixture,
      id: "eva-requested",
      encounterId: requestedEncounterId,
    };
    const requestedProcedure: Procedure = {
      ...procedureFixture,
      id: "proc-requested",
      encounterId: requestedEncounterId,
    };

    const otherVital: VitalSignRecord = {
      ...vitalFixture,
      id: "vital-other",
      encounterId: otherEncounterId,
    };
    const otherEva: EvaAssessment = {
      ...evaFixture,
      id: "eva-other",
      encounterId: otherEncounterId,
    };
    const otherProcedure: Procedure = {
      ...procedureFixture,
      id: "proc-other",
      encounterId: otherEncounterId,
    };

    repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedVital] : [otherVital],
    );
    repositories.assessmentRepo.findEvaByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedEva] : [otherEva],
    );
    repositories.procedureRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedProcedure] : [otherProcedure],
    );

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, requestedEncounterId);

    expect(repositories.encounterRepo.findById).toHaveBeenCalledWith(requestedEncounterId);
    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(requestedEncounterId);
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(requestedEncounterId);
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(requestedEncounterId);

    expect(result.vitalSigns).toEqual([requestedVital]);
    expect(result.evaRecords).toEqual([requestedEva]);
    expect(result.procedures).toEqual([requestedProcedure]);
    expect(result.vitalSigns.every((record) => record.encounterId === requestedEncounterId)).toBe(true);
    expect(result.evaRecords.every((record) => record.encounterId === requestedEncounterId)).toBe(true);
    expect(result.procedures.every((record) => record.encounterId === requestedEncounterId)).toBe(true);
  });

  it("finished canonical read: does not mix clinical data when two encounters share the same date", async () => {
    const requestedEncounterId = "enc-finished-a";
    const siblingEncounterId = "enc-finished-b";
    const sharedDate = "2026-03-10";

    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({
        id: requestedEncounterId,
        status: "finished",
        periodStart: `${sharedDate}T08:00:00.000Z`,
        periodEnd: `${sharedDate}T08:30:00.000Z`,
      }),
    );

    const requestedVital: VitalSignRecord = {
      ...vitalFixture,
      id: "vital-a",
      encounterId: requestedEncounterId,
      date: sharedDate,
      heartRate: 72,
    };
    const siblingVital: VitalSignRecord = {
      ...vitalFixture,
      id: "vital-b",
      encounterId: siblingEncounterId,
      date: sharedDate,
      heartRate: 95,
    };

    const requestedEva: EvaAssessment = {
      ...evaFixture,
      id: "eva-a",
      encounterId: requestedEncounterId,
      date: sharedDate,
      score: 3,
    };
    const siblingEva: EvaAssessment = {
      ...evaFixture,
      id: "eva-b",
      encounterId: siblingEncounterId,
      date: sharedDate,
      score: 8,
    };

    const requestedProcedure: Procedure = {
      ...procedureFixture,
      id: "proc-a",
      encounterId: requestedEncounterId,
    };
    const siblingProcedure: Procedure = {
      ...procedureFixture,
      id: "proc-b",
      encounterId: siblingEncounterId,
    };

    repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedVital] : [siblingVital],
    );
    repositories.assessmentRepo.findEvaByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedEva] : [siblingEva],
    );
    repositories.procedureRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === requestedEncounterId ? [requestedProcedure] : [siblingProcedure],
    );

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, requestedEncounterId);

    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(requestedEncounterId);
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(requestedEncounterId);
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(requestedEncounterId);
    expect(result.vitalSigns).toEqual([requestedVital]);
    expect(result.evaRecords).toEqual([requestedEva]);
    expect(result.procedures).toEqual([requestedProcedure]);
    expect(result.vitalSigns).not.toContainEqual(siblingVital);
    expect(result.evaRecords).not.toContainEqual(siblingEva);
    expect(result.procedures).not.toContainEqual(siblingProcedure);
  });

  it("returns null encounter when encounter does not belong to route patient and skips clinical loaders", async () => {
    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({
        id: "enc-foreign",
        status: "finished",
        patientId: "other-patient",
      }),
    );

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, "enc-foreign");

    expect(result.encounter).toBeNull();
    expect(result.patient).toEqual(patientFixture);
    expect(result.vitalSigns).toEqual([]);
    expect(result.evaRecords).toEqual([]);
    expect(result.procedures).toEqual([]);
    expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalled();
    expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalled();
    expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalled();
  });

  it("for planned encounters, does not load encounter-linked clinical datasets", async () => {
    repositories.encounterRepo.findById.mockResolvedValue(
      makeEncounter({ status: "planned", actualStartAt: undefined, actualEndAt: undefined }),
    );

    const { getEncounterDetailData } = await import("../data");
    const result = await getEncounterDetailData(patientFixture.id, "enc-1");

    expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalled();
    expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalled();
    expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalled();

    expect(result.vitalSigns).toEqual([]);
    expect(result.evaRecords).toEqual([]);
    expect(result.procedures).toEqual([]);
    expect(result.inProgressInitialValues).toBeUndefined();
  });
});
