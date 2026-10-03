import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import { mockApi, toursListResponse, dataResponse } from "../../utils/test-api";
import { makeTour } from "../../utils/test-fixtures";
import ToursPage from "./tours.page";

afterEach(() => {
  vi.unstubAllGlobals();
});

const sea = makeTour({
  id: "sea",
  name: "The Sea Explorer",
  difficulty: "medium",
  duration: 7,
  price: 497,
});

const forest = makeTour({
  id: "forest",
  name: "The Forest Hiker",
  difficulty: "easy",
  duration: 5,
  price: 397,
  startLocation: { ...makeTour().startLocation, description: "Banff, CAN" },
});

const snow = makeTour({
  id: "snow",
  name: "The Snow Adventurer",
  difficulty: "difficult",
  duration: 14,
  price: 2997,
});

const renderTours = (tours = [sea, forest, snow]) => {
  mockApi({
    "tours": toursListResponse(tours),
    "users/my-favorites": dataResponse([]),
  });
  return renderWithProviders(<ToursPage />);
};

describe("ToursPage", () => {
  it("lists the tours the API returns", async () => {
    renderTours();

    expect(await screen.findByText("The Sea Explorer")).toBeInTheDocument();
    expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    expect(screen.getByText("Showing", { exact: false })).toHaveTextContent(
      "3",
    );
  });

  it("says so when the tours cannot be loaded", async () => {
    mockApi({ "users/my-favorites": dataResponse([]) }, { failing: { tours: 500 } });

    renderWithProviders(<ToursPage />);

    expect(await screen.findByText(/could not load tours/i)).toBeInTheDocument();
  });

  it("offers only the locations actually present in the data", async () => {
    renderTours();
    await screen.findByText("The Sea Explorer");

    const select = screen.getByLabelText("Location");
    // Miami from two tours, Banff from one - de-duplicated, plus "Any".
    expect(within(select).getAllByRole("option")).toHaveLength(3);
  });

  describe("filters", () => {
    it("does not apply until Apply Filters is pressed", async () => {
      // The grid must not shuffle underneath someone still choosing.
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");

      expect(screen.getByText("The Sea Explorer")).toBeInTheDocument();
      expect(screen.getByText("The Snow Adventurer")).toBeInTheDocument();
    });

    it("applies on the button", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
      expect(screen.queryByText("The Sea Explorer")).not.toBeInTheDocument();
    });

    it("filters by duration bucket", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Duration"), "11+");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      expect(screen.getByText("The Snow Adventurer")).toBeInTheDocument();
      expect(screen.queryByText("The Forest Hiker")).not.toBeInTheDocument();
    });

    it("explains an empty result rather than showing a blank grid", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");
      await user.selectOptions(screen.getByLabelText("Duration"), "11+");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));

      expect(screen.getByText("No tours found")).toBeInTheDocument();
    });
  });

  describe("Clear", () => {
    it("is disabled when there is nothing to clear", async () => {
      renderTours();
      await screen.findByText("The Sea Explorer");

      expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    });

    it("enables on an unapplied change, which is still worth undoing", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");

      expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    });

    it("restores the full list and resets the selects", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");
      await user.click(screen.getByRole("button", { name: "Apply Filters" }));
      await user.click(screen.getByRole("button", { name: "Clear" }));

      expect(screen.getByText("The Sea Explorer")).toBeInTheDocument();
      expect(screen.getByLabelText("Difficulty")).toHaveValue("");
    });
  });

  describe("sort", () => {
    it("applies immediately, because it is not a filter", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(
        screen.getByLabelText("Sort tours"),
        "price-low",
      );

      const names = screen
        .getAllByRole("heading", { level: 3 })
        .map(h => h.textContent);
      expect(names[0]).toBe("The Forest Hiker");
    });
  });
});
