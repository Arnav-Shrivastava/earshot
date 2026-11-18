import { describe, expect, it } from "vitest";
import { DEPENDS_ON, PACKAGE_NAME } from "./index";

describe("@earshot/db", () => {
  it("exposes its package name", () => {
    expect(PACKAGE_NAME).toBe("@earshot/db");
  });

  it("can import @earshot/core through the workspace", () => {
    expect(DEPENDS_ON).toEqual(["@earshot/core"]);
  });
});
