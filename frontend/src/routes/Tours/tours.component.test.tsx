import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Tours from "./tours.component";

// Test wrapper with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Tours Component", () => {
  it("renders loading state initially", () => {
    renderWithRouter(<Tours />);
    expect(screen.getByText("Loading tours...")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    expect(() => {
      renderWithRouter(<Tours />);
    }).not.toThrow();
  });

  it("has main element with correct class", () => {
    renderWithRouter(<Tours />);
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("main");
  });

  it("displays loading message in main container", () => {
    renderWithRouter(<Tours />);
    const loadingText = screen.getByText("Loading tours...");
    expect(loadingText).toBeInTheDocument();

    // Check it's inside main element
    const main = document.querySelector("main");
    expect(main).toContainElement(loadingText);
  });

  it("component structure is accessible", () => {
    renderWithRouter(<Tours />);

    // Check for semantic HTML
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("loading state has proper accessibility", () => {
    renderWithRouter(<Tours />);

    // Loading text should be visible to screen readers
    const loadingText = screen.getByText("Loading tours...");
    expect(loadingText).toBeVisible();
  });
});
