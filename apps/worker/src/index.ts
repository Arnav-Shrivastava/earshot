import { EnvError, createLogger, loadEnv } from "@earshot/core";

import { registerShutdown } from "./shutdown";

function main(): void {
  let env;
  try {
    env = loadEnv();
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  const logger = createLogger({ name: "worker", level: env.LOG_LEVEL });
  logger.info("starting");

  // pg-boss, connectors and pipeline jobs are wired in later phases.
  const heartbeat = setInterval(() => {}, 60_000);

  registerShutdown([() => clearInterval(heartbeat)], { log: (message) => logger.info(message) });
  logger.info("ready");
}

main();
