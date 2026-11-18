import type { EarshotQueue, Logger } from "@earshot/core";

import { pingHandler } from "./health";

/** Registers every job handler this worker runs. Pipeline jobs are added in later phases. */
export async function registerJobs(
  queue: Pick<EarshotQueue, "work">,
  logger: Pick<Logger, "info">,
): Promise<void> {
  await queue.work("health.ping", pingHandler(logger));
}
