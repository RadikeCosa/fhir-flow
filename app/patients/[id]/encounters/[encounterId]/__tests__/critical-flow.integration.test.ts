process.env.FHIR_BASE_URL = "http://example.test/fhir";
process.env.CURRENT_PRACTITIONER_ID = "prac-1";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Encounter } from "@/domain/encounters/encounter";
import type { EpisodeOfCare } from "@/domain/episode-of-care/episode-of-care";
import type { EvaAssessment } from "@/domain/assessments/eva-assessment";
import type { Patient } from "@/domain/patients/patient";
import type { Procedure } from "@/domain/procedures/procedure";
import type { VitalSignRecord } from "@/domain/vital-sign-record/vital-sign-record";
import { mapInProgressEncounterDetailToFormInitialValues } from "../../../../../../lib/patient/mappers/in-progress-encounter-detail.mapper";

const revalidatePathMock = vi.fn();
const redirectMock = vi.fn();

const state = vi.hoisted(() => {
  const patient: Patient = {
    id: "pat-1",
    identifier: "123456",
    active: true,
    name: {
      given: "Ana",
      family: "Pérez",
    },
  };

  const activeEpisode: EpisodeOfCare = {
    id: "ep-1",
    identifier: "episode-1",
    status: "active",
    type: ["motora"],
    patientId: patient.id,
    startDate: "2026-03-10",
    condition: {
      code: "M54.5",
      description: "Dolor lumbar",
    },
  };

  return {
    patient,
    activeEpisode,
    encountersById: new Map<string, Encounter>(),
    vitalsByEncounterId: new Map<string, VitalSignRecord[]>(),
    evaByEncounterId: new Map<string, EvaAssessment[]>(),
    proceduresByEncounterId: new Map<string, Procedure[]>(),
  };
});

function upsertEncounter(encounterId: string, updater: (encounter: Encounter) => Encounter) {
  const previous = state.encountersById.get(encounterId);
  if (!previous) {
    throw new Error(`Encounter not found in state: ${encounterId}`);
  }

  state.encountersById.set(encounterId, updater(previous));
}

