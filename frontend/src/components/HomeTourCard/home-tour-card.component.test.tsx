import { screen } from "@testing-library/react";
import HomeTourCard from "./home-tour-card.component";
import { renderWithProviders } from "../../utils/test-utils";
import { makeTour } from "../../utils/test-fixtures";

const renderCard = (tour = makeTour()) =>
  renderWithProviders(
    <ul>
      <HomeTourCard tour={tour} />
    </ul>,
  );

describe("HomeTourCard", () => {
  it("shows the tour's name, price, duration and start", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: "The Sea Explorer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$599")).toBeInTheDocument();
    expect(screen.getByText("7 days from Miami, USA")).toBeInTheDocument();
  });

  it("links to the tour by its slug", () => {
    renderCard(makeTour({ id: "abc123", slug: "the-sea-explorer" }));

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/tour/the-sea-explorer",
    );
  });
});
