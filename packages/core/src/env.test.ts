import { describe, expect, it } from "vitest";

import { EnvError, loadEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://earshot:earshot@localhost:5432/earshot",
  EARSHOT_SECRET: "x".repeat(32),
};

describe("loadEnv", () => {
  it("accepts a valid environment and applies defaults", () => {
    const env = loadEnv(valid);
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("treats empty strings as unset so .env templates work", () => {
    const env = loadEnv({ ...valid, APP_URL: "", LOG_LEVEL: "" });
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("reports every missing required variable in one error", () => {
    const run = () => loadEnv({});
    expect(run).toThrow(EnvError);
    expect(run).toThrow(/DATABASE_URL is required/);
    expect(run).toThrow(/EARSHOT_SECRET is required/);
  });

  it("rejects malformed values with a clear message", () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: "mysql://nope" })).toThrow(/postgres/);
    expect(() => loadEnv({ ...valid, EARSHOT_SECRET: "short" })).toThrow(/at least 32/);
    expect(() => loadEnv({ ...valid, LOG_LEVEL: "loud" })).toThrow(/LOG_LEVEL/);
    expect(() => loadEnv({ ...valid, APP_URL: "not a url" })).toThrow(/APP_URL/);
  });
});
