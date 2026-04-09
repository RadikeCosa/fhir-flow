import { describe, expect, it } from "vitest";
import {
  applyClinicalEncounterIntentRefinement,
  clinicalEncounterBaseSchema,
} from "../schema";

const intentSchema = (mode: "save-progress" | "complete") =>
  clinicalEncounterBaseSchema.superRefine((data, ctx) => {
    applyClinicalEncounterIntentRefinement(data, ctx, {
      requireActualDate: true,
      requireActualStartTime: true,
      requireActualEndTime: mode === "complete",
      requireClinicalNote: mode === "complete",
    });
  });

describe("clinicalEncounterBaseSchema intent refinements", () => {
  it("requires date/start time for save-progress", () => {
    const result = intentSchema("save-progress").safeParse({ procedures: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.actualDate).toBeTruthy();
      expect(result.error.flatten().fieldErrors.actualStartTime).toBeTruthy();
    }
  });

  it("requires end time and clinical note for complete", () => {
    const result = intentSchema("complete").safeParse({
      actualDate: "2026-04-08",
      actualStartTime: "10:00",
      procedures: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.actualEndTime).toBeTruthy();
      expect(result.error.flatten().fieldErrors.clinicalNote).toBeTruthy();
    }
  });

  it("keeps vitals optional but validates blood pressure pair when informed", () => {
    const result = intentSchema("save-progress").safeParse({
      actualDate: "2026-04-08",
      actualStartTime: "10:00",
      bloodPressureSystolic: 120,
      procedures: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.bloodPressureDiastolic).toContain(
        "Si se indica presión arterial, debe completarse tanto sistólica como diastólica.",
      );
    }
  });
});
