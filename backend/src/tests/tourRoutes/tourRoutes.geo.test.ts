import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";

jest.mock("../../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
mockTourModel.aggregate = jest.fn();

// Router is mounted at /api/v1/tours (see server.ts), and the sub-route itself
// is "/tours-within/...", so the full path needs "/tours" twice — a path of
// "/api/v1/tours-within/..." directly 404s.
describe("GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should convert miles to a $centerSphere radius and return matching tours", async () => {
    const mockTours = [
      {
        _id: "1",
        name: "Tour 1",
        startLocation: { coordinates: [-122.4194, 37.7749] },
      },
      {
        _id: "2",
        name: "Tour 2",
        startLocation: { coordinates: [-122.4094, 37.7849] },
      },
    ];

    mockTourModel.find.mockResolvedValue(mockTours as any);

    const response = await request(app)
      .get("/api/v1/tours/tours-within/100/center/37.7749,-122.4194/unit/mi")
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      results: 2,
      data: { data: mockTours },
    });
    expect(mockTourModel.find).toHaveBeenCalledWith({
      startLocation: {
        $geoWithin: { $centerSphere: [[-122.4194, 37.7749], 100 / 3963.2] },
      },
    });
  });

  it("should convert kilometers to a $centerSphere radius using the km divisor", async () => {
    mockTourModel.find.mockResolvedValue([]);

    await request(app)
      .get("/api/v1/tours/tours-within/100/center/37.7749,-122.4194/unit/km")
      .expect(200);

    expect(mockTourModel.find).toHaveBeenCalledWith({
      startLocation: {
        $geoWithin: { $centerSphere: [[-122.4194, 37.7749], 100 / 6378.1] },
      },
    });
  });

  it("should return 400 for missing latitude", async () => {
    const response = await request(app)
      .get("/api/v1/tours/tours-within/100/center/,-122.4194/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should return 400 for missing longitude", async () => {
    const response = await request(app)
      .get("/api/v1/tours/tours-within/100/center/37.7749,/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should return 400 for an invalid lat,lng format", async () => {
    const response = await request(app)
      .get("/api/v1/tours/tours-within/100/center/invalid/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should handle database errors", async () => {
    mockTourModel.find.mockRejectedValue(new Error("Database error"));

    await request(app)
      .get("/api/v1/tours/tours-within/100/center/37.7749,-122.4194/unit/mi")
      .expect(500);
  });
});

describe("GET /api/v1/tours/distances/:latlng/unit/:unit", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run a $geoNear aggregation with the miles distance multiplier", async () => {
    const mockDistances = [
      { _id: "1", name: "Tour 1", distance: 12.34 },
      { _id: "2", name: "Tour 2", distance: 45.67 },
    ];

    mockTourModel.aggregate.mockResolvedValue(mockDistances);

    const response = await request(app)
      .get("/api/v1/tours/distances/34.111745,-118.113491/unit/mi")
      .expect(200);

    expect(mockTourModel.aggregate).toHaveBeenCalledWith([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [-118.113491, 34.111745] },
          distanceField: "distance",
          distanceMultiplier: 0.000621371,
        },
      },
      { $project: { distance: 1, name: 1 } },
    ]);
    expect(response.body).toEqual({
      status: "success",
      data: { data: mockDistances },
    });
  });

  it("should use the kilometers distance multiplier for unit=km", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);

    await request(app)
      .get("/api/v1/tours/distances/34.111745,-118.113491/unit/km")
      .expect(200);

    const pipeline = mockTourModel.aggregate.mock.calls[0][0] as any[];
    expect(pipeline[0].$geoNear.distanceMultiplier).toBe(0.001);
  });

  it("should default to the km multiplier for any unit other than mi", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);

    await request(app)
      .get("/api/v1/tours/distances/34.111745,-118.113491/unit/xyz")
      .expect(200);

    const pipeline = mockTourModel.aggregate.mock.calls[0][0] as any[];
    expect(pipeline[0].$geoNear.distanceMultiplier).toBe(0.001);
  });

  it("should return 400 for missing latitude", async () => {
    const response = await request(app)
      .get("/api/v1/tours/distances/,-118.113491/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should return 400 for missing longitude", async () => {
    const response = await request(app)
      .get("/api/v1/tours/distances/34.111745,/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should return 400 for an invalid lat,lng format", async () => {
    const response = await request(app)
      .get("/api/v1/tours/distances/invalid/unit/mi")
      .expect(400);

    expect(response.body.message).toBe(
      "Please provide latitude and longitude in the format lat, lng.",
    );
  });

  it("should handle empty results", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/v1/tours/distances/34.111745,-118.113491/unit/mi")
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      data: { data: [] },
    });
  });

  it("should handle database/aggregation errors", async () => {
    mockTourModel.aggregate.mockRejectedValue(new Error("Aggregation error"));

    const response = await request(app)
      .get("/api/v1/tours/distances/34.111745,-118.113491/unit/mi")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Aggregation error",
    });
  });
});
