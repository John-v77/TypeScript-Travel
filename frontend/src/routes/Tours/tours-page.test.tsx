import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import Tours from "./tours.page";

describe("Tours Component", () => {
  it("renders loading state initially", () => {
    renderWithProviders(<Tours />);
    expect(screen.getByText("Loading tours...")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    expect(() => {
      renderWithProviders(<Tours />);
    }).not.toThrow();
  });

  it("has main element with correct class", () => {
    renderWithProviders(<Tours />);
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("main");
  });

  it("displays loading message in main container", () => {
    renderWithProviders(<Tours />);
    const loadingText = screen.getByText("Loading tours...");
    expect(loadingText).toBeInTheDocument();

    // Check it's inside main element
    const main = document.querySelector("main");
    expect(main).toContainElement(loadingText);
  });

  it("component structure is accessible", () => {
    renderWithProviders(<Tours />);

    // Check for semantic HTML
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("loading state has proper accessibility", () => {
    renderWithProviders(<Tours />);

    // Loading text should be visible to screen readers
    const loadingText = screen.getByText("Loading tours...");
    expect(loadingText).toBeVisible();
  });
});