const encounterRepo = {
  findById: vi.fn(async (encounterId: string) => state.encountersById.get(encounterId) ?? null),

  startEncounter: vi.fn(async (input: { encounterId: string; actualStartAt: string }) => {
    upsertEncounter(input.encounterId, (encounter) => ({
      ...encounter,
      status: "in-progress",
      actualStartAt: input.actualStartAt,
      periodStart: input.actualStartAt,
    }));
  }),

  saveProgress: vi.fn(async (input: {
    encounterId: string;
    patientId: string;
    performerId: string;
    practitionerName: string;
    recordedAt: string;
    clinicalNote?: string;
    reasonDisplay?: string | null;
    heartRate?: number;
    evaScore?: number;
    procedures: Array<{ category: Procedure["category"]; code: Procedure["code"]; bodySite?: string; note?: string }>;
  }) => {
    upsertEncounter(input.encounterId, (encounter) => ({
      ...encounter,
      clinicalNote: input.clinicalNote ?? encounter.clinicalNote,
      reasonDisplay: input.reasonDisplay ?? encounter.reasonDisplay,
    }));

    const vitalRecords: VitalSignRecord[] = input.heartRate === undefined
      ? []
      : [{
        id: `vital-progress-${input.encounterId}`,
        patientId: input.patientId,
        encounterId: input.encounterId,
        date: input.recordedAt,
        recordedBy: {
          id: input.performerId,
          display: input.practitionerName,
        },
        heartRate: input.heartRate,
      }];

    const evaRecords: EvaAssessment[] = input.evaScore === undefined
      ? []
      : [{
        id: `eva-progress-${input.encounterId}`,
        patientId: input.patientId,
        encounterId: input.encounterId,
        type: "eva",
        date: input.recordedAt,
        score: input.evaScore,
        recordedBy: {
          id: input.performerId,
          display: input.practitionerName,
        },
      }];

    const procedureRecords: Procedure[] = input.procedures.map((procedure, index) => ({
      id: `proc-progress-${input.encounterId}-${index}`,
      patientId: input.patientId,
      encounterId: input.encounterId,
      status: "completed",
      category: procedure.category,
      code: procedure.code,
      display: procedure.code,
      bodySite: procedure.bodySite,
      note: procedure.note,
      performerId: input.performerId,
      performerName: input.practitionerName,
    }));

    state.vitalsByEncounterId.set(input.encounterId, vitalRecords);
    state.evaByEncounterId.set(input.encounterId, evaRecords);
    state.proceduresByEncounterId.set(input.encounterId, procedureRecords);
  }),

  finalize: vi.fn(async (input: {
    encounterId: string;
    patientId: string;
    performerId: string;
    practitionerName: string;
    actualEndAt: string;
    clinicalNote: string;
    reasonDisplay?: string | null;
    heartRate?: number;
    evaScore?: number;
    procedures: Array<{ category: Procedure["category"]; code: Procedure["code"]; bodySite?: string; note?: string }>;
  }) => {
    upsertEncounter(input.encounterId, (encounter) => ({
      ...encounter,
      status: "finished",
      actualEndAt: input.actualEndAt,
      periodEnd: input.actualEndAt,
      clinicalNote: input.clinicalNote,
      reasonDisplay: input.reasonDisplay ?? encounter.reasonDisplay,
    }));

    const existingEncounter = state.encountersById.get(input.encounterId);
    if (!existingEncounter) {
      throw new Error(`Encounter not found in state after finalize: ${input.encounterId}`);
    }

    const vitalRecords: VitalSignRecord[] = input.heartRate === undefined
      ? []
      : [{
        id: `vital-finished-${input.encounterId}`,
        patientId: input.patientId,
        encounterId: input.encounterId,
        date: input.actualEndAt,
        recordedBy: {
          id: input.performerId,
          display: input.practitionerName,
        },
        heartRate: input.heartRate,
      }];

    const evaRecords: EvaAssessment[] = input.evaScore === undefined
      ? []
      : [{
        id: `eva-finished-${input.encounterId}`,
        patientId: input.patientId,
        encounterId: input.encounterId,
        type: "eva",
        date: input.actualEndAt,
        score: input.evaScore,
        recordedBy: {
          id: input.performerId,
          display: input.practitionerName,
        },
      }];

    const procedureRecords: Procedure[] = input.procedures.map((procedure, index) => ({
      id: `proc-finished-${input.encounterId}-${index}`,
      patientId: input.patientId,
      encounterId: input.encounterId,
      status: "completed",
      category: procedure.category,
      code: procedure.code,
      display: procedure.code,
      bodySite: procedure.bodySite,
      note: procedure.note,
      performerId: input.performerId,
      performerName: input.practitionerName,
    }));

    state.vitalsByEncounterId.set(existingEncounter.id, vitalRecords);
    state.evaByEncounterId.set(existingEncounter.id, evaRecords);
    state.proceduresByEncounterId.set(existingEncounter.id, procedureRecords);
  }),

  findLastByPatientIdAndPractitionerId: vi.fn(async (patientId: string) => {
    const finished = Array.from(state.encountersById.values())
      .filter((encounter) => encounter.patientId === patientId && encounter.status === "finished")
      .sort((a, b) => {
        const aTs = new Date(a.actualEndAt ?? a.periodEnd ?? a.periodStart).getTime();
        const bTs = new Date(b.actualEndAt ?? b.periodEnd ?? b.periodStart).getTime();
        return bTs - aTs;
      });

    return finished[0] ?? null;
  }),

  findNextPlannedByPatientIdAndPractitionerId: vi.fn(async () => null),

  findInitialByEpisodeOfCareId: vi.fn(async () => null),

  findAllByEpisodeOfCareId: vi.fn(async (episodeOfCareId: string) =>
    Array.from(state.encountersById.values()).filter(
      (encounter) => encounter.episodeOfCareId === episodeOfCareId,
    )),
};

const patientRepo = {
  findById: vi.fn(async (patientId: string) =>
    patientId === state.patient.id ? state.patient : null,
  ),
};

const episodeRepo = {
  findAllByPatientId: vi.fn(async (patientId: string) =>
    patientId === state.patient.id ? [state.activeEpisode] : [],
  ),
};

const vitalRepo = {
  findAllByEncounterId: vi.fn(async (encounterId: string) =>
    state.vitalsByEncounterId.get(encounterId) ?? [],
  ),
};

const assessmentRepo = {
  findEvaByEncounterId: vi.fn(async (encounterId: string) =>
    state.evaByEncounterId.get(encounterId) ?? [],
  ),
};

