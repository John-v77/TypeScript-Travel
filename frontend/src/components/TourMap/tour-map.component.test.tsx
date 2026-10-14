import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import TourMap from "./tour-map.component";
import { makeTour } from "../../utils/test-fixtures";
import { mockApi } from "../../utils/test-api";

// mapbox-gl needs WebGL, which jsdom does not have. These stand-ins render
// what the component hands them, so the stops, the line and the caption can
// be checked; the map reports idle straight away.
vi.mock("react-map-gl/mapbox", () => ({
  default: ({
    children,
    onIdle,
  }: {
    children: ReactNode;
    onIdle?: () => void;
  }) => {
    queueMicrotask(() => onIdle?.());
    return <div data-testid="map">{children}</div>;
  },
  Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  NavigationControl: () => null,
  Source: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Layer: ({ paint }: { paint: Record<string, unknown> }) => (
    <div
      data-testid="route-line"
      data-dashed={String("line-dasharray" in paint)}
    />
  ),
}));
vi.mock("mapbox-gl/dist/mapbox-gl.css", () => ({}));

const locations = makeTour().locations ?? [];

describe("TourMap", () => {
  it("numbers each stop by its day", () => {
    mockApi({ "api.mapbox.com/directions": { code: "NoRoute" } });
    render(<TourMap locations={locations} />);

    expect(
      screen.getByRole("button", { name: "Stop 1: Lummus Park Beach" }),
    ).toHaveTextContent("1");
    expect(
      screen.getByRole("button", { name: "Stop 2: Islamorada" }),
    ).toHaveTextContent("2");
  });

  it("opens a popup with the stop's day and name", async () => {
    mockApi({ "api.mapbox.com/directions": { code: "NoRoute" } });
    render(<TourMap locations={locations} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Stop 2: Islamorada" }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Day 2: Islamorada");
  });

  it("draws the road route and quotes its distance", async () => {
    mockApi({
      "api.mapbox.com/directions": {
        code: "Ok",
        routes: [
          {
            distance: 160934.4,
            duration: 7200,
            geometry: { coordinates: locations.map(l => l.coordinates) },
          },
        ],
      },
    });
    render(<TourMap locations={locations} />);

    expect(
      await screen.findByText(/100 mi · 2h 0m driving/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-line")).toHaveAttribute(
      "data-dashed",
      "false",
    );
  });

  it("falls back to a dashed straight line when there is no road", async () => {
    mockApi({ "api.mapbox.com/directions": { code: "NoRoute" } });
    render(<TourMap locations={locations} />);

    expect(await screen.findByTestId("route-line")).toHaveAttribute(
      "data-dashed",
      "true",
    );
    expect(screen.queryByText(/driving/)).not.toBeInTheDocument();
  });

  it("says so when the tour has no stops", () => {
    mockApi({});
    render(<TourMap locations={[]} />);

    expect(
      screen.getByText("No locations available for this tour."),
    ).toBeInTheDocument();
  });
});
