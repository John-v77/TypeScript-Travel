import request from "supertest";
import { createServer } from "../server";
import { TourModel } from "../models/tourModel";
import AppError from "../utils/appError";

jest.mock("../models/tourModel");
// Bypass auth so protected routes (e.g. GET /tours) are reachable in tests
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, res: any, next: any) => next()),
    },
  };
});

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
        const response = await request(app)
          .put("/api/v1/nothing-here")
          .expect(404);

        expect(response.body).toEqual({
          status: "fail",
          message: "Can't find /api/v1/nothing-here on this server!",
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
          .expect(500);

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
          message: "Database connection failed",
        });
      });

      it("should handle async errors in tour operations", async () => {
        const tourId = "5c88fa8cf4afda39709c2955";

        mockTourModel.findById.mockReturnValue({
          populate: jest
            .fn()
            .mockRejectedValue(new Error("Async operation failed")),
        } as any);

        const response = await request(app)
          .get(`/api/v1/tours/${tourId}`)
          .expect(500);

        expect(response.body).toEqual({
          status: "error",
          message: "Async operation failed",
        });
      });
    });

    describe("AppError Class Functionality", () => {
      it("should correctly identify 4xx status codes as fail", () => {
        const error = new AppError("Not found", 404);
        expect(error.status).toBe("fail");
        expect(error.statusCode).toBe(404);
        expect(error.isOperational).toBe(true);
      });

      it("should correctly identify 5xx status codes as error", () => {
        const error = new AppError("Server error", 500);
        expect(error.status).toBe("error");
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
      });

      it("should handle custom error messages", () => {
        const customMessage = "Custom validation error";
        const error = new AppError(customMessage, 422);
        expect(error.message).toBe(customMessage);
        expect(error.status).toBe("fail");
      });
    });

    describe("Error Handler Integration", () => {
      it("should not interfere with successful requests", async () => {
        const response = await request(app).get("/health").expect(200);

        expect(response.body).toEqual({ ok: true });
      });

      it("turns an invalid id (CastError) into a 400", async () => {
        const castError = Object.assign(new Error("Cast to ObjectId failed"), {
          name: "CastError",
          kind: "ObjectId",
          path: "_id",
          value: "invalid-id-format",
        });

        mockTourModel.findById.mockReturnValue({
          populate: jest.fn().mockRejectedValue(castError),
        } as any);

        const response = await request(app)
          .get("/api/v1/tours/5c88fa8cf4afda39709c2955")
          .expect(400);

        expect(response.body).toEqual({
          status: "fail",
          message: "Invalid _id: invalid-id-format.",
        });
      });

      // e.g. signing up with an email that is already registered.
      it("turns a duplicate key (code 11000) into a 400", async () => {
        const duplicate = Object.assign(new Error("E11000 duplicate key"), {
          code: 11000,
          keyValue: { name: "The Sea Explorer" },
        });

        mockTourModel.findById.mockReturnValue({
          populate: jest.fn().mockRejectedValue(duplicate),
        } as any);

        const response = await request(app)
          .get("/api/v1/tours/5c88fa8cf4afda39709c2955")
          .expect(400);

        expect(response.body.message).toBe(
          "Duplicate field value: The Sea Explorer. Please use another value!",
        );
      });

      it("turns a validation error into a 400 listing every problem", async () => {
        const invalid = Object.assign(new Error("Validation failed"), {
          name: "ValidationError",
          errors: {
            price: { message: "A tour must have a price" },
            name: { message: "A tour must have a name" },
          },
        });

        mockTourModel.findById.mockReturnValue({
          populate: jest.fn().mockRejectedValue(invalid),
        } as any);

        const response = await request(app)
          .get("/api/v1/tours/5c88fa8cf4afda39709c2955")
          .expect(400);

        expect(response.body.message).toBe(
          "Invalid input data. A tour must have a price. A tour must have a name",
        );
      });
    });
  });
});
