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

  describe("Error Handling", () => {
    describe("Unknown Routes", () => {
      it("should return 404 for unknown GET routes", async () => {
        const response = await request(app)
          .get("/api/v1/unknown-route")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /api/v1/unknown-route on this server!",
        });
      });

      it("should return 404 for unknown POST routes", async () => {
        const response = await request(app)
          .post("/api/v1/nonexistent")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /api/v1/nonexistent on this server!",
        });
      });

      it("should return 404 for unknown PATCH routes", async () => {
        const response = await request(app)
          .patch("/unknown-endpoint")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /unknown-endpoint on this server!",
        });
      });

      it("should return 404 for unknown DELETE routes", async () => {
        const response = await request(app).delete("/api/v2/tours").expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /api/v2/tours on this server!",
        });
      });

      it("should return 404 for unknown PUT routes", async () => {
        const response = await request(app).put("/api/v1/users").expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /api/v1/users on this server!",
        });
      });

      it("should handle routes with query parameters", async () => {
        const response = await request(app)
          .get("/api/v1/unknown?param=value&other=test")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message:
            "Can't find /api/v1/unknown?param=value&other=test on this server!",
        });
      });

      it("should handle deeply nested unknown routes", async () => {
        const response = await request(app)
          .get("/api/v1/tours/123/reviews/456/comments")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message:
            "Can't find /api/v1/tours/123/reviews/456/comments on this server!",
        });
      });
    });

    describe("Global Error Handler", () => {
      it("should handle validation errors with proper error format", async () => {
        const tourData = {
          name: "Bad", // Too short
          duration: 7,
          price: 299,
        };

        mockTourModel.create.mockRejectedValue(new Error("Validation error"));

        const response = await request(app)
          .post("/api/v1/tours")
          .send(tourData)
          .expect(400);

        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("message");
        expect(response.body.status).toBe("error");
      });

      it("should handle database connection errors", async () => {
        mockTourModel.find.mockImplementation(() => {
          throw new Error("Database connection failed");
        });

        const response = await request(app).get("/api/v1/tours").expect(500);

        expect(response.body).toEqual({
          status: "error",
          message: "Failed to fetch tours",
        });
      });

      it("should handle async errors in tour operations", async () => {
        const tourId = "123";

        mockTourModel.findById.mockRejectedValue(
          new Error("Async operation failed"),
        );

        const response = await request(app)
          .get(`/api/v1/tours/${tourId}`)
          .expect(500);

        expect(response.body).toEqual({
          status: "error",
          message: "Failed to fetch tour",
        });
      });
    });

    describe("AppError Class Functionality", () => {
      it("should correctly identify 4xx status codes as fail", () => {
        const error = new (require("../utils/appError").default)(
          "Not found",
          404,
        );
        expect(error.status).toBe("fail");
        expect(error.statusCode).toBe(404);
        expect(error.isOperational).toBe(true);
      });

      it("should correctly identify 5xx status codes as error", () => {
        const error = new (require("../utils/appError").default)(
          "Server error",
          500,
        );
        expect(error.status).toBe("error");
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
      });

      it("should handle custom error messages", () => {
        const customMessage = "Custom validation error";
        const error = new (require("../utils/appError").default)(
          customMessage,
          422,
        );
        expect(error.message).toBe(customMessage);
        expect(error.status).toBe("fail");
      });
    });

    describe("Error Handler Integration", () => {
      it("should not interfere with successful requests", async () => {
        const response = await request(app).get("/health").expect(200);

        expect(response.body).toEqual({ ok: true });
      });

      it("should handle errors in middleware chain", async () => {
        // Mock findById to throw a CastError for invalid ObjectId format
        const castError = new Error("Cast to ObjectId failed");
        castError.name = "CastError";
        (castError as any).kind = "ObjectId";

        mockTourModel.findById.mockRejectedValue(castError);

        const response = await request(app)
          .get("/api/v1/tours/invalid-id-format")
          .expect(404);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Tour not found");
      });
    });
  });
});
