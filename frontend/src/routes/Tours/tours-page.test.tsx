import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import { mockApi, listResponse, dataResponse } from "../../utils/test-api";
import { makeTour } from "../../utils/test-fixtures";
import ToursPage from "./tours.page";
import {
  filterTours,
  formatPrice,
  formatRating,
  hasActiveFilters,
  locationOptions,
  noTourFilters,
} from "../../features/tours/tour-helpers";
import { sortItems } from "../../utils/sort-items";

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
    tours: listResponse(tours),
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
    mockApi(
      { "users/my-favorites": dataResponse([]) },
      { failing: { tours: 500 } },
    );

    renderWithProviders(<ToursPage />);

    expect(
      await screen.findByText(/could not load tours/i),
    ).toBeInTheDocument();
  });

  it("offers only the locations actually present in the data", async () => {
    renderTours();
    await screen.findByText("The Sea Explorer");

    const select = screen.getByLabelText("Location");
    // Miami from two tours, Banff from one - de-duplicated, plus "Any".
    expect(within(select).getAllByRole("option")).toHaveLength(3);
  });

  describe("filters", () => {
    it("applies as soon as a filter is chosen", async () => {
      const { user } = renderTours();
      await screen.findByText("The Sea Explorer");

      await user.selectOptions(screen.getByLabelText("Difficulty"), "easy");

      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
      expect(screen.queryByText("The Sea Explorer")).not.toBeInTheDocument();
      expect(screen.queryByText("The Snow Adventurer")).not.toBeInTheDocument();
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

const ids = (items: { id: string }[]) => items.map(item => item.id);

// The helpers behind the page's filters and sort, tested directly.
describe("tour-helpers", () => {
  const banff = { ...makeTour().startLocation, description: "Banff, CAN" };

  const sea = makeTour({
    id: "sea",
    difficulty: "medium",
    duration: 7,
    price: 599,
  });
  const forest = makeTour({
    id: "forest",
    difficulty: "easy",
    duration: 5,
    price: 899,
    startLocation: banff,
  });
  const snow = makeTour({
    id: "snow",
    difficulty: "difficult",
    duration: 14,
    price: 2599,
  });

  describe("formatting", () => {
    it("prints ratings with one decimal, and a dash when there is none", () => {
      expect(formatRating(5)).toBe("5.0");
      expect(formatRating(4.75)).toBe("4.8");
      expect(formatRating(undefined)).toBe("—");
    });

    it("prints prices as whole dollars", () => {
      expect(formatPrice(599)).toBe("$599");
      expect(formatPrice(4999)).toBe("$4,999");
      expect(formatPrice(199.99)).toBe("$200");
    });
  });

  describe("locationOptions", () => {
    it("lists each start location once, sorted", () => {
      expect(locationOptions([sea, forest, snow])).toEqual([
        "Banff, CAN",
        "Miami, USA",
      ]);
    });
  });

  describe("hasActiveFilters", () => {
    it("is false for no filters and true once one is set", () => {
      expect(hasActiveFilters(noTourFilters)).toBe(false);
      expect(hasActiveFilters({ ...noTourFilters, price: "0-500" })).toBe(true);
    });
  });

  describe("filterTours", () => {
    const all = [sea, forest, snow];

    it("returns everything with no filters", () => {
      expect(ids(filterTours(all, noTourFilters))).toEqual([
        "sea",
        "forest",
        "snow",
      ]);
    });

    it("filters by location and difficulty", () => {
      expect(
        ids(filterTours(all, { ...noTourFilters, location: "Banff, CAN" })),
      ).toEqual(["forest"]);
      expect(
        ids(filterTours(all, { ...noTourFilters, difficulty: "difficult" })),
      ).toEqual(["snow"]);
    });

    it("filters by duration bucket", () => {
      expect(
        ids(filterTours(all, { ...noTourFilters, duration: "1-5" })),
      ).toEqual(["forest"]);
      expect(
        ids(filterTours(all, { ...noTourFilters, duration: "6-10" })),
      ).toEqual(["sea"]);
      expect(
        ids(filterTours(all, { ...noTourFilters, duration: "11+" })),
      ).toEqual(["snow"]);
    });

    it("filters by price bucket, with exclusive upper bounds", () => {
      expect(
        ids(filterTours(all, { ...noTourFilters, price: "500-1000" })),
      ).toEqual(["sea", "forest"]);
      expect(
        ids(filterTours(all, { ...noTourFilters, price: "2000+" })),
      ).toEqual(["snow"]);
      expect(
        ids(
          filterTours([makeTour({ id: "edge", price: 1000 })], {
            ...noTourFilters,
            price: "500-1000",
          }),
        ),
      ).toEqual([]);
    });

    it("combines filters", () => {
      expect(
        ids(
          filterTours(all, {
            ...noTourFilters,
            difficulty: "medium",
            price: "2000+",
          }),
        ),
      ).toEqual([]);
    });
  });
});

describe("sort-items", () => {
  const cheapTop = {
    id: "a",
    price: 100,
    ratingsAverage: 5,
    ratingsQuantity: 2,
  };
  const dearMid = {
    id: "b",
    price: 900,
    ratingsAverage: 4,
    ratingsQuantity: 9,
  };
  const midTopPopular = {
    id: "c",
    price: 500,
    ratingsAverage: 5,
    ratingsQuantity: 20,
  };
  const list = [cheapTop, dearMid, midTopPopular];

  describe("sortItems", () => {
    it("sorts by price both ways", () => {
      expect(ids(sortItems(list, "price-low"))).toEqual(["a", "c", "b"]);
      expect(ids(sortItems(list, "price-high"))).toEqual(["b", "c", "a"]);
    });

    it("sorts by rating both ways", () => {
      expect(ids(sortItems(list, "rating-low"))[0]).toBe("b");
      expect(ids(sortItems(list, "rating-high"))[2]).toBe("b");
    });

    it("features the highest rated first, then the most reviewed", () => {
      expect(ids(sortItems(list, "featured"))).toEqual(["c", "a", "b"]);
    });

    it("treats a missing rating as zero", () => {
      expect(
        ids(sortItems([{ id: "x", price: 1 }, cheapTop], "rating-high")),
      ).toEqual(["a", "x"]);
    });

    it("never sorts the caller's list in place", () => {
      const original = [...list];
      sortItems(list, "price-high");
      expect(list).toEqual(original);
    });
  });
});
