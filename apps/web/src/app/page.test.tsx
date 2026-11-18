import { render, screen } from "@testing-library/react";
import { PACKAGE_NAME } from "@earshot/core";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the product name and a real button", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Earshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
  });

  it("can import @earshot/core through the workspace", () => {
    expect(PACKAGE_NAME).toBe("@earshot/core");
  });
});
