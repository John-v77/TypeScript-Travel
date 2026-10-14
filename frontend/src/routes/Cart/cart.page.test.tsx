import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../utils/test-utils";
import { makeCartItem, signedInState } from "../../utils/test-fixtures";
import { selectCartItems } from "../../features/cartSlice/cartSlice";
import Cart from "./cart.page";

/** Reports where the router ended up, so navigation can be asserted. */
const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const cartState = (items: ReturnType<typeof makeCartItem>[]) => ({
  cart: { items, lastUpdated: Date.now(), userId: null },
});

const jacket = makeCartItem({
  id: "1",
  name: "Alpine Blue Jacket",
  price: 200,
});
const boots = makeCartItem({ id: "2", name: "Trail Boots", price: 100 });

const renderCart = (
  items = [jacket],
  { signedIn = false }: { signedIn?: boolean } = {},
) =>
  renderWithProviders(
    <>
      <Cart />
      <LocationProbe />
    </>,
    {
      preloadedState: {
        ...cartState(items),
        ...(signedIn ? signedInState() : {}),
      },
      route: "/cart",
    },
  );

describe("Cart", () => {
  it("offers the shop when empty rather than an empty table", () => {
    renderCart([]);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue shopping" }),
    ).toHaveAttribute("href", "/gear");
  });

  it("totals the line prices, not the unit prices", () => {
    renderCart([
      makeCartItem({ id: "1", price: 200, quantity: 2 }),
      makeCartItem({ id: "2", price: 100, quantity: 1 }),
    ]);

    // 200*2 + 100 = 500, shown as subtotal and total.
    expect(screen.getAllByText("$500.00").length).toBeGreaterThan(0);
  });

  describe("quantity", () => {
    it("increases", async () => {
      const { user, store } = renderCart();

      await user.click(
        screen.getByRole("button", {
          name: /increase quantity of alpine blue jacket/i,
        }),
      );

      expect(selectCartItems(store.getState())[0].quantity).toBe(2);
    });

    it("removes the line when decreased from one", async () => {
      const { user, store } = renderCart([makeCartItem({ quantity: 1 })]);

      await user.click(
        screen.getByRole("button", { name: /decrease quantity of/i }),
      );

      expect(selectCartItems(store.getState())).toHaveLength(0);
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    it("decreases when there is more than one", async () => {
      const { user, store } = renderCart([makeCartItem({ quantity: 3 })]);

      await user.click(
        screen.getByRole("button", { name: /decrease quantity of/i }),
      );

      expect(selectCartItems(store.getState())[0].quantity).toBe(2);
    });
  });

  it("removes a single line, leaving the rest", async () => {
    const { user, store } = renderCart([jacket, boots]);

    await user.click(
      screen.getByRole("button", {
        name: /remove alpine blue jacket from cart/i,
      }),
    );

    const remaining = selectCartItems(store.getState());
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe("Trail Boots");
  });

  it("empties the cart on Clear", async () => {
    const { user, store } = renderCart([jacket, boots]);

    await user.click(screen.getByRole("button", { name: "Clear cart" }));

    expect(selectCartItems(store.getState())).toHaveLength(0);
  });

  describe("checkout", () => {
    it("sends a signed-out visitor to sign in first", async () => {
      const { user } = renderCart([jacket], { signedIn: false });

      await user.click(
        screen.getByRole("button", { name: "Proceed to checkout" }),
      );

      expect(screen.getByTestId("location")).toHaveTextContent("/auth");
    });

    it("takes a signed-in visitor straight to checkout", async () => {
      const { user } = renderCart([jacket], { signedIn: true });

      await user.click(
        screen.getByRole("button", { name: "Proceed to checkout" }),
      );

      expect(screen.getByTestId("location")).toHaveTextContent(
        "/cart/checkout",
      );
    });
  });
});
