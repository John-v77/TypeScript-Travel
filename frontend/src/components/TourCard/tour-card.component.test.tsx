import { screen, waitFor } from "@testing-library/react";
import TourCard from "./tour.card.component";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour, signedInState } from "../../utils/test-fixtures";
import { dataResponse, mockApi } from "../../utils/test-api";

const tour = makeTour();

describe("TourCard", () => {
  it("shows the tour at a glance", () => {
    mockApi({});
    renderWithProviders(<TourCard tour={tour} />);

    expect(
      screen.getByRole("heading", { name: "The Sea Explorer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$599")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("7-day")).toBeInTheDocument();
    expect(screen.getByText("Miami, USA")).toBeInTheDocument();
    expect(screen.getByText("15 people")).toBeInTheDocument();
    expect(screen.getByText("4.8 (6)")).toBeInTheDocument();
    expect(screen.getByText(tour.summary)).toBeInTheDocument();
    expect(screen.getByText("May 2027")).toBeInTheDocument();
  });

  it("links to the tour by its slug", () => {
    mockApi({});
    renderWithProviders(<TourCard tour={tour} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/tour/the-sea-explorer",
    );
  });

  it("says when no dates are announced", () => {
    mockApi({});
    renderWithProviders(<TourCard tour={makeTour({ startDates: [] })} />);

    expect(screen.getByText("Dates to be announced")).toBeInTheDocument();
  });

  it("has no favourite button for a visitor", () => {
    mockApi({});
    renderWithProviders(<TourCard tour={tour} />);

    expect(
      screen.queryByRole("button", { name: /favourites/ }),
    ).not.toBeInTheDocument();
  });

  it("saves the tour as a favourite when signed in", async () => {
    const fetchMock = mockApi({ "users/my-favorites": dataResponse([]) });
    const { user } = renderWithProviders(<TourCard tour={tour} />, {
      preloadedState: signedInState(),
    });

    const heart = screen.getByRole("button", {
      name: "Save The Sea Explorer to favourites",
    });
    expect(heart).toHaveAttribute("aria-pressed", "false");

    await user.click(heart);

    await waitFor(() => {
      const posts = fetchMock.mock.calls.filter(
        ([request]) => (request as Request).method === "POST",
      );
      expect(posts).toHaveLength(1);
    });
  });

  it("shows a saved tour as pressed", async () => {
    mockApi({
      "users/my-favorites": dataResponse([
        { id: "fav-1", tour, user: "user-1" },
      ]),
    });
    renderWithProviders(<TourCard tour={tour} />, {
      preloadedState: signedInState(),
    });

    expect(
      await screen.findByRole("button", {
        name: "Remove The Sea Explorer from favourites",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
