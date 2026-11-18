import { EnvError, loadEnv } from "../env";
import { createQueue } from "../queue";

/** Enqueues one health.ping job. A running worker should log it. */
try {
  const env = loadEnv();
  const queue = createQueue(env.DATABASE_URL, { role: "producer" });
  await queue.start();
  const id = await queue.enqueue("health.ping", { sentAt: new Date().toISOString() });
  await queue.stop();
  process.stdout.write(`Enqueued health.ping (${id}). Check the worker logs.\n`);
} catch (error) {
  process.stderr.write(
    error instanceof EnvError
      ? `${error.message}\n`
      : `Could not enqueue: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
