import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { Patient } from "@/domain/patients/patient";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Procedure } from "@/domain/procedures/procedure";
import EncounterList from "../encounters/components/EncounterList";

const repositories = vi.hoisted(() => ({
  patientRepo: {
    findById: vi.fn(),
  },
  episodeRepo: {
    findAllByPatientId: vi.fn(),
  },
  encounterRepo: {
    findLastByPatientIdAndPractitionerId: vi.fn(),
    findNextPlannedByPatientIdAndPractitionerId: vi.fn(),
    findInitialByEpisodeOfCareId: vi.fn(),
    findAllByEpisodeOfCareId: vi.fn(),
  },
  vitalRepo: {
    findAllByPatientId: vi.fn(),
    findAllByEncounterId: vi.fn(),
  },
  assessmentRepo: {
    findEvaByPatientId: vi.fn(),
    findEvaByEncounterId: vi.fn(),
  },
  procedureRepo: {
    findAllByPatientId: vi.fn(),
    findAllByEncounterId: vi.fn(),
  },
  barthelRepo: {
    findByEncounterId: vi.fn(),
  },
  necpalRepo: {
    findByEncounterId: vi.fn(),
  },
  ecogRepo: {
    findByEncounterId: vi.fn(),
  },
  planRepo: {
    findByEncounterId: vi.fn(),
  },
}));

vi.mock("@/infrastructure/fhir/factories", () => ({
  createPatientRepository: () => repositories.patientRepo,
  createEpisodeOfCareRepository: () => repositories.episodeRepo,
  createEncounterRepository: () => repositories.encounterRepo,
  createVitalSignRecordRepository: () => repositories.vitalRepo,
  createAssessmentRepository: () => repositories.assessmentRepo,
  createProcedureRepository: () => repositories.procedureRepo,
  createBarthelAssessmentRepository: () => repositories.barthelRepo,
  createNecpalAssessmentRepository: () => repositories.necpalRepo,
  createEcogAssessmentRepository: () => repositories.ecogRepo,
  createPlanOfCareRepository: () => repositories.planRepo,
}));

vi.mock("@/config/fhir.config", () => ({
  currentPractitionerId: "prac-001",
}));

const patientFixture: Patient = {
  id: "patient-001",
  identifier: "12345678",
  name: {
    given: "Ana",
    family: "Gomez",
  },
  active: true,
};

const activeEpisodeFixture: EpisodeOfCare = {
  id: "episode-001",
  identifier: "episode-identifier",
  status: "active",
  type: ["motora"],
  startDate: "2026-01-10",
  condition: {
    code: "M54.5",
    description: "Dolor lumbar",
  },
  patientId: patientFixture.id,
};

function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: "enc-default",
    status: "finished",
    episodeOfCareId: activeEpisodeFixture.id,
    patientId: patientFixture.id,
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

