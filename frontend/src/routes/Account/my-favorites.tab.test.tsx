import { screen } from "@testing-library/react";
import MyFavorites from "./my-favorites.tab";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour, signedInState } from "../../utils/test-fixtures";
import { dataResponse, mockApi } from "../../utils/test-api";

describe("My favorites tab", () => {
  it("shows the saved tours as cards", async () => {
    mockApi({
      "users/my-favorites": dataResponse([
        { id: "fav-1", tour: makeTour(), user: "user-1" },
        // A saved tour that was deleted since comes back as null.
        { id: "fav-2", tour: null, user: "user-1" },
      ]),
    });
    renderWithProviders(<MyFavorites />, { preloadedState: signedInState() });

    expect(
      await screen.findByRole("heading", { name: "The Sea Explorer" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("points to the tours when nothing is saved", async () => {
    mockApi({ "users/my-favorites": dataResponse([]) });
    renderWithProviders(<MyFavorites />, { preloadedState: signedInState() });

    expect(
      await screen.findByText("You haven't saved any tours yet."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse tours" })).toHaveAttribute(
      "href",
      "/tours",
    );
  });
});
