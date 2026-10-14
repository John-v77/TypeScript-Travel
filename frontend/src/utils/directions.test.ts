import {
  fetchDrivingRoute,
  formatDistance,
  formatDuration,
} from "./directions";
import { mockApi } from "./test-api";

const miami: [number, number] = [-80.128473, 25.781842];
const keyWest: [number, number] = [-81.78, 24.555];

describe("fetchDrivingRoute", () => {
  it("returns the road route, its distance and its duration", async () => {
    const fetchMock = mockApi({
      "api.mapbox.com/directions": {
        code: "Ok",
        routes: [
          {
            distance: 260000,
            duration: 14400,
            geometry: { coordinates: [miami, [-80.6, 24.9], keyWest] },
          },
        ],
      },
    });

    const route = await fetchDrivingRoute([miami, keyWest], "pk.test");

    expect(route).toEqual({
      coordinates: [miami, [-80.6, 24.9], keyWest],
      distanceMeters: 260000,
      durationSeconds: 14400,
    });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("-80.128473,25.781842;-81.78,24.555");
    expect(url).toContain("access_token=pk.test");
  });

  it("returns null when the stops are not connected by road", async () => {
    mockApi({ "api.mapbox.com/directions": { code: "NoRoute", routes: [] } });

    expect(await fetchDrivingRoute([miami, keyWest], "pk.test")).toBeNull();
  });

  it("does not ask for one stop, or more than 25", async () => {
    const fetchMock = mockApi({});
    const many = Array.from({ length: 26 }, () => miami);

    expect(await fetchDrivingRoute([miami], "pk.test")).toBeNull();
    expect(await fetchDrivingRoute(many, "pk.test")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the request itself fails", async () => {
    mockApi({}, { failing: { "api.mapbox.com": 500 } });

    await expect(
      fetchDrivingRoute([miami, keyWest], "pk.test"),
    ).rejects.toThrow("Directions failed with status 500");
  });
});

describe("formatting", () => {
  it("prints distance in whole miles", () => {
    expect(formatDistance(1609.344)).toBe("1 mi");
    expect(formatDistance(1_995_586)).toBe("1,240 mi");
  });

  it("prints duration in hours and minutes", () => {
    expect(formatDuration(66000)).toBe("18h 20m");
    expect(formatDuration(2700)).toBe("45m");
    expect(formatDuration(3600)).toBe("1h 0m");
  });
});
