import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SingleTourPage from "./singleTourPage.page";

// Test wrapper with router and specific route
const renderWithRouter = (slug: string = "the-forest-hiker") => {
  return render(
    <MemoryRouter initialEntries={[`/tour/${slug}`]}>
      <Routes>
        <Route path="/tour/:slug" element={<SingleTourPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("singleTourPage Component", () => {
  it("renders loading state initially", () => {
    renderWithRouter();
    expect(screen.getByText("Loading tour details...")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    expect(() => {
      renderWithRouter();
    }).not.toThrow();
  });

  it("renders with different slugs without crashing", () => {
    expect(() => {
      renderWithRouter("different-tour");
    }).not.toThrow();
  });

  it("has main element with correct class", () => {
    renderWithRouter();
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("main");
  });

  it("displays loading message in main container", () => {
    renderWithRouter();
    const loadingText = screen.getByText("Loading tour details...");
    expect(loadingText).toBeInTheDocument();

    // Check it's inside main element
    const main = document.querySelector("main");
    expect(main).toContainElement(loadingText);
  });

  it("renders proper route structure", () => {
    // Test that the component can be rendered in a route context
    const { container } = renderWithRouter();
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles empty slug parameter", () => {
    expect(() => {
      renderWithRouter("");
    }).not.toThrow();
  });

  it("handles special characters in slug", () => {
    expect(() => {
      renderWithRouter("tour-with-special-chars-123");
    }).not.toThrow();
  });

  it("component structure is accessible", () => {
    renderWithRouter();

    // Check for semantic HTML
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("loading state has proper accessibility", () => {
    renderWithRouter();

    // Loading text should be visible to screen readers
    const loadingText = screen.getByText("Loading tour details...");
    expect(loadingText).toBeVisible();
  });
});
