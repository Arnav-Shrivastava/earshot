import { PgBoss, type SendOptions } from "pg-boss";
import { z } from "zod";

import type { Logger } from "./logger";

/**
 * Every background job Earshot runs, with the zod schema of its payload.
 * Later phases add their jobs here so producers and workers share one contract.
 */
export const JOB_SCHEMAS = {
  "health.ping": z.object({ sentAt: z.iso.datetime() }),
} as const;

export type JobName = keyof typeof JOB_SCHEMAS;
export type JobPayload<N extends JobName> = z.infer<(typeof JOB_SCHEMAS)[N]>;

export const JOB_NAMES = Object.keys(JOB_SCHEMAS) as JobName[];

export interface JobContext {
  id: string;
  /** How many times this job was retried before this attempt. */
  retryCount: number;
  /** Aborted when the worker is shutting down or the job timed out. */
  signal: AbortSignal;
}

export type JobHandler<N extends JobName> = (
  payload: JobPayload<N>,
  context: JobContext,
) => Promise<void>;

export interface QueueOptions {
  /**
   * `worker` runs maintenance and scheduling (exactly the worker process does this).
   * `producer` only enqueues, e.g. the web app.
   */
  role: "worker" | "producer";
  logger?: Pick<Logger, "error" | "warn">;
}

export interface EarshotQueue {
  /** Underlying pg-boss instance, for tests and advanced use. */
  readonly boss: PgBoss;
  /** Connects, creates pg-boss's tables if needed and registers all queues. Idempotent. */
  start(): Promise<void>;
  /** Waits for running jobs to finish, then disconnects. */
  stop(): Promise<void>;
  /** Validates the payload with the job's schema and adds it to the queue. */
  enqueue<N extends JobName>(
    name: N,
    payload: JobPayload<N>,
    options?: SendOptions,
  ): Promise<string>;
  /** Processes jobs of one type. A thrown error fails the job and triggers its retry policy. */
  work<N extends JobName>(name: N, handler: JobHandler<N>): Promise<void>;
}

export function createQueue(
  connectionString: string,
  { role, logger }: QueueOptions,
): EarshotQueue {
  const boss = new PgBoss({
    connectionString,
    application_name: `earshot-${role}`,
    // Producers must not run maintenance or schedulers.
    supervise: role === "worker",
    schedule: role === "worker",
  });

  // pg-boss emits operational errors here; without a listener they would crash the process.
  boss.on("error", (error) => logger?.error({ err: error }, "pg-boss error"));
  boss.on("warning", (warning) => logger?.warn({ warning }, "pg-boss warning"));

  return {
    boss,

    async start() {
      await boss.start();
      for (const name of JOB_NAMES) {
        await boss.createQueue(name, { retryLimit: name === "health.ping" ? 0 : 3 });
      }
    },

    async stop() {
      await boss.stop({ graceful: true, timeout: 10_000 });
    },

    async enqueue(name, payload, options) {
      const data = JOB_SCHEMAS[name].parse(payload);
      const id = await boss.send(name, data, options);
      if (!id) throw new Error(`Job ${name} was not enqueued (rejected by queue policy)`);
      return id;
    },

    async work(name, handler) {
      const schema = JOB_SCHEMAS[name];
      await boss.work(name, async (jobs) => {
        for (const job of jobs) {
          const payload = schema.parse(job.data) as JobPayload<typeof name>;
          await handler(payload, {
            id: job.id,
            retryCount: job.retryCount,
            signal: job.signal,
          });
        }
      });
    },
  };
}
