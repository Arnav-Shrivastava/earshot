import { EnvError, loadEnv } from "@earshot/core";

import { runMigrations } from "./migrate";

try {
  const env = loadEnv();
  await runMigrations(env.DATABASE_URL);
  process.stdout.write("Migrations applied.\n");
} catch (error) {
  if (error instanceof EnvError) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }
  process.exit(1);
}
