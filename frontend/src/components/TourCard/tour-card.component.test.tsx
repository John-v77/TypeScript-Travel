import { describe, it, expect, vi, afterEach, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import TourCard from "./tour.card.component";
import { Tour } from "../../features/tours/toursApiSlice";

// Mock tour data for testing
const mockTour: Tour = {
  _id: "1",
  name: "The Forest Hiker",
  duration: 5,
  maxGroupSize: 25,
  difficulty: "easy",
  price: 397,
  summary: "Breathtaking hike through the Canadian Banff National Park",
  description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
  imageCover: "tour-1-cover.jpg",
  images: ["tour-1-1.jpg", "tour-1-2.jpg", "tour-1-3.jpg"],
  startDates: [
    "2024-04-25T09:00:00.000Z",
    "2024-07-20T09:00:00.000Z",
    "2024-10-05T09:00:00.000Z",
  ],
  startLocation: {
    description: "Banff, CAN",
    type: "Point",
    coordinates: [-115.570154, 51.178456],
    address: "Banff, AB, Canada",
  },
  locations: [
    {
      _id: "loc1",
      description: "Banff National Park",
      type: "Point",
      coordinates: [-116.214531, 51.417611],
      day: 1,
    },
    {
      _id: "loc2",
      description: "Jasper National Park",
      type: "Point",
      coordinates: [-118.081821, 52.875223],
      day: 3,
    },
    {
      _id: "loc3",
      description: "Glacier National Park of Canada",
      type: "Point",
      coordinates: [-117.490309, 51.261937],
      day: 5,
    },
  ],
  guides: ["guide1", "guide2"],
  ratingsAverage: 4.5,
  ratingsQuantity: 37,
  slug: "the-forest-hiker",
};

// Mock console.log to avoid cluttering test output
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

describe("TourCard Component", () => {
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(<TourCard tour={mockTour} />);
      }).not.toThrow();
    });

    it("has correct CSS class structure", () => {
      const { container } = render(<TourCard tour={mockTour} />);
      const cardElement = container.querySelector(".card");

      expect(cardElement).toBeInTheDocument();
      expect(cardElement?.querySelector(".card__header")).toBeInTheDocument();
      expect(cardElement?.querySelector(".card__details")).toBeInTheDocument();
      expect(cardElement?.querySelector(".card__footer")).toBeInTheDocument();
    });
  });

  describe("Header Section", () => {
    it("renders tour image with correct src and alt attributes", () => {
      render(<TourCard tour={mockTour} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", `/img/tours/${mockTour.imageCover}`);
      expect(image).toHaveAttribute("alt", mockTour.name);
      expect(image).toHaveClass("card__picture-img");
    });

    it("renders tour name in heading", () => {
      render(<TourCard tour={mockTour} />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("heading-tertirary");

      const nameSpan = screen.getByText(mockTour.name);
      expect(nameSpan).toBeInTheDocument();
    });

    it("has correct picture structure with overlay", () => {
      const { container } = render(<TourCard tour={mockTour} />);

      const picture = container.querySelector(".card__picture");
      const overlay = container.querySelector(".card__picture-overlay");

      expect(picture).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();
    });
  });

  describe("Details Section", () => {
    it("renders tour difficulty and duration", () => {
      render(<TourCard tour={mockTour} />);

      const subHeading = screen.getByText(
        `${mockTour.difficulty} ${mockTour.duration}-day tour`,
      );
      expect(subHeading).toBeInTheDocument();
      expect(subHeading).toHaveClass("card__sub-heading");
    });

    it("renders tour summary", () => {
      render(<TourCard tour={mockTour} />);

      const summary = screen.getByText(mockTour.summary);
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveClass("card__text");
    });

    it("renders start location", () => {
      render(<TourCard tour={mockTour} />);

      const startLocation = screen.getByText(
        mockTour.startLocation.description,
      );
      expect(startLocation).toBeInTheDocument();
    });

    it("renders formatted start date", () => {
      render(<TourCard tour={mockTour} />);

      // The formatDate function should format the date as "April 2024"
      const formattedDate = screen.getByText("April 2024");
      expect(formattedDate).toBeInTheDocument();
    });

    it("renders max group size", () => {
      render(<TourCard tour={mockTour} />);

      const groupSize = screen.getByText(`${mockTour.maxGroupSize} people`);
      expect(groupSize).toBeInTheDocument();
    });

    it("renders correct number of SVG icons", () => {
      const { container } = render(<TourCard tour={mockTour} />);

      const icons = container.querySelectorAll(".card__icon");
      expect(icons).toHaveLength(4); // map-pin, calendar, flag, user
    });

    it("has correct data structure for each card data item", () => {
      const { container } = render(<TourCard tour={mockTour} />);

      const dataItems = container.querySelectorAll(".card__data");
      expect(dataItems).toHaveLength(4);

      // Each data item should have an SVG
      dataItems.forEach(item => {
        expect(item.querySelector("svg")).toBeInTheDocument();
      });

      // Check specific data items that should have spans
      const locationItem = screen
        .getByText(mockTour.startLocation.description)
        .closest(".card__data");
      const dateItem = screen.getByText("April 2024").closest(".card__data");
      const groupSizeItem = screen
        .getByText(`${mockTour.maxGroupSize} people`)
        .closest(".card__data");

      expect(locationItem?.querySelector("span")).toBeInTheDocument();
      expect(dateItem?.querySelector("span")).toBeInTheDocument();
      expect(groupSizeItem?.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("Footer Section", () => {
    it("renders tour price correctly", () => {
      render(<TourCard tour={mockTour} />);

      const price = screen.getByText(`$${mockTour.price}`);
      expect(price).toBeInTheDocument();
      expect(price).toHaveClass("card__footer-value");

      const priceText = screen.getByText("per person");
      expect(priceText).toBeInTheDocument();
      expect(priceText).toHaveClass("card__footer-text");
    });

    it("renders ratings correctly", () => {
      render(<TourCard tour={mockTour} />);

      const rating = screen.getByText("4.5");
      expect(rating).toBeInTheDocument();
      expect(rating).toHaveClass("card__footer-value");

      const ratingText = screen.getByText(
        `rating (${mockTour.ratingsQuantity})`,
      );
      expect(ratingText).toBeInTheDocument();
      expect(ratingText).toHaveClass("card__footer-text");
    });

    it("renders details button with correct link", () => {
      render(<TourCard tour={mockTour} />);

      const detailsLink = screen.getByRole("link", { name: "Details" });
      expect(detailsLink).toBeInTheDocument();
      expect(detailsLink).toHaveAttribute("href", `/tour/${mockTour.slug}`);
      expect(detailsLink).toHaveClass("btn", "btn--green", "btn--small");
    });

    it("has correct footer structure", () => {
      const { container } = render(<TourCard tour={mockTour} />);

      const footer = container.querySelector(".card__footer");
      expect(footer).toBeInTheDocument();

      const ratings = container.querySelector(".card__ratings");
      expect(ratings).toBeInTheDocument();
    });
  });

  describe("formatDate Function", () => {
    it("formats date correctly for different months", () => {
      const tourWithDifferentDate = {
        ...mockTour,
        startDates: ["2024-12-15T09:00:00.000Z"],
      };

      render(<TourCard tour={tourWithDifferentDate} />);

      const formattedDate = screen.getByText("December 2024");
      expect(formattedDate).toBeInTheDocument();
    });

    it("handles different years correctly", () => {
      const tourWith2025Date = {
        ...mockTour,
        startDates: ["2025-06-15T09:00:00.000Z"],
      };

      render(<TourCard tour={tourWith2025Date} />);

      const formattedDate = screen.getByText("June 2025");
      expect(formattedDate).toBeInTheDocument();
    });

    it("uses the first start date when multiple dates exist", () => {
      render(<TourCard tour={mockTour} />);

      // Should use the first date (April 2024), not the others
      const firstDate = screen.getByText("April 2024");
      expect(firstDate).toBeInTheDocument();

      const secondDate = screen.queryByText("July 2024");
      expect(secondDate).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases and Data Variations", () => {
    it("handles tour without slug", () => {
      const tourWithoutSlug = { ...mockTour };
      delete (tourWithoutSlug as any).slug;

      render(<TourCard tour={tourWithoutSlug} />);

      const detailsLink = screen.getByRole("link", { name: "Details" });
      expect(detailsLink).toHaveAttribute("href", "/tour/undefined");
    });

    it("handles empty locations array", () => {
      const tourWithEmptyLocations = {
        ...mockTour,
        locations: [],
      };

      expect(() => {
        render(<TourCard tour={tourWithEmptyLocations} />);
      }).not.toThrow();
    });

    it("handles different difficulty levels", () => {
      const difficulties = ["easy", "medium", "difficult"];

      difficulties.forEach(difficulty => {
        const tourWithDifficulty = { ...mockTour, difficulty };
        const { unmount } = render(<TourCard tour={tourWithDifficulty} />);

        const difficultyText = screen.getByText(
          `${difficulty} ${mockTour.duration}-day tour`,
        );
        expect(difficultyText).toBeInTheDocument();

        unmount();
      });
    });

    it("handles different price ranges", () => {
      const prices = [99, 1500, 2500];

      prices.forEach(price => {
        const tourWithPrice = { ...mockTour, price };
        const { unmount } = render(<TourCard tour={tourWithPrice} />);

        const priceText = screen.getByText(`$${price}`);
        expect(priceText).toBeInTheDocument();

        unmount();
      });
    });

    it("handles decimal ratings correctly", () => {
      const ratings = [4.2, 4.7, 3.9, 5.0];

      ratings.forEach(rating => {
        const tourWithRating = { ...mockTour, ratingsAverage: rating };
        const { unmount } = render(<TourCard tour={tourWithRating} />);

        const ratingText = screen.getByText(rating.toFixed(1));
        expect(ratingText).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("Console Logging", () => {
    it("logs tour data when component renders", () => {
      render(<TourCard tour={mockTour} />);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Rendering TourCard for tour:",
        mockTour,
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper image accessibility", () => {
      render(<TourCard tour={mockTour} />);

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt", mockTour.name);
    });

    it("has proper heading structure", () => {
      render(<TourCard tour={mockTour} />);

      const mainHeading = screen.getByRole("heading", { level: 3 });
      expect(mainHeading).toBeInTheDocument();

      const subHeading = screen.getByRole("heading", { level: 4 });
      expect(subHeading).toBeInTheDocument();
    });

    it("has accessible link with descriptive text", () => {
      render(<TourCard tour={mockTour} />);

      const link = screen.getByRole("link", { name: "Details" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href");
    });

    it("uses semantic HTML elements", () => {
      const { container } = render(<TourCard tour={mockTour} />);

      // Check for semantic elements
      expect(container.querySelector("h3")).toBeInTheDocument();
      expect(container.querySelector("h4")).toBeInTheDocument();
      expect(container.querySelector("p")).toBeInTheDocument();
      expect(container.querySelector("a")).toBeInTheDocument();
      expect(container.querySelector("img")).toBeInTheDocument();
    });
  });
});
