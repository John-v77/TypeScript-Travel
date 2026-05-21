import request from "supertest";
import { createServer } from "../server";
import { Tour, TourModel } from "../models/tourModel";

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

      mockTourModel.find.mockResolvedValue(mockTours as any);

      const response = await request(app).get("/api/v1/tours").expect(200);

      expect(response.body).toEqual({
        status: "success",
        results: 2,
        data: {
          tours: mockTours,
        },
      });
    });

    it("should handle database error", async () => {
      mockTourModel.find.mockRejectedValue(new Error("Database error"));

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
