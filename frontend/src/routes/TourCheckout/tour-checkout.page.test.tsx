import { screen, waitFor } from "@testing-library/react";
import TourCheckout from "./tour-checkout.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour, signedInState } from "../../utils/test-fixtures";
import { mockApi } from "../../utils/test-api";

const tour = makeTour({ id: "tour-1", price: 599 });
const booking = {
  checkIn: "2027-05-01T09:00:00.000Z",
  checkOut: "2027-05-08T09:00:00.000Z",
  guests: 2,
  tour,
};

const renderCheckout = ({
  signedIn = true,
  state = booking,
}: { signedIn?: boolean; state?: typeof booking | null } = {}) =>
  renderWithProviders(<TourCheckout />, {
    route: "/checkout/the-sea-explorer",
    path: "/checkout/:slug",
    state,
    preloadedState: signedIn ? signedInState() : {},
  });

describe("Tour checkout page", () => {
  beforeEach(() => {
    // jsdom cannot follow the redirect to Stripe and says so on the console.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("asks a visitor to log in", () => {
    mockApi({});
    renderCheckout({ signedIn: false });

    expect(screen.getByText("Authentication required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("sends anyone who arrives without a booking back to start again", () => {
    mockApi({});
    renderCheckout({ state: null });

    expect(screen.getByText("No booking details")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start booking" }),
    ).toBeInTheDocument();
  });

  it("summarises the booking and the price", () => {
    mockApi({});
    renderCheckout();

    expect(
      screen.getByRole("heading", { name: "Confirm your booking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("May 1, 2027")).toBeInTheDocument();
    expect(screen.getByText("May 8, 2027")).toBeInTheDocument();
    expect(screen.getByText("7 nights")).toBeInTheDocument();
    expect(screen.getByText("2 guests")).toBeInTheDocument();
    expect(screen.getByText(/Service fee \$54 x 2/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pay $1,306" }),
    ).toBeInTheDocument();
  });

  it("opens a Stripe session for the date and guests", async () => {
    const fetchMock = mockApi({
      "bookings/checkout-session/tour-1": {
        status: "success",
        session: { id: "cs_1", url: "https://checkout.stripe.com/cs_1" },
      },
    });
    const { user } = renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pay $1,306" }));

    expect(
      await screen.findByText("Redirecting to Stripe"),
    ).toBeInTheDocument();
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toBe(
      "http://127.0.0.1:3000/api/v1/bookings/checkout-session/tour-1",
    );
    expect(await request.json()).toEqual({
      selectedDate: "2027-05-01T09:00:00.000Z",
      guests: 2,
    });
  });

  it("shows a fixed message when checkout cannot start, and lets you retry", async () => {
    mockApi({}, { failing: { "bookings/checkout-session": 400 } });
    const { user } = renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pay $1,306" }));

    expect(
      await screen.findByRole("heading", { name: "Checkout could not start" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We couldn't start the payment. Please try again."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Pay $1,306" }),
      ).toBeInTheDocument();
    });
  });
});
