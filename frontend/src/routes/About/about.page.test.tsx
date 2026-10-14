import { screen } from "@testing-library/react";
import About from "./about.page";
import { renderWithProviders } from "../../utils/test-utils";

describe("About page", () => {
  it("introduces the company and its mission", () => {
    renderWithProviders(<About />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Our mission" }),
    ).toBeInTheDocument();
  });

  it("shows the figures, the timeline and the principles", () => {
    renderWithProviders(<About />);

    for (const figure of ["12k+", "9", "25", "4.7"]) {
      expect(screen.getByText(figure)).toBeInTheDocument();
    }
    for (const year of ["2015", "2019", "2023"]) {
      expect(screen.getByText(year)).toBeInTheDocument();
    }
    expect(screen.getByText("Small groups, always")).toBeInTheDocument();
    expect(screen.getByText(/Voyara started/)).toBeInTheDocument();
  });

  it("links to the tours", () => {
    renderWithProviders(<About />);

    expect(
      screen.getByRole("link", { name: /Browse the catalogue/ }),
    ).toHaveAttribute("href", "/tours");
  });
});
