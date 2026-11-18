import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf8");

describe("design tokens", () => {
  it.each([
    ["--ground", "#f6f6f3"],
    ["--ink", "#16181d"],
    ["--accent", "#3b5bdb"],
    ["--orange", "#e8590c"],
    ["--orange-text", "#b8470a"],
  ])("defines %s as %s", (name, value) => {
    expect(css).toContain(`${name}: ${value};`);
  });

  it("uses a 14px card radius and a 44px touch target", () => {
    expect(css).toContain("--radius-card: 14px;");
    expect(css).toContain("--touch-target: 44px;");
  });
});
