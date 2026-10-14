import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import MyAccount from "./my-account.page";
import { renderWithProviders } from "../../utils/test-utils";
import { signedInState } from "../../utils/test-fixtures";

const renderAccount = (signedIn = true) =>
  renderWithProviders(
    <Routes>
      <Route path="/myaccount" element={<MyAccount />}>
        <Route path="settings" element={<p>Settings tab</p>} />
      </Route>
      <Route path="/auth" element={<p>Login page</p>} />
    </Routes>,
    {
      route: "/myaccount/settings",
      preloadedState: signedIn ? signedInState() : {},
    },
  );

describe("My account", () => {
  it("sends a visitor to log in", () => {
    renderAccount(false);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("shows the user, the tabs and the selected tab", () => {
    renderAccount();

    expect(
      screen.getByRole("heading", { name: "My account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Laura Wilson")).toBeInTheDocument();
    for (const [name, href] of [
      ["Settings", "/myaccount/settings"],
      ["My bookings", "/myaccount/my-bookings"],
      ["My favorites", "/myaccount/my-favorites"],
      ["My reviews", "/myaccount/my-reviews"],
      ["Billing", "/myaccount/billing"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(screen.getByText("Settings tab")).toBeInTheDocument();
  });

  it("marks the open tab as current", () => {
    renderAccount();

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Billing" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