const procedureRepo = {
  findAllByEncounterId: vi.fn(async (encounterId: string) =>
    state.proceduresByEncounterId.get(encounterId) ?? [],
  ),
};

vi.mock("../../../../../../infrastructure/fhir/factories/encounter.factory", () => ({
  createEncounterRepository: () => encounterRepo,
}));

vi.mock("@/infrastructure/fhir/factories", () => ({
  createEncounterRepository: () => encounterRepo,
  createPatientRepository: () => patientRepo,
  createEpisodeOfCareRepository: () => episodeRepo,
  createVitalSignRecordRepository: () => vitalRepo,
  createAssessmentRepository: () => assessmentRepo,
  createProcedureRepository: () => procedureRepo,
  createBarthelAssessmentRepository: () => ({ findByEncounterId: vi.fn(async () => null) }),
  createNecpalAssessmentRepository: () => ({ findByEncounterId: vi.fn(async () => null) }),
  createEcogAssessmentRepository: () => ({ findByEncounterId: vi.fn(async () => null) }),
  createPlanOfCareRepository: () => ({ findByEncounterId: vi.fn(async () => null) }),
}));


vi.mock("@/config/fhir.config", () => ({
  currentPractitionerId: "prac-1",
}));
vi.mock("@/lib/server/current-practitioner", () => ({
  getCurrentPractitioner: vi.fn(async () => ({
    id: "prac-1",
    displayName: "Lic. Ramiro Perez",
  })),
}));

