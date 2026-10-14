import { screen, within } from "@testing-library/react";
import GearPage from "./gear.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeGear } from "../../utils/test-fixtures";
import { listResponse, mockApi } from "../../utils/test-api";
import { selectCartItems } from "../../features/cartSlice/cartSlice";

const jacket = makeGear({ _id: "g1", name: "Alpine Blue Jacket" });
const goggles = makeGear({
  _id: "g2",
  name: "Sunrise Yellow Goggles",
  category: "goggles",
  price: 219,
});

const renderGear = () => {
  mockApi({ gear: listResponse([jacket, goggles]) });
  return renderWithProviders(<GearPage />);
};

describe("Gear page", () => {
  it("lists the catalogue with prices", async () => {
    renderGear();

    expect(
      screen.getByRole("heading", { level: 1, name: "Adventure Gear" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Alpine Blue Jacket")).toBeInTheDocument();
    expect(screen.getByText("Sunrise Yellow Goggles")).toBeInTheDocument();
    expect(screen.getByText("$199.99")).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 2 items");
  });

  it("filters by category", async () => {
    const { user } = renderGear();
    await screen.findByText("Alpine Blue Jacket");

    await user.click(screen.getByRole("button", { name: "Goggles" }));

    expect(screen.getByRole("button", { name: "Goggles" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Alpine Blue Jacket")).not.toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1 item");
  });

  it("adds an item to the cart, even for a visitor", async () => {
    const { user, store } = renderGear();

    const card = (await screen.findByText("Alpine Blue Jacket")).closest(
      "article",
    );
    if (!card) throw new Error("no card");
    await user.click(within(card).getByRole("button", { name: "Add to Cart" }));
    await user.click(within(card).getByRole("button", { name: "Add to Cart" }));

    expect(selectCartItems(store.getState())).toEqual([
      expect.objectContaining({ id: "g1", quantity: 2 }),
    ]);
  });

  it("says so when the catalogue cannot be loaded", async () => {
    mockApi({}, { failing: { gear: 500 } });
    renderWithProviders(<GearPage />);

    expect(await screen.findByText("Could not load gear")).toBeInTheDocument();
  });
});
