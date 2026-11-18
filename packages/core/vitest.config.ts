import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The queue tests start a real Postgres container (needs Docker).
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
});
