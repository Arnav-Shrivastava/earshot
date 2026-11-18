import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index";

describe("@earshot/widget", () => {
  it("exposes its package name", () => {
    expect(PACKAGE_NAME).toBe("@earshot/widget");
  });
});
