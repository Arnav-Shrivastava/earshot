import { PACKAGE_NAME } from "@earshot/core";

import { registerShutdown } from "./shutdown";

function log(message: string): void {
  process.stdout.write(`[worker] ${message}\n`);
}

function main(): void {
  log(`starting (core: ${PACKAGE_NAME})`);

  // pg-boss, connectors and pipeline jobs are wired in later phases.
  const heartbeat = setInterval(() => {}, 60_000);

  registerShutdown([() => clearInterval(heartbeat)], { log });
  log("ready");
}

main();
