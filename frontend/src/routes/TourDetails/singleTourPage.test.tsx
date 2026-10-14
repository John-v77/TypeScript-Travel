import { screen, waitFor, within } from "@testing-library/react";
import TourDetails from "./singleTourPage.page";
import { renderWithProviders } from "../../utils/test-utils";
import { makeReview, makeTour, signedInState } from "../../utils/test-fixtures";
import { dataResponse, listResponse, mockApi } from "../../utils/test-api";

// The map needs WebGL, which jsdom does not have; it has its own test.
vi.mock("../../components/TourMap/tour-map.component", () => ({
  default: () => <div data-testid="tour-map" />,
}));

const tour = makeTour({ id: "tour-1" });

const renderPage = ({
  signedIn = false,
  bookedTourIds = [] as string[],
  reviews = [makeReview()],
  failing = {},
} = {}) => {
  const fetchMock = mockApi(
    {
      "tours/tour-1/reviews": listResponse(reviews),
      "tours/the-sea-explorer": dataResponse(tour),
      "users/my-favorites": dataResponse([]),
      "users/my-bookings": listResponse(
        bookedTourIds.map(id => ({
          _id: `booking-${id}`,
          tour: { id, name: "A tour" },
          price: 599,
          selectedDate: "2027-05-01T09:00:00.000Z",
          paid: true,
        })),
      ),
    },
    { failing },
  );
  const rendered = renderWithProviders(<TourDetails />, {
    route: "/tour/the-sea-explorer",
    path: "/tour/:slug",
    preloadedState: signedIn ? signedInState() : {},
  });
  return { fetchMock, ...rendered };
};

describe("Tour details page", () => {
  it("shows a loading message first", () => {
    renderPage();
    expect(screen.getByText("Loading tour details...")).toBeInTheDocument();
  });

  it("says so when the tour cannot be found", async () => {
    renderPage({ failing: { "tours/the-sea-explorer": 404 } });

    expect(await screen.findByText("Tour not found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to all tours" }),
    ).toHaveAttribute("href", "/tours");
  });

  it("shows the banner with the name, price and booking link", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: tour.name }),
    ).toBeInTheDocument();
    expect(screen.getByText("$599")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Book this tour/ }),
    ).toHaveAttribute("href", "/tour/the-sea-explorer/book");
  });

  it("describes the tour and its guides", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: `About ${tour.name}` }),
    ).toBeInTheDocument();
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Miyah Myles")).toBeInTheDocument();
    expect(screen.getByText("Lead guide")).toBeInTheDocument();
    expect(screen.getByText("15 people")).toBeInTheDocument();
    expect(screen.getByText("4.8 / 5")).toBeInTheDocument();
  });

  it("shows every photo in the gallery and the route map", async () => {
    renderPage();

    const gallery = await screen.findByRole("region", { name: "Gallery" });
    expect(within(gallery).getAllByRole("img")).toHaveLength(3);
    expect(screen.getByTestId("tour-map")).toBeInTheDocument();
  });

  it("offers Save only to a signed-in user", async () => {
    renderPage();
    await screen.findByRole("heading", { level: 1, name: tour.name });
    expect(
      screen.queryByRole("button", { name: /favourites/ }),
    ).not.toBeInTheDocument();
  });

  describe("reviews", () => {
    it("asks a visitor to log in, without requesting reviews", async () => {
      const { fetchMock } = renderPage();

      expect(
        await screen.findByRole("link", { name: "Log in" }),
      ).toHaveAttribute("href", "/auth");
      const urls = fetchMock.mock.calls.map(
        ([request]) => (request as Request).url,
      );
      expect(urls.some(url => url.includes("reviews"))).toBe(false);
    });

    it("lists the tour's reviews for a signed-in user", async () => {
      renderPage({ signedIn: true });

      expect(
        await screen.findByText("Every day was better than the last."),
      ).toBeInTheDocument();
      expect(screen.getByText("Max Smith")).toBeInTheDocument();
    });

    it("says when there are no reviews yet", async () => {
      renderPage({ signedIn: true, reviews: [] });

      expect(
        await screen.findByText("No reviews yet. Be the first to leave one."),
      ).toBeInTheDocument();
    });

    it("hides the review form from users who did not book the tour", async () => {
      renderPage({ signedIn: true, bookedTourIds: ["another-tour"] });

      expect(
        await screen.findByText(
          "Only travellers who booked this tour can write a review.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Write a review" }),
      ).not.toBeInTheDocument();
    });

    it("lets a traveller who booked the tour post a review", async () => {
      const { user, fetchMock } = renderPage({
        signedIn: true,
        bookedTourIds: ["tour-1"],
      });

      await screen.findByRole("heading", { name: "Write a review" });
      await user.selectOptions(screen.getByLabelText("Rating"), "4");
      await user.type(
        screen.getByLabelText("Your review"),
        "Great guides, great food.",
      );
      await user.click(screen.getByRole("button", { name: "Submit review" }));

      await waitFor(() => {
        const post = fetchMock.mock.calls
          .map(([request]) => request as Request)
          .find(request => request.method === "POST");
        expect(post?.url).toBe(
          "http://127.0.0.1:3000/api/v1/tours/tour-1/reviews",
        );
      });
    });

    it("shows a fixed message when the review cannot be saved", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { user } = renderPage({
        signedIn: true,
        bookedTourIds: ["tour-1"],
      });

      await screen.findByRole("heading", { name: "Write a review" });
      // From here on every request fails, including the POST.
      mockApi({}, { failing: { tours: 403 } });
      await user.type(screen.getByLabelText("Your review"), "Lovely.");
      await user.click(screen.getByRole("button", { name: "Submit review" }));

      expect(
        await screen.findByText(
          "We couldn't submit your review. Please try again.",
        ),
      ).toHaveAttribute("role", "alert");
    });
  });

  it("closes with a call to book", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "What are you waiting for?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Book tour now!" }),
    ).toHaveAttribute("href", "/tour/the-sea-explorer/book");
  });
});