describe("cross-surface contract (patient detail ↔ encounter history)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repositories.patientRepo.findById.mockResolvedValue(patientFixture);
    repositories.episodeRepo.findAllByPatientId.mockResolvedValue([activeEpisodeFixture]);
    repositories.encounterRepo.findInitialByEpisodeOfCareId.mockResolvedValue(null);
    repositories.encounterRepo.findLastByPatientIdAndPractitionerId.mockResolvedValue(null);
    repositories.barthelRepo.findByEncounterId.mockResolvedValue(null);
    repositories.necpalRepo.findByEncounterId.mockResolvedValue(null);
    repositories.ecogRepo.findByEncounterId.mockResolvedValue(null);
    repositories.planRepo.findByEncounterId.mockResolvedValue(null);
    repositories.vitalRepo.findAllByPatientId.mockResolvedValue([]);
    repositories.assessmentRepo.findEvaByPatientId.mockResolvedValue([]);
    repositories.procedureRepo.findAllByPatientId.mockResolvedValue([]);
  });

  it("keeps patient-detail selected encounter inside history base membership while allowing planned-first visible ordering", async () => {
    const plannedSoon = makeEncounter({
      id: "enc-planned-soon",
      status: "planned",
      plannedDate: "2026-03-21",
      plannedTime: "09:00",
      periodStart: "2026-03-21T09:00:00.000Z",
    });
    const plannedLater = makeEncounter({
      id: "enc-planned-later",
      status: "planned",
      plannedDate: "2026-03-23",
      plannedTime: "10:00",
      periodStart: "2026-03-23T10:00:00.000Z",
    });
    const inProgress = makeEncounter({
      id: "enc-in-progress-current",
      status: "in-progress",
      actualStartAt: "2026-03-20T11:00:00.000Z",
      periodStart: "2026-03-20T11:00:00.000Z",
    });
    const finished = makeEncounter({
      id: "enc-finished-previous",
      status: "finished",
      actualStartAt: "2026-03-19T11:00:00.000Z",
      periodStart: "2026-03-19T11:00:00.000Z",
    });

    repositories.encounterRepo.findAllByEpisodeOfCareId.mockResolvedValue([
      plannedSoon,
      plannedLater,
      inProgress,
      finished,
    ]);
    repositories.encounterRepo.findNextPlannedByPatientIdAndPractitionerId.mockResolvedValue(
      plannedSoon
    );

    const selectedVital: VitalSignRecord = {
      id: "vs-selected",
      patientId: patientFixture.id,
      encounterId: inProgress.id,
      date: "2026-03-20T11:05:00.000Z",
      recordedBy: { id: "prac-001", display: "Dr. Test" },
      heartRate: 80,
    };
    const selectedEva: EvaAssessment = {
      id: "eva-selected",
      patientId: patientFixture.id,
      encounterId: inProgress.id,
      type: "eva",
      date: "2026-03-20T11:06:00.000Z",
      score: 5,
      recordedBy: { id: "prac-001", display: "Dr. Test" },
    };
    const selectedProcedure: Procedure = {
      id: "proc-selected",
      patientId: patientFixture.id,
      encounterId: inProgress.id,
      code: {
        text: "Procedimiento in-progress",
        coding: [],
        category: "other",
      },
      status: "completed",
      performedDateTime: "2026-03-20T11:07:00.000Z",
      performers: [],
      bodySite: [],
      notes: [],
    };

    repositories.vitalRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === inProgress.id ? [selectedVital] : []
    );
    repositories.assessmentRepo.findEvaByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === inProgress.id ? [selectedEva] : []
    );
    repositories.procedureRepo.findAllByEncounterId.mockImplementation(async (encounterId: string) =>
      encounterId === inProgress.id ? [selectedProcedure] : []
    );

    const { getPatientDetailData } = await import("../data");
    const { getEncountersPageData } = await import("../encounters/data");

    const patientDetail = await getPatientDetailData(patientFixture.id);
    const history = await getEncountersPageData(patientFixture.id);

    expect(patientDetail.lastEncounter?.id).toBe(inProgress.id);
    expect(patientDetail.lastEncounterVitalSigns).toEqual([selectedVital]);
    expect(patientDetail.lastEncounterEvaRecords).toEqual([selectedEva]);
    expect(patientDetail.lastEncounterProcedures).toEqual([selectedProcedure]);

    expect(repositories.vitalRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgress.id);
    expect(repositories.assessmentRepo.findEvaByEncounterId).toHaveBeenCalledWith(inProgress.id);
    expect(repositories.procedureRepo.findAllByEncounterId).toHaveBeenCalledWith(inProgress.id);
    expect(repositories.vitalRepo.findAllByEncounterId).not.toHaveBeenCalledWith(finished.id);
    expect(repositories.assessmentRepo.findEvaByEncounterId).not.toHaveBeenCalledWith(finished.id);
    expect(repositories.procedureRepo.findAllByEncounterId).not.toHaveBeenCalledWith(finished.id);

    expect(history.encounters.map((encounter) => encounter.id)).toContain(inProgress.id);

    const html = renderToStaticMarkup(
      React.createElement(EncounterList, {
        encounters: history.encounters,
        proceduresByEncounterId: history.proceduresByEncounterId,
        vitalsByEncounterId: history.vitalsByEncounterId,
        evaByEncounterId: history.evaByEncounterId,
      })
    );

    expect(html).toContain("Próximas sesiones");
    expect(html).toContain("En curso");
    expect(html.indexOf("Próximas sesiones")).toBeLessThan(html.indexOf("En curso"));
  });
});
