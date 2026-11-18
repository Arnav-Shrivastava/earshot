import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Integration tests start a real Postgres container (needs Docker).
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
});
