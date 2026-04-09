interface RunEncounterIntentOptions<TIntent extends string, TResult> {
  intent: TIntent;
  setActiveIntent: (intent: TIntent | null) => void;
  clearError: () => void;
  run: () => Promise<TResult>;
  onResult: (result: TResult) => void | Promise<void>;
  beforeRun?: () => void;
  onError?: (error: unknown) => void | Promise<void>;
  onFinally?: () => void;
}

export async function runEncounterIntent<TIntent extends string, TResult>({
  intent,
  setActiveIntent,
  clearError,
  run,
  onResult,
  beforeRun,
  onError,
  onFinally,
}: RunEncounterIntentOptions<TIntent, TResult>): Promise<void> {
  setActiveIntent(intent);
  clearError();
  beforeRun?.();

  try {
    const result = await run();
    await onResult(result);
  } catch (error: unknown) {
    if (onError) {
      await onError(error);
      return;
    }

    throw error;
  } finally {
    onFinally?.();
    setActiveIntent(null);
  }
}
