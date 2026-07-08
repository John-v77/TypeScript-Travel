import request from "supertest";
import { createServer } from "../server";
import { TourModel } from "../models/tourModel";
import { UserModel } from "../models/userModel";
import * as authController from "../controllers/authController";
import * as tourController from "../controllers/tourController";

jest.mock("../models/tourModel");
jest.mock("../controllers/authController", () => ({
  ...jest.requireActual("../controllers/authController"),
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
}));
jest.mock("../controllers/tourController", () => ({
  ...jest.requireActual("../controllers/tourController"),
  deleteTourPackage: jest.fn(),
}));

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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
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
          tours: mockTours,
        },
      });
    });

    it("should handle pagination with page validation", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);
      mockTourModel.countDocuments.mockResolvedValue(25);

      const response = await request(app)
        .get("/api/v1/tours?page=5&limit=10")
        .expect(400);

      expect(mockTourModel.countDocuments).toHaveBeenCalled();
      expect(response.body).toEqual({
        status: "fail",
        message: "This page does not exist",
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
          tours: mockTours,
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
          tours: mockTours,
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

  describe("GET /api/v1/tours/top-5-cheap", () => {
    it("should get top 5 cheap tours successfully", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingAverage: 4.8 },
        { _id: "2", name: "Cheap Tour 2", price: 249, ratingAverage: 4.7 },
        { _id: "3", name: "Cheap Tour 3", price: 299, ratingAverage: 4.6 },
        { _id: "4", name: "Cheap Tour 4", price: 349, ratingAverage: 4.5 },
        { _id: "5", name: "Cheap Tour 5", price: 399, ratingAverage: 4.4 },
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
        .get("/api/v1/tours/top-5-cheap")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingAverage price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 5,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should handle top-5-cheap with custom fields (middleware overrides)", async () => {
      const mockTours = [
        { name: "Cheap Tour 1", price: 199, ratingAverage: 4.8 },
        { name: "Cheap Tour 2", price: 249, ratingAverage: 4.7 },
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
        .get("/api/v1/tours/top-5-cheap?fields=name,price,ratingAverage")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingAverage price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should handle top-5-cheap with additional filters", async () => {
      const mockTours = [
        {
          _id: "1",
          name: "Easy Cheap Tour",
          price: 199,
          ratingAverage: 4.8,
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
        .get("/api/v1/tours/top-5-cheap?difficulty=easy")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingAverage price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should override any limit parameter with 5", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingAverage: 4.8 },
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
        .get("/api/v1/tours/top-5-cheap?limit=100")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingAverage price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should override any sort parameter with rating and price sort", async () => {
      const mockTours = [
        { _id: "1", name: "Cheap Tour 1", price: 199, ratingAverage: 4.8 },
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
        .get("/api/v1/tours/top-5-cheap?sort=name")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-ratingAverage price");
      expect(mockQuery.select).toHaveBeenCalledWith(
        "name price ratingAverage summary difficulty",
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should handle database error for top-5-cheap", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours/top-5-cheap")
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Database error",
      });
    });
  });

  describe("GET /api/v1/tours/tour-stats", () => {
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
        .get("/api/v1/tours/tour-stats")
        .expect(200);

      expect(mockTourModel.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: { $toUpper: "$difficulty" },
            num: { $sum: 1 },
            numRatings: { $sum: "$ratingQuantity" },
            avgRating: { $avg: "$ratingAverage" },
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
        .get("/api/v1/tours/tour-stats")
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
          tour: mockCreatedTour,
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

      mockTourModel.findById.mockResolvedValue(mockTour as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(response.body).toEqual({
        status: "success",
        data: {
          tour: mockTour,
        },
      });
    });

    it("should return 404 for non-existent tour", async () => {
      const tourId = "123";

      mockTourModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(404);

      expect(response.body).toEqual({
        status: "fail",
        message: "Tour not found",
      });
    });

    it("should handle database error", async () => {
      const tourId = "123";

      mockTourModel.findById.mockRejectedValue(new Error("Database error"));

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
          tour: mockUpdatedTour,
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
        message: "Tour not found",
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

  describe("Guides population middleware", () => {
    it("should populate the guides field when finding tours", async () => {
      const guide = await UserModel.create({
        name: "John Doe",
        email: "john@test.com",
        password: "password123",
        passwordConfirm: "password123",
      });

      const tour = await TourModel.create({
        name: "Amazing Forest Tour",
        duration: 10,
        maxGroupSize: "8",
        difficulty: "easy",
        price: 299,
        summary: "Great tour",
        imageCover: "cover.jpg",
        guides: [guide._id],
      });

      const result = await TourModel.findById(tour._id);

      expect(result).not.toBeNull();

      expect(result!.guides).toHaveLength(1);

      expect(result!.guides[0]).toHaveProperty("name", "John Doe");
      expect(result!.guides[0]).not.toHaveProperty("__v");
      expect(result!.guides[0]).not.toHaveProperty("active");
    });

    it("should exclude secret tours", async () => {
      await TourModel.create({
        name: "Visible Tour",
        duration: 5,
        maxGroupSize: "10",
        difficulty: "easy",
        price: 100,
        summary: "summary",
        imageCover: "cover.jpg",
      });

      await TourModel.create({
        name: "Hidden Secret Tour",
        duration: 5,
        maxGroupSize: "10",
        difficulty: "easy",
        price: 100,
        summary: "summary",
        imageCover: "cover.jpg",
        secretTour: true,
      });

      const tours = await TourModel.find();

      expect(tours).toHaveLength(1);
      expect(tours[0].name).toBe("Visible Tour");
    });
    it("should generate a slug before saving", async () => {
      const tour = await TourModel.create({
        name: "Amazing Forest Adventure",
        duration: 10,
        maxGroupSize: "5",
        difficulty: "easy",
        price: 250,
        summary: "summary",
        imageCover: "cover.jpg",
      });

      expect(tour.slug).toBe("amazing-forest-adventure");
    });
    it("should calculate durationWeeks", async () => {
      const tour = new TourModel({
        name: "Amazing Forest Adventure",
        duration: 14,
        maxGroupSize: "5",
        difficulty: "easy",
        price: 250,
        summary: "summary",
        imageCover: "cover.jpg",
      });

      expect(tour.durationWeeks).toBe(2);
    });
    it("should exclude secret tours from aggregate", async () => {
      await TourModel.create({
        name: "Visible Tour",
        duration: 5,
        maxGroupSize: "5",
        difficulty: "easy",
        price: 200,
        summary: "summary",
        imageCover: "cover.jpg",
      });

      await TourModel.create({
        name: "Secret Tour",
        duration: 5,
        maxGroupSize: "5",
        difficulty: "easy",
        price: 200,
        summary: "summary",
        imageCover: "cover.jpg",
        secretTour: true,
      });

      const tours = await TourModel.aggregate([
        {
          $match: {},
        },
      ]);

      expect(tours).toHaveLength(1);
      expect(tours[0].name).toBe("Visible Tour");
    });
    it("should log query execution time", async () => {
      const spy = jest.spyOn(console, "log").mockImplementation();

      await TourModel.find();

      expect(spy).toHaveBeenCalledWith(
        expect.stringMatching(/^Query took \d+ milliseconds!$/),
      );

      spy.mockRestore();
    });
    it("should log when populate middleware executes", async () => {
      const spy = jest.spyOn(console, "log").mockImplementation();

      await TourModel.find();

      expect(spy).toHaveBeenCalledWith("populating");

      spy.mockRestore();
    });
  });
});
