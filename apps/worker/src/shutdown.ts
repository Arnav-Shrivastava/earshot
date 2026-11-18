export type ShutdownTask = () => Promise<void> | void;

export interface ShutdownOptions {
  /** Process or event emitter that receives signals. Injectable for tests. */
  proc?: Pick<NodeJS.Process, "on" | "exit">;
  signals?: NodeJS.Signals[];
  /** Hard limit before giving up on a stuck task. */
  timeoutMs?: number;
  log?: (message: string) => void;
}

/**
 * Registers SIGINT/SIGTERM handlers that run `tasks` once, in order, then exit.
 * Returns a function that triggers the same shutdown manually.
 */
export function registerShutdown(
  tasks: ShutdownTask[],
  {
    proc = process,
    signals = ["SIGINT", "SIGTERM"],
    timeoutMs = 10_000,
    log = () => {},
  }: ShutdownOptions = {},
): (reason?: string) => Promise<void> {
  let running: Promise<void> | undefined;

  const shutdown = (reason = "manual"): Promise<void> => {
    running ??= (async () => {
      log(`shutting down (${reason})`);
      let code = 0;
      const timer = setTimeout(() => {
        log("shutdown timed out, forcing exit");
        proc.exit(1);
      }, timeoutMs);
      timer.unref();
      for (const task of tasks) {
        try {
          await task();
        } catch (error) {
          code = 1;
          log(`shutdown task failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      clearTimeout(timer);
      proc.exit(code);
    })();
    return running;
  };

  for (const signal of signals) {
    proc.on(signal, () => void shutdown(signal));
  }
  return shutdown;
}
