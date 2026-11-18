import type { JobHandler, Logger } from "@earshot/core";

/** No-op job that proves the web -> queue -> worker path works. */
export function pingHandler(logger: Pick<Logger, "info">): JobHandler<"health.ping"> {
  return async ({ sentAt }, { id, retryCount }) => {
    const latencyMs = Date.now() - new Date(sentAt).getTime();
    logger.info({ jobId: id, sentAt, latencyMs, retryCount }, "health.ping received");
  };
}
