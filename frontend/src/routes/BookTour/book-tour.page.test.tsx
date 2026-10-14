import { screen, within } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import BookTour from "./book-tour.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour } from "../../utils/test-fixtures";
import { dataResponse, mockApi } from "../../utils/test-api";

const tour = makeTour({
  id: "tour-1",
  price: 599,
  maxGroupSize: 15,
  startDates: [
    {
      _id: "a",
      id: "a",
      date: "2027-05-01T09:00:00.000Z",
      participants: 12,
      soldOut: false,
    },
    {
      _id: "b",
      id: "b",
      date: "2027-06-01T09:00:00.000Z",
      participants: 15,
      soldOut: true,
    },
  ],
});

/** Shows what the booking page handed the checkout page. */
const CheckoutProbe = () => {
  const { pathname, state } = useLocation() as {
    pathname: string;
    state: unknown;
  };
  return (
    <p data-testid="checkout">
      {pathname} {JSON.stringify(state)}
    </p>
  );
};

const renderBooking = (bookedTour = tour) => {
  mockApi({ "tours/the-sea-explorer": dataResponse(bookedTour) });
  return renderWithProviders(
    <Routes>
      <Route path="/tour/:slug/book" element={<BookTour />} />
      <Route path="/checkout/:slug" element={<CheckoutProbe />} />
    </Routes>,
    { route: "/tour/the-sea-explorer/book" },
  );
};

describe("Book tour page", () => {
  it("shows the tour and its price per person", async () => {
    renderBooking();

    expect(
      await screen.findByRole("heading", { level: 1, name: tour.name }),
    ).toBeInTheDocument();
    expect(screen.getByText("per person")).toBeInTheDocument();
    expect(screen.getByText("Tour hosted by Voyara")).toBeInTheDocument();
  });

  it("offers the departures, with sold-out ones disabled", async () => {
    renderBooking();

    const departure = await screen.findByLabelText("Departure");
    const may = within(departure).getByRole("option", { name: "May 1, 2027" });
    const june = within(departure).getByRole("option", {
      name: "June 1, 2027 - sold out",
    });
    expect(may).toBeEnabled();
    expect(june).toBeDisabled();
  });

  it("caps the guests at the places left on the chosen date", async () => {
    const { user } = renderBooking();

    await user.selectOptions(
      await screen.findByLabelText("Departure"),
      "2027-05-01T09:00:00.000Z",
    );

    // 15 places, 12 taken.
    expect(
      within(screen.getByLabelText("Guests")).getAllByRole("option"),
    ).toHaveLength(3);
    expect(screen.getByText(/Returns/)).toHaveTextContent("May 8, 2027");
  });

  it("adds a 9% service fee per guest to the total", async () => {
    const { user } = renderBooking();

    await user.selectOptions(await screen.findByLabelText("Guests"), "2");

    // $599 x 2 = $1,198; fee $54 x 2 = $108; total $1,306.
    expect(screen.getByText("$1,198")).toBeInTheDocument();
    expect(screen.getByText(/Service fee \$54 x 2/)).toBeInTheDocument();
    expect(screen.getByText("$108")).toBeInTheDocument();
    expect(screen.getByText("$1,306")).toBeInTheDocument();
  });

  it("only allows Reserve once a date is chosen", async () => {
    renderBooking();

    expect(
      await screen.findByRole("button", { name: "Reserve" }),
    ).toBeDisabled();
  });

  it("hands the departure, guests and tour to the checkout", async () => {
    const { user } = renderBooking();

    await user.selectOptions(
      await screen.findByLabelText("Departure"),
      "2027-05-01T09:00:00.000Z",
    );
    await user.selectOptions(screen.getByLabelText("Guests"), "2");
    await user.click(screen.getByRole("button", { name: "Reserve" }));

    const checkout = screen.getByTestId("checkout");
    expect(checkout).toHaveTextContent("/checkout/the-sea-explorer");
    expect(checkout).toHaveTextContent('"checkIn":"2027-05-01T09:00:00.000Z"');
    expect(checkout).toHaveTextContent('"guests":2');
  });

  it("says when every departure is sold out", async () => {
    renderBooking(
      makeTour({
        id: "tour-1",
        startDates: [{ ...tour.startDates[1] }],
      }),
    );

    expect(
      await screen.findByText("Every departure for this tour is sold out."),
    ).toBeInTheDocument();
  });

  it("says so when the tour cannot be found", async () => {
    mockApi({}, { failing: { "tours/the-sea-explorer": 404 } });
    renderWithProviders(<BookTour />, {
      route: "/tour/the-sea-explorer/book",
      path: "/tour/:slug/book",
    });

    expect(await screen.findByText("Tour not found")).toBeInTheDocument();
  });
});
