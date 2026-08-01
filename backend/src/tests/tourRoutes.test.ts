import request from "supertest";
import { createServer } from "../server";
import { TourModel } from "../models/tourModel";
import authController from "../controllers/authController";
import tourController from "../controllers/tourController";

jest.mock("../models/tourModel");

// authController/tourController's real export is `export default {...}`, so overrides
// must be nested under `default` (with __esModule: true) or TS's esModuleInterop
// default-import helper reads the real (unmocked) functions instead of these jest.fn() ones.

jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
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
jest.mock("../controllers/tourController", () => {
  const actual = jest.requireActual("../controllers/tourController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      deleteTourPackage: jest.fn(),
    },
  };
});

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;
const mockTourController = tourController as jest.Mocked<typeof tourController>;
mockTourModel.aggregate = jest.fn();

describe("Tour Routes", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/tours", () => {
    it("should get all tours successfully", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should sort tours by price ascending", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should sort tours by price descending", async () => {
      const mockTours = [
        { _id: "2", name: "Tour 2", price: 399 },
        { _id: "1", name: "Tour 1", price: 299 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=-price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should sort tours by multiple fields", async () => {
      const mockTours = [
        { _id: "1", name: "Tour A", price: 299, difficulty: "easy" },
        { _id: "2", name: "Tour B", price: 299, difficulty: "medium" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price,difficulty")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price difficulty");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should sort tours by name ascending", async () => {
      const mockTours = [
        { _id: "1", name: "A Tour", price: 299 },
        { _id: "2", name: "B Tour", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=name")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("name");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle filtering with sorting", async () => {
      const mockTours = [
        { _id: "1", name: "Easy Tour", price: 299, difficulty: "easy" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle advanced filtering with sorting", async () => {
      const mockTours = [{ _id: "1", name: "Expensive Tour", price: 500 }];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?price[gte]=400&sort=-price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ price: { $gte: "400" } });
      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should limit fields when fields query parameter is provided", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=name,price")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should exclude __v field by default when no fields specified", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle field limiting with single field", async () => {
      const mockTours = [{ name: "Tour 1" }, { name: "Tour 2" }];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=name")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("name");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle field limiting with sorting and filtering", async () => {
      const mockTours = [{ _id: "1", name: "Easy Tour", price: 299 }];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price&fields=name,price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should exclude specific fields using minus prefix", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", difficulty: "easy" },
        { _id: "2", name: "Tour 2", difficulty: "medium" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=-price,-summary")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("-price -summary");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle pagination with default values", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle custom pagination", async () => {
      const mockTours = [
        { _id: "3", name: "Tour 3", price: 499 },
        { _id: "4", name: "Tour 4", price: 599 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=2&limit=5")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle page 3 with custom limit", async () => {
      const mockTours = [{ _id: "11", name: "Tour 11", price: 799 }];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=3&limit=10")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should return an empty list for a page beyond the available results", async () => {
      // No page-bounds validation is implemented: paginate() just skips/limits
      // the query, so a page past the end of the data returns an empty array
      // rather than a 400.
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=5&limit=10")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(40);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(response.body).toEqual({
        status: "success",
        results: 0,
        data: {
          data: [],
        },
      });
    });

    it("should handle pagination combined with filtering and sorting", async () => {
      const mockTours = [
        { _id: "1", name: "Easy Tour 1", price: 299, difficulty: "easy" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(
          "/api/v1/tours?difficulty=easy&sort=price&fields=name,price&page=1&limit=5",
        )
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle invalid page parameter as default", async () => {
      const mockTours = [{ _id: "1", name: "Tour 1", price: 299 }];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=abc&limit=xyz")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle database error", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Database error",
      });
    });
  });

  // Route is registered as "/top-5-by-rating" in tourRoutes.ts, not "/top-5-cheap"
  // as this block previously assumed — the wrong URL fell through to the "/:id"
  // route and crashed instead of exercising aliasTopTours/getAllTours.
  describe("GET /api/v1/tours/top-5-by-rating", () => {
    it("should get top 5 cheap tours successfully", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
        { _id: "2", name: "Cheap Tour 2", price: 249, ratingsAverage: 4.7 },
        { _id: "3", name: "Cheap Tour 3", price: 299, ratingsAverage: 4.6 },
        { _id: "4", name: "Cheap Tour 4", price: 349, ratingsAverage: 4.5 },
        { _id: "5", name: "Cheap Tour 5", price: 399, ratingsAverage: 4.4 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-by-rating")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingsAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 5,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle top-5-by-rating with custom fields (middleware overrides)", async () => {
      const mockTours = [
        { name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
        { name: "Cheap Tour 2", price: 249, ratingsAverage: 4.7 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-by-rating?fields=name,price,ratingsAverage")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingsAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle top-5-by-rating with additional filters", async () => {
      const mockTours = [
        {
          _id: "1",
          name: "Easy Cheap Tour",
          price: 199,
          ratingsAverage: 4.8,
          difficulty: "easy",
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-by-rating?difficulty=easy")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingsAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should override any limit parameter with 5", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-by-rating?limit=100")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingsAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should override any sort parameter with rating and price sort", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingsAverage: 4.8 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTours),
        where: jest.fn().mockReturnThis(),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-by-rating?sort=name")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingsAverage -price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingsAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          data: mockTours,
        },
      });
    });

    it("should handle database error for top-5-by-rating", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("Database error")),
      };

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

  // Route is "/tours-stats" (plural) in tourRoutes.ts, not "/tour-stats" as this
  // block previously assumed.
  describe("GET /api/v1/tours/tours-stats", () => {
    it("should get tour statistics successfully", async () => {
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

    it("should handle database error for tour stats", async () => {
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
    it("should get monthly plan for a specific year", async () => {
      const mockPlan = [
        {
          month: 7,
          numTourStarts: 3,
          tours: ["Summer Adventure", "Beach Paradise", "Mountain Trek"],
        },
        {
          month: 8,
          numTourStarts: 2,
          tours: ["Desert Safari", "City Explorer"],
        },
        {
          month: 6,
          numTourStarts: 2,
          tours: ["Spring Hike", "Valley Tour"],
        },
      ];

      mockTourModel.aggregate.mockResolvedValue(mockPlan);

      const response = await request(app)
        .get("/api/v1/tours/monthly-plan/2024")
        .expect(200);

      expect(mockTourModel.aggregate).toHaveBeenCalledWith([
        {
          $unwind: "$startDates",
        },
        {
          $match: {
            startDates: {
              $gte: new Date("2024-01-01"),
              $lte: new Date("2024-12-31"),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$startDates" },
            numTourStarts: { $sum: 1 },
            tours: { $push: "$name" },
          },
        },
        {
          $addFields: { month: "$_id" },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        {
          $limit: 6,
        },
      ]);

      expect(response.body).toEqual({
        status: "success",
        data: {
          plan: mockPlan,
        },
      });
    });

    it("should handle different year parameter", async () => {
      const mockPlan = [
        {
          month: 12,
          numTourStarts: 1,
          tours: ["Winter Wonder"],
        },
      ];

      mockTourModel.aggregate.mockResolvedValue(mockPlan);

      const response = await request(app)
        .get("/api/v1/tours/monthly-plan/2023")
        .expect(200);

      expect(mockTourModel.aggregate).toHaveBeenCalledWith([
        {
          $unwind: "$startDates",
        },
        {
          $match: {
            startDates: {
              $gte: new Date("2023-01-01"),
              $lte: new Date("2023-12-31"),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$startDates" },
            numTourStarts: { $sum: 1 },
            tours: { $push: "$name" },
          },
        },
        {
          $addFields: { month: "$_id" },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        {
          $limit: 6,
        },
      ]);

      expect(response.body).toEqual({
        status: "success",
        data: {
          plan: mockPlan,
        },
      });
    });

    it("should handle empty results for monthly plan", async () => {
      mockTourModel.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/v1/tours/monthly-plan/2025")
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        data: {
          plan: [],
        },
      });
    });

    it("should handle database error for monthly plan", async () => {
      mockTourModel.aggregate.mockRejectedValue(new Error("Aggregation error"));

      const response = await request(app)
        .get("/api/v1/tours/monthly-plan/2024")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Aggregation error",
      });
    });

    it("should handle invalid year parameter gracefully", async () => {
      const mockPlan: any[] = [];
      mockTourModel.aggregate.mockResolvedValue(mockPlan);
      const currentYear = new Date().getFullYear();

      const response = await request(app)
        .get("/api/v1/tours/monthly-plan/abc")
        .expect(200);

      expect(mockTourModel.aggregate).toHaveBeenCalledWith([
        {
          $unwind: "$startDates",
        },
        {
          $match: {
            startDates: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$startDates" },
            numTourStarts: { $sum: 1 },
            tours: { $push: "$name" },
          },
        },
        {
          $addFields: { month: "$_id" },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        {
          $limit: 6,
        },
      ]);

      expect(response.body).toEqual({
        status: "success",
        data: {
          plan: [],
        },
      });
    });
  });

  describe("POST /api/v1/tours", () => {
    it("should create a new tour", async () => {
      const tourData = {
        name: "Test Tour",
        price: 299,
      };

      const mockCreatedTour = { _id: "123", ...tourData };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body).toEqual({
        status: "success",
        data: {
          data: mockCreatedTour,
        },
      });
    });

    it("should handle validation error", async () => {
      mockTourModel.create.mockRejectedValue(new Error("Validation error"));

      const response = await request(app)
        .post("/api/v1/tours")
        .send({})
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Validation error",
      });
    });
  });

  describe("GET /api/v1/tours/:id", () => {
    it("should get a tour by ID", async () => {
      const tourId = "123";
      const mockTour = { _id: tourId, name: "Test Tour", price: 299 };

      // handlerFactory.getOne calls .populate(popOptions) on the findById query
      // (getTourById passes a guides popOptions), so the mock must be a chainable
      // object, not a plain resolved value, or the real code 500s on
      // "query.populate is not a function".
      mockTourModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTour),
      } as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        data: {
          data: mockTour,
        },
      });
    });

    it("should return 404 for non-existent tour", async () => {
      const tourId = "123";

      mockTourModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(404);

      expect(response.body).toEqual({
        status: "fail",
        message: "No document found with that ID",
      });
    });

    it("should handle database error", async () => {
      const tourId = "123";

      mockTourModel.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Database error")),
      } as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Database error",
      });
    });
  });

  describe("PATCH /api/v1/tours/:id", () => {
    it("should update a tour package", async () => {
      const tourId = "123";
      const updateData = {
        name: "Updated Tour Name",
        price: 399,
      };

      const mockUpdatedTour = { _id: tourId, ...updateData };
      mockTourModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedTour as any);

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        data: {
          data: mockUpdatedTour,
        },
      });
    });

    it("should return 404 for non-existent tour", async () => {
      const tourId = "123";

      mockTourModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send({ name: "Updated" })
        .expect(404);

      expect(response.body).toEqual({
        status: "fail",
        message: "No document found with that ID",
      });
    });

    it("should handle database error", async () => {
      const tourId = "123";

      mockTourModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send({ name: "Updated" })
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Database error",
      });
    });
  });

  describe("DELETE /api/v1/tours/:id", () => {
    beforeEach(() => {
      // Default mock for protect middleware to add admin user
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123", role: "admin" };
          next();
        },
      );

      // Mock restrictTo middleware to check roles properly
      mockAuthController.restrictTo.mockImplementation((...roles: string[]) => {
        return (req: any, res: any, next: any) => {
          if (roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({
              status: "fail",
              message: "You do not have permission to perform this action",
            });
          }
        };
      });

      // Default mock for deleteTourPackage
      mockTourController.deleteTourPackage.mockImplementation(
        (req: any, res: any) => {
          res.status(204).json();
        },
      );
    });

    it("should delete a tour package with admin role", async () => {
      const tourId = "123";

      mockTourController.deleteTourPackage.mockImplementation(
        (req: any, res: any) => {
          res.status(204).json();
        },
      );

      await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer admin-token")
        .expect(204);
    });

    it("should delete a tour package with lead-guide role", async () => {
      const tourId = "123";

      // Mock user with lead-guide role
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123", role: "lead-guide" };
          next();
        },
      );

      mockTourController.deleteTourPackage.mockImplementation(
        (req: any, res: any) => {
          res.status(204).json();
        },
      );

      await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer lead-guide-token")
        .expect(204);
    });

    it("should deny access for user role", async () => {
      const tourId = "123";

      // Mock user with regular user role
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123", role: "user" };
          next();
        },
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer user-token")
        .expect(403);

      expect(response.body).toEqual({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    });

    it("should deny access for guide role", async () => {
      const tourId = "123";

      // Mock user with guide role
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123", role: "guide" };
          next();
        },
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer guide-token")
        .expect(403);

      expect(response.body).toEqual({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    });

    it("should require authentication", async () => {
      const tourId = "123";

      // Mock protect to reject authentication
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access.",
          });
        },
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("You are not logged in");
    });

    it("should return 404 for non-existent tour with proper authorization", async () => {
      const tourId = "123";

      mockTourController.deleteTourPackage.mockImplementation(
        (req: any, res: any) => {
          res.status(404).json({
            status: "fail",
            message: "Tour not found",
          });
        },
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer admin-token")
        .expect(404);

      expect(response.body).toEqual({
        status: "fail",
        message: "Tour not found",
      });
    });

    it("should handle database error with proper authorization", async () => {
      const tourId = "123";

      mockTourController.deleteTourPackage.mockImplementation(
        (req: any, res: any) => {
          res.status(500).json({
            status: "error",
            message: "Database error",
          });
        },
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .set("Authorization", "Bearer admin-token")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Database error",
      });
    });
  });

  // Router is mounted at /api/v1/tours (see server.ts), and the sub-route itself is
  // "/tours-within/...", so the full path needs "/tours" twice — this block previously
  // requested "/api/v1/tours-within/..." directly, which 404'd.
  describe("GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit", () => {
    it("should get tours within specified distance", async () => {
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

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data.data).toEqual(mockTours);
      expect(mockTourModel.find).toHaveBeenCalledWith({
        startLocation: {
          $geoWithin: { $centerSphere: [[-122.4194, 37.7749], 100 / 3963.2] },
        },
      });
    });

    it("should calculate radius correctly for kilometers", async () => {
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

    it("should return 400 error for missing latitude", async () => {
      const response = await request(app)
        .get("/api/v1/tours/tours-within/100/center/,-122.4194/unit/mi")
        .expect(400);

      expect(response.body.message).toBe(
        "Please provide latitude and longitude in the format lat, lng.",
      );
    });

    it("should return 400 error for missing longitude", async () => {
      const response = await request(app)
        .get("/api/v1/tours/tours-within/100/center/37.7749,/unit/mi")
        .expect(400);

      expect(response.body.message).toBe(
        "Please provide latitude and longitude in the format lat, lng.",
      );
    });

    it("should return 400 error for invalid lat,lng format", async () => {
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
    it("should get distances to all tours in miles", async () => {
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
            near: {
              type: "Point",
              coordinates: [-118.113491, 34.111745],
            },
            distanceField: "distance",
            distanceMultiplier: 0.000621371,
          },
        },
        {
          $project: {
            distance: 1,
            name: 1,
          },
        },
      ]);

      expect(response.body).toEqual({
        status: "success",
        data: {
          data: mockDistances,
        },
      });
    });

    it("should get distances to all tours in kilometers", async () => {
      mockTourModel.aggregate.mockResolvedValue([]);

      await request(app)
        .get("/api/v1/tours/distances/34.111745,-118.113491/unit/km")
        .expect(200);

      expect(mockTourModel.aggregate).toHaveBeenCalledWith([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [-118.113491, 34.111745],
            },
            distanceField: "distance",
            distanceMultiplier: 0.001,
          },
        },
        {
          $project: {
            distance: 1,
            name: 1,
          },
        },
      ]);
    });

    it("should default to the km multiplier for any unit other than mi", async () => {
      mockTourModel.aggregate.mockResolvedValue([]);

      await request(app)
        .get("/api/v1/tours/distances/34.111745,-118.113491/unit/xyz")
        .expect(200);

      const calledPipeline = mockTourModel.aggregate.mock.calls[0][0] as any[];
      expect(calledPipeline[0].$geoNear.distanceMultiplier).toBe(0.001);
    });

    it("should return 400 error for missing latitude", async () => {
      const response = await request(app)
        .get("/api/v1/tours/distances/,-118.113491/unit/mi")
        .expect(400);

      expect(response.body.message).toBe(
        "Please provide latitude and longitude in the format lat, lng.",
      );
    });

    it("should return 400 error for missing longitude", async () => {
      const response = await request(app)
        .get("/api/v1/tours/distances/34.111745,/unit/mi")
        .expect(400);

      expect(response.body.message).toBe(
        "Please provide latitude and longitude in the format lat, lng.",
      );
    });

    it("should return 400 error for invalid lat,lng format", async () => {
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
});
