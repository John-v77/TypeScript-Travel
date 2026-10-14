import { screen } from "@testing-library/react";
import Settings from "./settings.tab";
import { renderWithProviders } from "../../utils/test-utils";
import { signedInState } from "../../utils/test-fixtures";

describe("Settings tab", () => {
  it("fills the account form from the signed-in user", () => {
    renderWithProviders(<Settings />, { preloadedState: signedInState() });

    expect(screen.getByLabelText("Name")).toHaveValue("Laura Wilson");
    expect(screen.getByLabelText("Email")).toHaveValue("laura@example.com");
  });

  it("has a password change form", () => {
    renderWithProviders(<Settings />, { preloadedState: signedInState() });

    expect(
      screen.getByRole("heading", { name: "Password change" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
  });

  // Saving is not wired to the backend yet.
  it("keeps both save buttons disabled for now", () => {
    renderWithProviders(<Settings />, { preloadedState: signedInState() });

    expect(
      screen.getByRole("button", { name: "Save settings" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Save password" }),
    ).toBeDisabled();
  });
});
