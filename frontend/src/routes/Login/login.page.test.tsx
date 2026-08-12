import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import * as authApiSlice from "../../features/authSlice/authApiSlice";
import Login from "./login.page";

const useLoginMutationSpy = vi.spyOn(authApiSlice, "useLoginMutation");
const mockLoginTrigger = vi.fn();

type MutationState = {
  isLoading: boolean;
  error: unknown;
  isSuccess: boolean;
  data: authApiSlice.AuthResponse | undefined;
};

const mockMutationState = (overrides: Partial<MutationState> = {}) => {
  const state: MutationState = {
    isLoading: false,
    error: undefined,
    isSuccess: false,
    data: undefined,
    ...overrides,
  };
  useLoginMutationSpy.mockReturnValue([mockLoginTrigger, state] as unknown as ReturnType<
    typeof authApiSlice.useLoginMutation
  >);
};

const mockUser = {
  _id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "user",
  active: true,
};

describe("Login Component", () => {
  beforeEach(() => {
    mockLoginTrigger.mockReset();
    mockLoginTrigger.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    mockMutationState();
  });

  it("renders the login form", () => {
    renderWithProviders(<Login />);

    expect(
      screen.getByRole("heading", { name: /login/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("requires email and password", () => {
    renderWithProviders(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/password/i)).toBeRequired();
  });

  it("updates form fields when the user types", () => {
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("calls login with the form data on submit", async () => {
    renderWithProviders(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockLoginTrigger).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows a loading state while the mutation is in flight", () => {
    mockMutationState({ isLoading: true });
    renderWithProviders(<Login />);

    expect(screen.getByText(/logging in\.\.\./i)).toBeInTheDocument();
  });

  it("shows a generic error message when the mutation fails", () => {
    mockMutationState({
      error: { status: 401, data: { message: "Invalid credentials" } },
    });
    renderWithProviders(<Login />);

    expect(
      screen.getByText(/login failed\. please try again later\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("shows a success message with the user's name after login", () => {
    mockMutationState({
      isSuccess: true,
      data: {
        status: "success",
        token: "mock-token",
        data: { user: mockUser },
      },
    });
    renderWithProviders(<Login />);

    expect(screen.getByText("Login Successful!")).toBeInTheDocument();
    expect(screen.getByText(/welcome back, test user!/i)).toBeInTheDocument();
  });

  it("falls back to the default photo when the user has none", () => {
    mockMutationState({
      isSuccess: true,
      data: {
        status: "success",
        token: "mock-token",
        data: { user: mockUser },
      },
    });
    renderWithProviders(<Login />);

    expect(screen.getByRole("img", { name: "Test User" })).toHaveAttribute(
      "src",
      "/img/users/Default.jpg",
    );
  });
});
