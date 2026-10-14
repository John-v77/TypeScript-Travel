import { render, screen } from "@testing-library/react";
import ReviewCard from "./reviewCard.component";
import { makeReview } from "../../utils/test-fixtures";

describe("ReviewCard", () => {
  it("shows the reviewer, the month and the review", () => {
    render(<ReviewCard review={makeReview()} />);

    expect(screen.getByRole("img", { name: "Max Smith" })).toHaveAttribute(
      "src",
      "/img/users/user-3.jpg",
    );
    expect(screen.getByText("Max Smith")).toBeInTheDocument();
    expect(screen.getByText("July 2026")).toBeInTheDocument();
    expect(
      screen.getByText("Every day was better than the last."),
    ).toBeInTheDocument();
  });

  it("states the rating out of five", () => {
    render(<ReviewCard review={makeReview({ rating: 4 })} />);

    expect(screen.getByLabelText("4 out of 5")).toBeInTheDocument();
  });

  it("leaves the date out when there is none", () => {
    render(<ReviewCard review={makeReview({ createdAt: undefined })} />);

    expect(screen.queryByText("July 2026")).not.toBeInTheDocument();
  });
});
