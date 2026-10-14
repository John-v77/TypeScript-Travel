import { screen, within } from "@testing-library/react";
import { App } from "./App";
import { renderWithProviders } from "./utils/test-utils";
import { makeTour } from "./utils/test-fixtures";
import { listResponse, mockApi } from "./utils/test-api";

/** The app at "/", with the home page's tours request answered. */
const renderApp = () => {
  mockApi({ tours: listResponse([makeTour()]) });
  return renderWithProviders(<App />);
};

describe("App", () => {
  it("renders the home page under the navbar", () => {
    renderApp();

    expect(screen.getByRole("link", { name: "Voyara" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Outdoors is where life happens",
      }),
    ).toBeInTheDocument();
  });

  it("shows the main navigation and Sign In for a visitor", () => {
    renderApp();

    const nav = within(screen.getByRole("navigation"));
    expect(nav.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Tours" })).toBeInTheDocument();
    expect(nav.getByRole("link", { name: "Gear" })).toBeInTheDocument();
    expect(
      nav.getAllByRole("link", { name: "Sign In" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the footer", () => {
    renderApp();

    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByText("Voyara")).toBeInTheDocument();
    expect(footer.getByRole("link", { name: "About Us" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("switches the whole app to dark mode from the theme button", async () => {
    const { user, container } = renderApp();
    const root = container.firstElementChild;

    expect(root).toHaveAttribute("data-theme", "light");

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(root).toHaveAttribute("data-theme", "dark");
  });
});
