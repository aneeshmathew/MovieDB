import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SprocketDivider } from "./SprocketDivider";

describe("SprocketDivider", () => {
  it("renders as an aria-hidden separator, since it's purely decorative", () => {
    render(<SprocketDivider />);
    const separator = screen.getByRole("separator", { hidden: true });
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });
});
