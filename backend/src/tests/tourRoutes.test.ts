import request from "supertest";
import { createServer } from "../server";
import { TourModel } from "../models/tourModel";

jest.mock("../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
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
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=-price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should sort tours by multiple fiels", async () => {
      const mockTours = [
        { _id: "1", name: "Tour A", price: 299, difficulty: "easy" },
        { _id: "2", name: "Tour B", price: 299, difficulty: "medium" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price,difficulty")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price difficulty");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);
      const response = await request(app)
        .get("/api/v1/tours?sort=name")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("name");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price")
        .expect(200);

      expect(mockTourModel.find).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");
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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?price[gte]=400&sort=-price")
        .expect(200);

      expect(mockTourModel.find).toHaveBeenCalledWith({
        price: { $gte: "400" },
      });
      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(mockQuery.select).toHaveBeenLastCalledWith("__v");
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should limit fields when field query parameter is provided", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?field=name, price")
        .expect(200);

      expect(mockQuery.select).toHaveBeenLastCalledWith("name price");
      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          tour: mockTours,
        },
      });
    });

    it("should exclude __v field by defaul when no fields spefified", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);
      const response = await request(app).get("./api/v1/tours").expect(200);

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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("./api/v1/tours?fields=name")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("name");
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
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price&fields=name,price")
        .expect(200);

      expect(mockTourModel.find).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("name price");
    });

    it("should exclude specific fields using minus prefix", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", difficulty: "easy" },
        { _id: "2", name: "Tour 2", difficulty: "medium" },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockTours),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("./api/v1/tours?fields=-price,-summary")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("-price -summary");
      expect(response.body).toEqual({
        status: "success",
        result: 2,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should handle database error", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/tours").expect(500);

      expect(response.body).toEqual({
        status: "error",
        message: "Failed to fetch tours",
      });
    });
  });

  describe("POST /api/v1/tours", () => {
    it("should create a new tour", async () => {
      const tourData = {
        name: "Test Tour",
        price: 200,
        duration: 5,
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
  });

  describe("DELETE /api/v1/tours/:id", () => {
    it("should delete a tour package", async () => {
      const tourId = "123";
      const mockTour = { _i: tourId, name: "Test Tour" };

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
});
