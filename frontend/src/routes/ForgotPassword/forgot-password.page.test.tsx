import { screen } from "@testing-library/react";
import ForgotPassword from "./forgot-password.page";
import { renderWithProviders } from "../../utils/test-utils";
import { mockApi } from "../../utils/test-api";

describe("Forgot password page", () => {
  it("sends a reset link and confirms the address", async () => {
    const fetchMock = mockApi({
      "users/forgotPassword": { status: "success", message: "Token sent!" },
    });
    const { user } = renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Reset link sent")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(await request.json()).toEqual({ email: "ana@example.com" });
  });

  it("keeps the address and shows a fixed message when it fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockApi({}, { failing: { "users/forgotPassword": 404 } });
    const { user } = renderWithProviders(<ForgotPassword />);

    await user.type(screen.getByLabelText("Email"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to send the reset link. Check the address and try again.",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com");
  });

  it("links back to login", () => {
    mockApi({});
    renderWithProviders(<ForgotPassword />);

    expect(screen.getByRole("link", { name: "Back to login" })).toHaveAttribute(
      "href",
      "/auth",
    );
  });
});
