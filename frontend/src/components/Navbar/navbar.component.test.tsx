import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./navbar.component";
import type { RootState } from "../../app/store";
import { renderWithProviders } from "../../utils/test-utils";
import {
  cartState,
  makeCartItem,
  signedInState,
} from "../../utils/test-fixtures";
import { selectUser } from "../../features/authSlice/authStorageSlice";
import { selectCartItems } from "../../features/cartSlice/cartSlice";

/** Navbar is a layout route, so it renders around an outlet. */
const renderNavbar = ({
  route = "/tours",
  preloadedState = {},
}: {
  route?: string;
  preloadedState?: Partial<RootState>;
} = {}) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route path="*" element={<p>Page content</p>} />
      </Route>
    </Routes>,
    { route, preloadedState },
  );

describe("Navbar", () => {
  it("shows the logo, the main links and the page below it", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: "Voyara" })).toHaveAttribute(
      "href",
      "/",
    );
    const nav = within(screen.getByRole("navigation"));
    for (const name of ["Home", "Tours", "Gear"]) {
      expect(nav.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("offers Sign In to a visitor", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/auth",
    );
    expect(
      screen.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
  });

  it("shows the account link and Logout when signed in", () => {
    renderNavbar({ preloadedState: signedInState() });

    expect(screen.getByRole("link", { name: "My Account" })).toHaveAttribute(
      "href",
      "/myaccount",
    );
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign In" }),
    ).not.toBeInTheDocument();
  });

  it("logs out and clears the local cart", async () => {
    const { user, store } = renderNavbar({
      preloadedState: { ...signedInState(), ...cartState() },
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(selectUser(store.getState())).toBeNull();
    expect(selectCartItems(store.getState())).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
  });

  it("counts every item in the cart on the badge", () => {
    renderNavbar({
      preloadedState: cartState([
        makeCartItem({ id: "a", quantity: 2 }),
        makeCartItem({ id: "b", quantity: 1 }),
      ]),
    });

    const cart = screen.getByRole("link", { name: "Cart, 3 items" });
    expect(cart).toHaveAttribute("href", "/cart");
    expect(within(cart).getByText("3")).toBeInTheDocument();
  });

  it("shows no badge for an empty cart", () => {
    renderNavbar({ preloadedState: cartState([]) });

    expect(
      within(screen.getByRole("link", { name: "Cart, 0 items" })).queryByText(
        "0",
      ),
    ).not.toBeInTheDocument();
  });

  it("toggles the theme", async () => {
    const { user } = renderNavbar();

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("opens and closes the mobile menu", async () => {
    const { user } = renderNavbar();
    const toggle = screen.getByRole("button", { name: "Toggle menu" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
