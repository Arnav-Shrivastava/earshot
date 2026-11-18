import { describe, expect, it } from "vitest";

import { DEFAULT_MIGRATIONS_FOLDER, PACKAGE_NAME } from "./index";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("@earshot/db", () => {
  it("exposes its package name", () => {
    expect(PACKAGE_NAME).toBe("@earshot/db");
  });

  it("finds its migrations folder with a journal", () => {
    expect(existsSync(join(DEFAULT_MIGRATIONS_FOLDER, "meta", "_journal.json"))).toBe(true);
  });
});
