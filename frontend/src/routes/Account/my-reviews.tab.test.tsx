import { render, screen } from "@testing-library/react";
import MyReviews from "./my-reviews.tab";

// Mock data until the user's reviews are fetched.
describe("My reviews tab", () => {
  it("lists each review with its rating out of five", () => {
    render(<MyReviews />);

    expect(screen.getByText("The Snow Adventurer")).toBeInTheDocument();
    expect(screen.getByLabelText("5 out of 5")).toBeInTheDocument();
    expect(screen.getByLabelText("4 out of 5")).toBeInTheDocument();
  });
});
