import { EnvError, loadEnv } from "@earshot/core";

// Fail fast with a readable message if required environment variables are
// missing. Skipped during `next build` so images can be built without secrets.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  try {
    loadEnv();
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}
