import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Tours from "./tours.component";

// Mock data for testing
const mockTours = [
  {
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
      coordinates: [-115.570154, 51.178456] as [number, number],
      address: "Banff, AB, Canada",
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.5,
    ratingsQuantity: 37,
    slug: "the-forest-hiker",
  },
  {
    _id: "2",
    name: "The Sea Explorer",
    duration: 7,
    maxGroupSize: 15,
    difficulty: "medium",
    price: 497,
    summary: "Exploring the jaw-dropping US east coast by foot and by boat",
    description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
    imageCover: "tour-2-cover.jpg",
    images: ["tour-2-1.jpg", "tour-2-2.jpg", "tour-2-3.jpg"],
    startDates: [
      "2024-06-19T09:00:00.000Z",
      "2024-07-20T09:00:00.000Z",
      "2024-08-18T09:00:00.000Z",
    ],
    startLocation: {
      description: "Miami, USA",
      type: "Point",
      coordinates: [-80.185942, 25.774772] as [number, number],
      address: "301 Biscayne Blvd, Miami, FL 33132, USA",
    },
    locations: [],
    guides: [],
    ratingsAverage: 4.8,
    ratingsQuantity: 6,
    slug: "the-sea-explorer",
  },
];

// Test wrapper with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Tours Component", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders loading state initially", () => {
    renderWithRouter(<Tours />);
    expect(screen.getByText("Loading tours...")).toBeInTheDocument();
  });

  it("displays tours after loading", async () => {
    renderWithRouter(<Tours />);

    // Fast forward through the loading timeout
    await act(async () => {
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading tours...")).not.toBeInTheDocument();
    });

    // Check that tour cards are rendered
    expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    expect(screen.getByText("The Sea Explorer")).toBeInTheDocument();
    expect(screen.getByText("The Snow Adventurer")).toBeInTheDocument();
  });

  it("displays correct tour information", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check tour details
    expect(screen.getByText("easy 5-day tour")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Breathtaking hike through the Canadian Banff National Park",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("$397")).toBeInTheDocument();
    expect(screen.getByText("25 people")).toBeInTheDocument();
    expect(screen.getByText("Banff, CAN")).toBeInTheDocument();
  });

  it("displays correct tour ratings", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check ratings
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("rating (37)")).toBeInTheDocument();
  });

  it("displays formatted dates correctly", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check that dates are formatted as "Month Year"
    expect(screen.getByText("April 2024")).toBeInTheDocument();
    expect(screen.getByText("June 2024")).toBeInTheDocument();
  });

  it("displays correct number of tour cards", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check that all 3 mock tours are displayed
    const tourCards = screen.getAllByText(/Details/);
    expect(tourCards).toHaveLength(3);
  });

  it("displays tour images with correct src attributes", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check that images have correct paths
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "/img/tours/tour-1-cover.jpg");
    expect(images[0]).toHaveAttribute("alt", "The Forest Hiker");
  });

  it("displays details links with correct href", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check that detail links are correct
    const detailLinks = screen.getAllByText("Details");
    expect(detailLinks[0]).toHaveAttribute("href", "/tour/the-forest-hiker");
    expect(detailLinks[1]).toHaveAttribute("href", "/tour/the-sea-explorer");
    expect(detailLinks[2]).toHaveAttribute("href", "/tour/the-snow-adventurer");
  });

  it("displays correct difficulty levels", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check difficulty levels
    expect(screen.getByText("easy 5-day tour")).toBeInTheDocument();
    expect(screen.getByText("medium 7-day tour")).toBeInTheDocument();
    expect(screen.getByText("difficult 4-day tour")).toBeInTheDocument();
  });

  it("displays SVG icons with correct href attributes", async () => {
    renderWithRouter(<Tours />);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("The Forest Hiker")).toBeInTheDocument();
    });

    // Check that SVG use elements have correct xlink:href
    const useElements = document.querySelectorAll("use");
    const iconTypes = Array.from(useElements).map(use =>
      use.getAttribute("xlinkhref"),
    );

    expect(iconTypes).toContain("/img/icons.svg#icon-map-pin");
    expect(iconTypes).toContain("/img/icons.svg#icon-calendar");
    expect(iconTypes).toContain("/img/icons.svg#icon-flag");
    expect(iconTypes).toContain("/img/icons.svg#icon-user");
  });
});
