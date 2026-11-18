import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createLogger } from "./logger";

function capture() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { lines, destination };
}

describe("createLogger", () => {
  it("writes JSON lines with the logger name", () => {
    const { lines, destination } = capture();
    createLogger({ name: "test", destination }).info({ foo: "bar" }, "hello");
    const entry = JSON.parse(lines[0] ?? "{}");
    expect(entry).toMatchObject({ name: "test", foo: "bar", msg: "hello" });
  });

  it("redacts secrets at the top level and when nested", () => {
    const { lines, destination } = capture();
    createLogger({ destination }).info(
      {
        apiKey: "sk-top",
        openai: { apiKey: "sk-nested" },
        req: { headers: { authorization: "Bearer abc", "x-api-key": "ek_123" } },
        user: { password: "hunter2" },
      },
      "request",
    );
    const output = lines.join("");
    for (const secret of ["sk-top", "sk-nested", "Bearer abc", "ek_123", "hunter2"]) {
      expect(output).not.toContain(secret);
    }
    expect(output).toContain("[redacted]");
  });

  it("respects the log level", () => {
    const { lines, destination } = capture();
    createLogger({ level: "warn", destination }).info("quiet");
    expect(lines).toHaveLength(0);
  });
});
