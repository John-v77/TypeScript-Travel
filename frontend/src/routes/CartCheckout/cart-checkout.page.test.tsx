import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import CartCheckout from "./cart-checkout.page";
import { renderWithProviders } from "../../utils/test-utils";
import {
  cartState,
  makeCartItem,
  signedInState,
} from "../../utils/test-fixtures";
import { mockApi } from "../../utils/test-api";

const items = [
  makeCartItem({ id: "jacket", price: 200, quantity: 2 }),
  makeCartItem({ id: "boots", name: "Trail Boots", price: 100 }),
];

const renderCheckout = ({ signedIn = true, cart = items } = {}) =>
  renderWithProviders(
    <Routes>
      <Route path="/cart/checkout" element={<CartCheckout />} />
      <Route path="/auth" element={<p>Login page</p>} />
    </Routes>,
    {
      route: "/cart/checkout",
      preloadedState: {
        ...cartState(cart),
        ...(signedIn ? signedInState() : {}),
      },
    },
  );

describe("Cart checkout page", () => {
  beforeEach(() => {
    // jsdom cannot follow the redirect to Stripe and says so on the console.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sends a visitor to log in first", () => {
    mockApi({});
    renderCheckout({ signedIn: false });

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("says when there is nothing to check out", () => {
    mockApi({});
    renderCheckout({ cart: [] });

    expect(screen.getByText("Nothing to check out")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue shopping" }),
    ).toHaveAttribute("href", "/gear");
  });

  it("summarises the order", () => {
    mockApi({});
    renderCheckout();

    expect(
      screen.getByRole("heading", { level: 1, name: "Checkout" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trail Boots")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay \$500\.00/ })).toBeEnabled();
  });

  it("sends only ids and quantities, then hands off to Stripe", async () => {
    const fetchMock = mockApi({
      "gear/checkout-session": {
        status: "success",
        session: { id: "cs_1", url: "https://checkout.stripe.com/cs_1" },
      },
    });
    const { user } = renderCheckout();

    await user.click(screen.getByRole("button", { name: /Pay \$500\.00/ }));

    expect(
      await screen.findByText("Redirecting to Stripe"),
    ).toBeInTheDocument();
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe(
      "http://127.0.0.1:3000/api/v1/gear/checkout-session",
    );
    expect(await request.json()).toEqual({
      items: [
        { id: "jacket", quantity: 2 },
        { id: "boots", quantity: 1 },
      ],
    });
  });

  it("shows a fixed message when the payment cannot start", async () => {
    mockApi({}, { failing: { "gear/checkout-session": 400 } });
    const { user } = renderCheckout();

    await user.click(screen.getByRole("button", { name: /Pay \$500\.00/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't start the payment. Please try again.",
    );
  });
});
