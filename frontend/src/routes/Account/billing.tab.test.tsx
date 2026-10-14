import { render, screen, within } from "@testing-library/react";
import Billing from "./billing.tab";

// Mock data until billing history is fetched.
describe("Billing tab", () => {
  it("lists invoices in a table", () => {
    render(<Billing />);

    const rows = screen.getAllByRole("row");
    // Header plus two invoices.
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText("INV-1042")).toBeInTheDocument();
    expect(within(rows[1]).getByText("$794")).toBeInTheDocument();
    expect(within(rows[1]).getByText("paid")).toBeInTheDocument();
  });
});
