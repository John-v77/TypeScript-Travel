import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";
import { createMockQuery } from "./testHelpers";

jest.mock("../../models/tourModel");

// authController's real export is `export default {...}`, so overrides must
// be nested under `default` (with __esModule: true) or TS's esModuleInterop
// default-import helper reads the real (unmocked) functions instead of
// these jest.fn() ones. Only tours-stats and monthly-plan are protected
// routes; top-5-by-rating is public but the mock module is shared per file.
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController")
    .default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "admin" };
        next();
      }),
      restrictTo: jest.fn((...roles: string[]) => {
        return (req: any, res: any, next: any) => {
          if (req.user && roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({
              status: "fail",
              message: "You do not have permission to perform this action",
            });
          }
        };
      }),
    },
  };
});

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
mockTourModel.aggregate = jest.fn();

describe("GET /api/v1/tours/top-5-by-rating", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Route is registered as "/top-5-by-rating" in tourRoutes.ts, not
  // "/top-5-cheap" — the wrong URL previously fell through to "/:id" and
  // crashed instead of exercising aliasTopTours/getAllTours.
  it("should get top 5 cheap tours, sorted by rating then price, with a curated field set", async () => {
    const mockTours = [
      { _id: "1", name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
      { _id: "2", name: "Cheap Tour 2", price: 249, ratingsAverage: 4.7 },
      { _id: "3", name: "Cheap Tour 3", price: 299, ratingsAverage: 4.6 },
      { _id: "4", name: "Cheap Tour 4", price: 349, ratingsAverage: 4.5 },
      { _id: "5", name: "Cheap Tour 5", price: 399, ratingsAverage: 4.4 },
    ];
    const mockQuery = createMockQuery(mockTours);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .get("/api/v1/tours/top-5-by-rating")
      .expect(200);

    expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
    expect(mockQuery.select).toHaveBeenCalledWith(
      "name price ratingsAverage summary difficulty",
    );
    expect(mockQuery.limit).toHaveBeenCalledWith(5);
    expect(response.body).toEqual({
      status: "success",
      results: 5,
      data: mockTours,
    });
  });

  it("should ignore a caller-supplied fields param and keep the curated field set", async () => {
    const mockTours = [
      { name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
    ];
    const mockQuery = createMockQuery(mockTours);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    await request(app)
      .get("/api/v1/tours/top-5-by-rating?fields=name,price,ratingsAverage")
      .expect(200);

    expect(mockQuery.select).toHaveBeenCalledWith(
      "name price ratingsAverage summary difficulty",
    );
  });

  it("should still apply caller-supplied filters alongside the alias defaults", async () => {
    const mockTours = [{ _id: "1", name: "Easy Cheap Tour", price: 199 }];
    const mockQuery = createMockQuery(mockTours);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    await request(app)
      .get("/api/v1/tours/top-5-by-rating?difficulty=easy")
      .expect(200);

    expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
  });

  it("should override a caller-supplied limit with 5", async () => {
    const mockQuery = createMockQuery([]);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    await request(app)
      .get("/api/v1/tours/top-5-by-rating?limit=100")
      .expect(200);

    expect(mockQuery.limit).toHaveBeenCalledWith(5);
  });

  it("should override a caller-supplied sort with the rating/price sort", async () => {
    const mockQuery = createMockQuery([]);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    await request(app)
      .get("/api/v1/tours/top-5-by-rating?sort=name")
      .expect(200);

    expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
  });

  it("should handle database error", async () => {
    const mockQuery = createMockQuery(new Error("Database error"));
    mockTourModel.find.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .get("/api/v1/tours/top-5-by-rating")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Database error",
    });
  });
});

// Route is "/tours-stats" (plural) in tourRoutes.ts, not "/tour-stats" as
// this block previously assumed.
describe("GET /api/v1/tours/tours-stats", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return grouped stats via the aggregation pipeline", async () => {
    const mockStats = [
      {
        _id: "MEDIUM",
        num: 3,
        numRatings: 150,
        avgRating: 4.6,
        avgPrice: 1200,
        minPrice: 800,
        maxPrice: 1600,
      },
      {
        _id: "DIFFICULT",
        num: 2,
        numRatings: 100,
        avgRating: 4.8,
        avgPrice: 1800,
        minPrice: 1500,
        maxPrice: 2100,
      },
    ];

    mockTourModel.aggregate.mockResolvedValue(mockStats);

    const response = await request(app)
      .get("/api/v1/tours/tours-stats")
      .expect(200);

    expect(mockTourModel.aggregate).toHaveBeenCalledWith([
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          num: { $sum: 1 },
          numRatings: { $sum: "$ratingQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $sort: { avgPrice: 1 } },
      { $match: { _id: { $ne: "EASY" } } },
    ]);
    expect(response.body).toEqual({
      status: "success",
      data: {
        stats: mockStats,
      },
    });
  });

  it("should handle database error", async () => {
    mockTourModel.aggregate.mockRejectedValue(new Error("Aggregation error"));

    const response = await request(app)
      .get("/api/v1/tours/tours-stats")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Aggregation error",
    });
  });
});

describe("GET /api/v1/tours/monthly-plan/:year", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const expectedMatchRange = (year: number) => ({
    $gte: new Date(`${year}-01-01`),
    $lte: new Date(`${year}-12-31`),
  });

  it("should build the aggregation pipeline for the requested year", async () => {
    const mockPlan = [
      {
        month: 7,
        numTourStarts: 3,
        tours: ["Summer Adventure", "Beach Paradise", "Mountain Trek"],
      },
      { month: 8, numTourStarts: 2, tours: ["Desert Safari", "City Explorer"] },
      { month: 6, numTourStarts: 2, tours: ["Spring Hike", "Valley Tour"] },
    ];

    mockTourModel.aggregate.mockResolvedValue(mockPlan);

    const response = await request(app)
      .get("/api/v1/tours/monthly-plan/2024")
      .expect(200);

    expect(mockTourModel.aggregate).toHaveBeenCalledWith([
      { $unwind: "$startDates" },
      { $match: { startDates: expectedMatchRange(2024) } },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      { $addFields: { month: "$_id" } },
      { $project: { _id: 0 } },
      { $sort: { numTourStarts: -1 } },
      { $limit: 6 },
    ]);
    expect(response.body).toEqual({
      status: "success",
      data: { plan: mockPlan },
    });
  });

  it("should scope the $match date range to the :year param", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);

    await request(app).get("/api/v1/tours/monthly-plan/2023").expect(200);

    const pipeline = mockTourModel.aggregate.mock.calls[0][0] as any[];
    expect(pipeline[1].$match.startDates).toEqual(expectedMatchRange(2023));
  });

  it("should return an empty plan when the aggregation yields no results", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/v1/tours/monthly-plan/2025")
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      data: { plan: [] },
    });
  });

  it("should handle database error", async () => {
    mockTourModel.aggregate.mockRejectedValue(new Error("Aggregation error"));

    const response = await request(app)
      .get("/api/v1/tours/monthly-plan/2024")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Aggregation error",
    });
  });

  it("should fall back to the current year when :year is not numeric", async () => {
    mockTourModel.aggregate.mockResolvedValue([]);
    const currentYear = new Date().getFullYear();

    await request(app).get("/api/v1/tours/monthly-plan/abc").expect(200);

    const pipeline = mockTourModel.aggregate.mock.calls[0][0] as any[];
    expect(pipeline[1].$match.startDates).toEqual(
      expectedMatchRange(currentYear),
    );
  });
});