vi.mock("../../../../../../lib/server/current-practitioner", () => ({
  getCurrentPractitioner: vi.fn(async () => ({
    id: "prac-1",
    displayName: "Lic. Ramiro Perez",
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function seedPlannedEncounter(encounterId: string): Encounter {
  const plannedEncounter: Encounter = {
    id: encounterId,
    status: "planned",
    episodeOfCareId: state.activeEpisode.id,
    patientId: state.patient.id,
    visitType: "follow-up",
    participant: null,
    plannedDate: "2026-03-20",
    plannedTime: "10:00",
    periodStart: "2026-03-20T13:00:00.000Z",
    reasonDisplay: "Control respiratorio",
  };

  state.encountersById.set(encounterId, plannedEncounter);
  state.vitalsByEncounterId.set(encounterId, []);
  state.evaByEncounterId.set(encounterId, []);
  state.proceduresByEncounterId.set(encounterId, []);

  return plannedEncounter;
}

describe("critical encounter-centric flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T13:45:00.000Z"));

    state.encountersById.clear();
    state.vitalsByEncounterId.clear();
    state.evaByEncounterId.clear();
    state.proceduresByEncounterId.clear();

    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("A: planned -> start -> save -> reload/remount keeps same encounterId and rehydrates persisted values", async () => {
    const encounterId = "enc-flow-a";
    seedPlannedEncounter(encounterId);

    const { startEncounterAction } = await import("../actions/start-encounter.action");
    const { saveEncounterProgressAction } = await import("../actions/save-encounter-progress.action");
    const { getEncounterDetailData } = await import("../data");

    await expect(
      startEncounterAction(state.patient.id, encounterId, "2026-03-20", "10:00"),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(encounterRepo.startEncounter).toHaveBeenCalledWith(
      expect.objectContaining({ encounterId, patientId: state.patient.id }),
    );

    const afterStart = await getEncounterDetailData(state.patient.id, encounterId);
    expect(afterStart.encounter?.status).toBe("in-progress");
    expect(afterStart.inProgressInitialValues?.encounterId).toBe(encounterId);

    await expect(
      saveEncounterProgressAction(state.patient.id, encounterId, {
        actualDate: "2026-03-20",
        actualStartTime: "10:00",
        clinicalNote: "nota persistida progreso",
        reasonDisplay: "Control respiratorio",
        heartRate: 86,
        evaScore: 5,
        procedures: [
          {
            category: "terapia-manual",
            code: "masoterapia",
            note: "progreso",
          },
        ],
      }),
    ).resolves.toEqual({ success: true });

    const reloaded = await getEncounterDetailData(state.patient.id, encounterId);
    const mapped = mapInProgressEncounterDetailToFormInitialValues(
      reloaded.inProgressInitialValues!,
    );

    expect(reloaded.encounter?.id).toBe(encounterId);
    expect(reloaded.inProgressInitialValues?.encounterId).toBe(encounterId);
    expect(mapped.clinicalNote).toBe("nota persistida progreso");
    expect(mapped.heartRate).toBe(86);
    expect(mapped.evaScore).toBe(5);
    expect(mapped.procedures).toHaveLength(1);
    expect(reloaded.vitalSigns.every((record) => record.encounterId === encounterId)).toBe(true);
    expect(reloaded.evaRecords.every((record) => record.encounterId === encounterId)).toBe(true);
  });

  it("B: in-progress -> finalize -> finished detail -> patient detail switches to lastFinished without mix", async () => {
    const encounterId = "enc-flow-b";
    const unrelatedEncounterId = "enc-unrelated";

    seedPlannedEncounter(encounterId);

    state.encountersById.set(unrelatedEncounterId, {
      id: unrelatedEncounterId,
      status: "finished",
      episodeOfCareId: state.activeEpisode.id,
      patientId: state.patient.id,
      visitType: "follow-up",
      participant: null,
      periodStart: "2026-03-19T13:00:00.000Z",
      periodEnd: "2026-03-19T13:30:00.000Z",
      actualStartAt: "2026-03-19T13:00:00.000Z",
      actualEndAt: "2026-03-19T13:30:00.000Z",
      clinicalNote: "nota otro encounter",
      reasonDisplay: "No mezclar",
    });
    state.vitalsByEncounterId.set(unrelatedEncounterId, [{
      id: "vital-unrelated",
      patientId: state.patient.id,
      encounterId: unrelatedEncounterId,
      date: "2026-03-19T13:30:00.000Z",
      recordedBy: { id: "prac-1", display: "Lic. Ramiro Perez" },
      heartRate: 61,
    }]);

    const { startEncounterAction } = await import("../actions/start-encounter.action");
    const { saveEncounterProgressAction } = await import("../actions/save-encounter-progress.action");
    const { finalizeEncounterAction } = await import("../actions/finalize-encounter.action");
    const { getEncounterDetailData } = await import("../data");
    const { getPatientDetailData } = await import("../../../data");

    await expect(
      startEncounterAction(state.patient.id, encounterId, "2026-03-20", "10:00"),
    ).rejects.toThrow("NEXT_REDIRECT");

    await expect(
      saveEncounterProgressAction(state.patient.id, encounterId, {
        actualDate: "2026-03-20",
        actualStartTime: "10:00",
        clinicalNote: "nota en curso",
        reasonDisplay: "Control respiratorio",
        heartRate: 84,
        procedures: [],
      }),
    ).resolves.toEqual({ success: true });

    const patientWhileInProgress = await getPatientDetailData(state.patient.id);
    expect(patientWhileInProgress.inProgressEncounter?.id).toBe(encounterId);
    expect(patientWhileInProgress.lastEncounter?.id).toBe(encounterId);
    expect(patientWhileInProgress.lastEncounterVitalSigns[0]?.encounterId).toBe(encounterId);

    await expect(
      finalizeEncounterAction(state.patient.id, encounterId, {
        actualDate: "2026-03-20",
        actualStartTime: "10:00",
        actualEndTime: "10:30",
        clinicalNote: "nota final encounter objetivo",
        reasonDisplay: "Control respiratorio",
        heartRate: 89,
        evaScore: 3,
        procedures: [
          {
            category: "terapia-manual",
            code: "masoterapia",
            note: "cierre",
          },
        ],
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    const finishedDetail = await getEncounterDetailData(state.patient.id, encounterId);
    expect(finishedDetail.encounter?.status).toBe("finished");
    expect(finishedDetail.encounter?.id).toBe(encounterId);
    expect(finishedDetail.inProgressInitialValues).toBeUndefined();
    expect(finishedDetail.vitalSigns[0]?.encounterId).toBe(encounterId);
    expect(finishedDetail.evaRecords[0]?.encounterId).toBe(encounterId);
    expect(finishedDetail.procedures[0]?.encounterId).toBe(encounterId);

    const patientAfterFinalize = await getPatientDetailData(state.patient.id);
    expect(patientAfterFinalize.inProgressEncounter).toBeNull();
    expect(patientAfterFinalize.lastEncounter?.id).toBe(encounterId);
    expect(patientAfterFinalize.lastEncounter?.status).toBe("finished");
    expect(patientAfterFinalize.lastEncounterVitalSigns[0]?.encounterId).toBe(encounterId);
    expect(patientAfterFinalize.lastEncounterVitalSigns[0]?.heartRate).toBe(89);
    expect(patientAfterFinalize.lastEncounterVitalSigns[0]?.encounterId).not.toBe(unrelatedEncounterId);
  });

  it("C: planned -> start -> saveProgress(partial) -> finalize(final) -> reload detail/patient side keeps a single finalized semantic snapshot", async () => {
    const encounterId = "enc-flow-c";

    seedPlannedEncounter(encounterId);

    const { startEncounterAction } = await import("../actions/start-encounter.action");
    const { saveEncounterProgressAction } = await import("../actions/save-encounter-progress.action");
    const { finalizeEncounterAction } = await import("../actions/finalize-encounter.action");
    const { getEncounterDetailData } = await import("../data");
    const { getPatientDetailData } = await import("../../../data");

    await expect(
      startEncounterAction(state.patient.id, encounterId, "2026-03-20", "10:00"),
    ).rejects.toThrow("NEXT_REDIRECT");

    await expect(
      saveEncounterProgressAction(state.patient.id, encounterId, {
        actualDate: "2026-03-20",
        actualStartTime: "10:00",
        clinicalNote: "nota parcial en curso",
        reasonDisplay: "Control respiratorio",
        heartRate: 84,
        evaScore: 6,
        procedures: [
          {
            category: "terapia-manual",
            code: "masoterapia",
            note: "snapshot parcial",
          },
        ],
      }),
    ).resolves.toEqual({ success: true });

    const partialDetail = await getEncounterDetailData(state.patient.id, encounterId);
    expect(partialDetail.encounter?.status).toBe("in-progress");
    expect(partialDetail.inProgressInitialValues?.encounterId).toBe(encounterId);
    expect(partialDetail.vitalSigns).toHaveLength(1);
    expect(partialDetail.vitalSigns[0]).toMatchObject({
      encounterId,
      heartRate: 84,
    });
    expect(partialDetail.evaRecords).toHaveLength(1);
    expect(partialDetail.evaRecords[0]).toMatchObject({
      encounterId,
      score: 6,
    });
    expect(partialDetail.procedures).toHaveLength(1);
    expect(partialDetail.procedures[0]).toMatchObject({
      encounterId,
      code: "masoterapia",
    });

    await expect(
      finalizeEncounterAction(state.patient.id, encounterId, {
        actualDate: "2026-03-20",
        actualStartTime: "10:00",
        actualEndTime: "10:30",
        clinicalNote: "nota final consolidada",
        reasonDisplay: "Control respiratorio",
        heartRate: 91,
        evaScore: 2,
        procedures: [],
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    const finishedDetail = await getEncounterDetailData(state.patient.id, encounterId);
    expect(finishedDetail.encounter?.status).toBe("finished");
    expect(finishedDetail.encounter?.clinicalNote).toBe("nota final consolidada");
    expect(finishedDetail.inProgressInitialValues).toBeUndefined();
    expect(finishedDetail.vitalSigns).toHaveLength(1);
    expect(finishedDetail.vitalSigns[0]).toMatchObject({
      encounterId,
      heartRate: 91,
    });
    expect(finishedDetail.evaRecords).toHaveLength(1);
    expect(finishedDetail.evaRecords[0]).toMatchObject({
      encounterId,
      score: 2,
    });
    expect(finishedDetail.procedures).toHaveLength(0);

    const patientAfterFinalize = await getPatientDetailData(state.patient.id);
    expect(patientAfterFinalize.inProgressEncounter).toBeNull();
    expect(patientAfterFinalize.lastEncounter?.id).toBe(encounterId);
    expect(patientAfterFinalize.lastEncounter?.status).toBe("finished");
    expect(patientAfterFinalize.lastEncounter?.clinicalNote).toBe("nota final consolidada");
    expect(patientAfterFinalize.lastEncounterVitalSigns).toHaveLength(1);
    expect(patientAfterFinalize.lastEncounterVitalSigns[0]).toMatchObject({
      encounterId,
      heartRate: 91,
    });
    expect(patientAfterFinalize.lastEncounterEvaRecords).toHaveLength(1);
    expect(patientAfterFinalize.lastEncounterEvaRecords[0]).toMatchObject({
      encounterId,
      score: 2,
    });
    expect(patientAfterFinalize.lastEncounterProcedures).toHaveLength(0);
  });
});
