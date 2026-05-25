import request from "supertest";
import { createServer } from "../server";
import { TourModel } from "../models/tourModel";

jest.mock("../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
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
        status: "error",
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
        message: "Failed to fetch tours",
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
        message: "Failed to fetch tours",
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
        message: "Failed to get tour statistics",
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
        message: "Failed to get monthly plan",
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
        .expect(400);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to create tour",
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
        status: "error",
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
        message: "Failed to fetch tour",
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
        status: "error",
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
        .expect(400);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to update tour",
      });
    });
  });

  describe("DELETE /api/v1/tours/:id", () => {
    it("should delete a tour package", async () => {
      const tourId = "123";
      const mockTour = { _id: tourId, name: "Test Tour" };

      mockTourModel.findByIdAndDelete.mockResolvedValue(mockTour as any);

      await request(app).delete(`/api/v1/tours/${tourId}`).expect(204);
    });

    it("should return 404 for non-existent tour", async () => {
      const tourId = "123";

      mockTourModel.findByIdAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .expect(404);

      expect(response.body).toEqual({
        status: "error",
        message: "Tour not found",
      });
    });

    it("should handle database error", async () => {
      const tourId = "123";

      mockTourModel.findByIdAndDelete.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .delete(`/api/v1/tours/${tourId}`)
        .expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to delete tour",
      });
    });
  });
  describe("Virtual Fields", () => {
    it("should include virtual field durationWeeks in JSON response for single tour", async () => {
      const tourId = "123";
      const mockTour = {
        _id: tourId,
        name: "Test Tour",
        duration: 14,
        price: 299,
        toJSON: () => ({
          _id: tourId,
          name: "Test Tour",
          duration: 14,
          price: 299,
          durationWeeks: 2,
        }),
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(response.body.data.tour.durationWeeks).toBe(2);
      expect(response.body.data.tour.duration).toBe(14);
    });

    it("should include virtual field durationWeeks in JSON response for tour list", async () => {
      const mockTours = [
        {
          _id: "1",
          name: "Tour 1",
          duration: 7,
          price: 299,
          toJSON: () => ({
            _id: "1",
            name: "Tour 1",
            duration: 7,
            price: 299,
            durationWeeks: 1,
          }),
        },
        {
          _id: "2",
          name: "Tour 2",
          duration: 21,
          price: 399,
          toJSON: () => ({
            _id: "2",
            name: "Tour 2",
            duration: 21,
            price: 399,
            durationWeeks: 3,
          }),
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

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(response.body.data.tours[0].durationWeeks).toBe(1);
      expect(response.body.data.tours[1].durationWeeks).toBe(3);
    });

    it("should calculate durationWeeks correctly for different durations", async () => {
      const tourId = "123";
      const mockTour = {
        _id: tourId,
        name: "Test Tour",
        duration: 10,
        price: 299,
        toJSON: () => ({
          _id: tourId,
          name: "Test Tour",
          duration: 10,
          price: 299,
          durationWeeks: 10 / 7,
        }),
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(response.body.data.tour.durationWeeks).toBeCloseTo(1.43, 2);
    });

    it("should include virtual field in created tour response", async () => {
      const tourData = {
        name: "Test Tour",
        duration: 14,
        price: 299,
      };

      const mockCreatedTour = {
        _id: "123",
        ...tourData,
        toJSON: () => ({
          _id: "123",
          ...tourData,
          durationWeeks: 2,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.durationWeeks).toBe(2);
    });

    it("should include virtual field in updated tour response", async () => {
      const tourId = "123";
      const updateData = {
        name: "Updated Tour",
        duration: 28,
        price: 399,
      };

      const mockUpdatedTour = {
        _id: tourId,
        ...updateData,
        toJSON: () => ({
          _id: tourId,
          ...updateData,
          durationWeeks: 4,
        }),
      };
      mockTourModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedTour as any);

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.tour.durationWeeks).toBe(4);
    });
  });

  describe("Document Middleware - Slugify", () => {
    it("should generate slug when creating a new tour", async () => {
      const tourData = {
        name: "The Forest Hiker",
        duration: 14,
        price: 299,
      };

      const mockCreatedTour = {
        _id: "123",
        ...tourData,
        slug: "the-forest-hiker",
        toJSON: () => ({
          _id: "123",
          ...tourData,
          slug: "the-forest-hiker",
          durationWeeks: 2,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.slug).toBe("the-forest-hiker");
      expect(response.body.data.tour.name).toBe("The Forest Hiker");
    });

    it("should generate slug with special characters removed", async () => {
      const tourData = {
        name: "The Amazing Tour: Adventure & Fun!",
        duration: 7,
        price: 199,
      };

      const mockCreatedTour = {
        _id: "124",
        ...tourData,
        slug: "the-amazing-tour-adventure-fun",
        toJSON: () => ({
          _id: "124",
          ...tourData,
          slug: "the-amazing-tour-adventure-fun",
          durationWeeks: 1,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.slug).toBe(
        "the-amazing-tour-adventure-fun",
      );
    });

    it("should generate slug with spaces converted to hyphens", async () => {
      const tourData = {
        name: "Mountain Climbing Experience",
        duration: 21,
        price: 599,
      };

      const mockCreatedTour = {
        _id: "125",
        ...tourData,
        slug: "mountain-climbing-experience",
        toJSON: () => ({
          _id: "125",
          ...tourData,
          slug: "mountain-climbing-experience",
          durationWeeks: 3,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.slug).toBe("mountain-climbing-experience");
    });

    it("should generate lowercase slug", async () => {
      const tourData = {
        name: "EXTREME ADVENTURE TOUR",
        duration: 10,
        price: 899,
      };

      const mockCreatedTour = {
        _id: "126",
        ...tourData,
        slug: "extreme-adventure-tour",
        toJSON: () => ({
          _id: "126",
          ...tourData,
          slug: "extreme-adventure-tour",
          durationWeeks: 10 / 7,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.slug).toBe("extreme-adventure-tour");
    });

    it("should update slug when tour name is updated", async () => {
      const tourId = "123";
      const updateData = {
        name: "New Adventure Name",
        duration: 28,
        price: 399,
      };

      const mockUpdatedTour = {
        _id: tourId,
        ...updateData,
        slug: "new-adventure-name",
        toJSON: () => ({
          _id: tourId,
          ...updateData,
          slug: "new-adventure-name",
          durationWeeks: 4,
        }),
      };
      mockTourModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedTour as any);

      const response = await request(app)
        .patch(`/api/v1/tours/${tourId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.tour.slug).toBe("new-adventure-name");
      expect(response.body.data.tour.name).toBe("New Adventure Name");
    });

    it("should handle numbers in tour name for slug generation", async () => {
      const tourData = {
        name: "7-Day Beach Adventure 2024",
        duration: 7,
        price: 299,
      };

      const mockCreatedTour = {
        _id: "127",
        ...tourData,
        slug: "7-day-beach-adventure-2024",
        toJSON: () => ({
          _id: "127",
          ...tourData,
          slug: "7-day-beach-adventure-2024",
          durationWeeks: 1,
        }),
      };
      mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

      const response = await request(app)
        .post("/api/v1/tours")
        .send(tourData)
        .expect(201);

      expect(response.body.data.tour.slug).toBe("7-day-beach-adventure-2024");
    });
  });
});
