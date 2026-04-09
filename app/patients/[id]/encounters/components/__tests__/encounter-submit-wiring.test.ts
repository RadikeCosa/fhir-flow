import { describe, expect, it, vi } from "vitest";

import { runEncounterIntent } from "../encounter-submit-wiring";

describe("runEncounterIntent", () => {
  it("wires begin/clear/run/result/finalize in order", async () => {
    const steps: string[] = [];
    const setActiveIntent = vi.fn((intent: string | null) => {
      steps.push(`intent:${intent ?? "null"}`);
    });

    await runEncounterIntent({
      intent: "start",
      setActiveIntent,
      clearError: () => steps.push("clearError"),
      beforeRun: () => steps.push("beforeRun"),
      run: async () => {
        steps.push("run");
        return { success: true };
      },
      onResult: () => {
        steps.push("onResult");
      },
      onFinally: () => steps.push("onFinally"),
    });

    expect(steps).toEqual([
      "intent:start",
      "clearError",
      "beforeRun",
      "run",
      "onResult",
      "onFinally",
      "intent:null",
    ]);
  });

  it("routes thrown errors to onError and still clears intent", async () => {
    const setActiveIntent = vi.fn();
    const onError = vi.fn();

    await runEncounterIntent({
      intent: "finalize",
      setActiveIntent,
      clearError: vi.fn(),
      run: async () => {
        throw new Error("boom");
      },
      onResult: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(setActiveIntent).toHaveBeenNthCalledWith(1, "finalize");
    expect(setActiveIntent).toHaveBeenNthCalledWith(2, null);
  });
});
