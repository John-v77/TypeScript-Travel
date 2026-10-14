import { render, screen } from "@testing-library/react";
import MyBookings from "./my-bookings.tab";

// Mock data until the bookings feature is built.
describe("My bookings tab", () => {
  it("lists each booking with its date, party size, price and status", () => {
    render(<MyBookings />);

    expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    const forestHiker = screen.getByText("The Forest Hiker").closest("li");
    expect(forestHiker).toHaveTextContent("November 12, 2026");
    expect(forestHiker).toHaveTextContent("2 people");
    expect(screen.getByText("$794")).toBeInTheDocument();
    expect(screen.getByText("upcoming")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
});
