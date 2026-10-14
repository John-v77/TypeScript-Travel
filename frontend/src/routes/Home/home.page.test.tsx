import { screen, within } from "@testing-library/react";
import Home from "./home.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour } from "../../utils/test-fixtures";
import { listResponse, mockApi } from "../../utils/test-api";

const fiveTours = [1, 2, 3, 4, 5].map(n =>
  makeTour({ id: `tour-${String(n)}`, name: `Tour ${String(n)}` }),
);

describe("Home page", () => {
  it("leads with the hero and a link to the tours", () => {
    mockApi({ tours: listResponse(fiveTours) });
    renderWithProviders(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Outdoors is where life happens",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Discover our tours/ }),
    ).toHaveAttribute("href", "/tours");
  });

  it("features the first four tours", async () => {
    mockApi({ tours: listResponse(fiveTours) });
    renderWithProviders(<Home />);

    const featured = await screen.findByRole("list", {
      name: "Featured tours",
    });
    const cards = within(featured).getAllByRole("listitem");
    expect(cards).toHaveLength(4);
    expect(within(featured).queryByText("Tour 5")).not.toBeInTheDocument();
  });

  it("shows three most popular tours", async () => {
    mockApi({ tours: listResponse(fiveTours) });
    renderWithProviders(<Home />);

    expect(
      await screen.findByRole("heading", { name: "Most popular tours" }),
    ).toBeInTheDocument();
    // Tours 1-3 appear twice: once featured, once in the popular grid.
    expect(await screen.findAllByText("Tour 1")).toHaveLength(2);
    expect(screen.getAllByText("Tour 4")).toHaveLength(1);
  });

  it("still renders when the tours request fails", async () => {
    mockApi({}, { failing: { tours: 500 } });
    renderWithProviders(<Home />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Outdoors is where life happens",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Featured tours" }),
    ).not.toBeInTheDocument();
  });
});
