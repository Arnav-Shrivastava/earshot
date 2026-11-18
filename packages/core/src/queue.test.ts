import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createQueue, JOB_NAMES, type EarshotQueue } from "./queue";

let container: StartedPostgreSqlContainer;
const open: EarshotQueue[] = [];

beforeAll(async () => {
  container = await new PostgreSqlContainer("pgvector/pgvector:pg16").start();
});

afterEach(async () => {
  await Promise.all(open.splice(0).map((queue) => queue.stop()));
});

afterAll(async () => {
  await container?.stop();
});

async function startQueue(role: "worker" | "producer") {
  const queue = createQueue(container.getConnectionUri(), { role });
  open.push(queue);
  await queue.start();
  return queue;
}

const ping = () => ({ sentAt: new Date().toISOString() });

describe("queue (real Postgres, pg-boss)", () => {
  it("delivers an enqueued job to a worker with its validated payload", async () => {
    const worker = await startQueue("worker");
    const handler = vi.fn(async () => {});
    await worker.work("health.ping", handler);

    const payload = ping();
    const id = await worker.enqueue("health.ping", payload);

    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1), { timeout: 15_000 });
    expect(handler).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ id, retryCount: 0, signal: expect.any(AbortSignal) }),
    );
  });

  it("marks the job completed after the handler returns", async () => {
    const worker = await startQueue("worker");
    await worker.work("health.ping", async () => {});
    const id = await worker.enqueue("health.ping", ping());

    await vi.waitFor(
      async () => {
        const job = await worker.boss.getJobById("health.ping", id);
        expect(job?.state).toBe("completed");
      },
      { timeout: 15_000 },
    );
  });

  it("works across processes: a producer enqueues, a worker consumes", async () => {
    const worker = await startQueue("worker");
    const producer = await startQueue("producer");
    const handler = vi.fn(async () => {});
    await worker.work("health.ping", handler);

    await producer.enqueue("health.ping", ping());

    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1), { timeout: 15_000 });
  });

  it("fails the job, not the worker, when the handler throws", async () => {
    const worker = await startQueue("worker");
    const second = vi.fn(async () => {});
    let calls = 0;
    await worker.work("health.ping", async () => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      await second();
    });

    const failedId = await worker.enqueue("health.ping", ping());
    await vi.waitFor(
      async () => {
        const job = await worker.boss.getJobById("health.ping", failedId);
        expect(job?.state).toBe("failed");
      },
      { timeout: 15_000 },
    );

    await worker.enqueue("health.ping", ping());
    await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1), { timeout: 15_000 });
  });

  it("rejects an invalid payload before it reaches the database", async () => {
    const producer = await startQueue("producer");
    await expect(producer.enqueue("health.ping", { sentAt: "yesterday" })).rejects.toThrow(
      /Invalid ISO datetime/i,
    );
    await expect(producer.enqueue("health.ping", { nope: true } as never)).rejects.toThrow();
  });

  it("starting twice, and from two processes, is safe", async () => {
    await startQueue("worker");
    await startQueue("producer");
    const again = createQueue(container.getConnectionUri(), { role: "worker" });
    open.push(again);
    await again.start();
    await expect(again.start()).resolves.toBeUndefined();

    for (const name of JOB_NAMES) {
      expect(await again.boss.getQueue(name)).not.toBeNull();
    }
  });
});
