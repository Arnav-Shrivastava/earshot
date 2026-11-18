import { describe, expect, it, vi } from "vitest";

import { pingHandler } from "./health";
import { registerJobs } from "./index";

const context = { id: "job-1", retryCount: 0, signal: new AbortController().signal };

describe("pingHandler", () => {
  it("logs the job with its latency", async () => {
    const logger = { info: vi.fn() };
    const sentAt = new Date(Date.now() - 250).toISOString();

    await pingHandler(logger)({ sentAt }, context);

    expect(logger.info).toHaveBeenCalledTimes(1);
    const [fields, message] = logger.info.mock.calls[0] ?? [];
    expect(message).toBe("health.ping received");
    expect(fields).toMatchObject({ jobId: "job-1", sentAt, retryCount: 0 });
    expect(fields.latencyMs).toBeGreaterThanOrEqual(250);
  });
});

describe("registerJobs", () => {
  it("registers a handler for every job this worker runs", async () => {
    const work = vi.fn(async (_name: string, _handler: unknown) => {});
    await registerJobs({ work }, { info: vi.fn() });
    expect(work.mock.calls.map(([name]) => name)).toEqual(["health.ping"]);
  });
});
