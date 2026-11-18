import { EnvError, createLogger, createQueue, loadEnv, type Env } from "@earshot/core";

import { registerJobs } from "./jobs";
import { registerShutdown } from "./shutdown";

function readEnv(): Env {
  try {
    return loadEnv();
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const env = readEnv();
  const logger = createLogger({ name: "worker", level: env.LOG_LEVEL });
  logger.info("starting");

  const queue = createQueue(env.DATABASE_URL, { role: "worker", logger });
  await queue.start();
  await registerJobs(queue, logger);

  registerShutdown([() => queue.stop()], { log: (message) => logger.info(message) });
  logger.info("ready");
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Worker failed to start: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
