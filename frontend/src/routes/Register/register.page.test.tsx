import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import Register from "./register.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeUser } from "../../utils/test-fixtures";
import { mockApi } from "../../utils/test-api";
import { selectUser } from "../../features/authSlice/authStorageSlice";

const newUser = makeUser({ name: "Ana Lopez", email: "ana@example.com" });

const renderRegister = () =>
  renderWithProviders(
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { route: "/register" },
  );

const fillForm = async (user: ReturnType<typeof renderRegister>["user"]) => {
  await user.type(screen.getByLabelText("Full name"), "Ana Lopez");
  await user.type(screen.getByLabelText("Email"), "ana@example.com");
  await user.type(screen.getByLabelText("Password"), "test12345");
  await user.type(screen.getByLabelText("Confirm password"), "test12345");
  await user.click(screen.getByRole("button", { name: "Register" }));
};

describe("Register page", () => {
  it("asks for name, email and a password twice", () => {
    mockApi({});
    renderRegister();

    expect(
      screen.getByRole("heading", { name: "Create account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");
    expect(screen.getByLabelText("Confirm password")).toBeRequired();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/auth",
    );
  });

  it("signs the new account up and in, then goes home", async () => {
    const fetchMock = mockApi({
      "users/signup": {
        status: "success",
        token: "new-token",
        data: { user: newUser },
      },
    });
    const { user, store } = renderRegister();

    await fillForm(user);

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(selectUser(store.getState())).toEqual(newUser);
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(await request.json()).toEqual({
      name: "Ana Lopez",
      email: "ana@example.com",
      password: "test12345",
      passwordConfirm: "test12345",
    });
  });

  it("keeps the form and shows a fixed message when signup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockApi({}, { failing: { "users/signup": 400 } });
    const { user } = renderRegister();

    await fillForm(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Registration failed. Check your details and try again.",
    );
    expect(screen.getByLabelText("Full name")).toHaveValue("Ana Lopez");
  });
});
