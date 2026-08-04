import request from "supertest";
import { createServer } from "../server";
import { BookingModel } from "../models/bookingModel";
import { ReviewModel } from "../models/reviewModel";
import { TourModel } from "../models/tourModel";

jest.mock("../models/bookingModel");
jest.mock("../models/reviewModel");
jest.mock("../models/tourModel");

const mockBookingModel = BookingModel as jest.Mocked<typeof BookingModel>;
const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;
const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController");
  return {
    __esModule: true,
    default: {
      ...actual.default,
      protect: jest.fn((req: any, res: any, next: any) => {
        req.user = {
          id: "user123",
          role: "user",
        };
        next();
      }),
      restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
    },
  };
});

describe("Review Booking Check Middleware", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/reviews", () => {
    it("should allow review if user has booked the tour", async () => {
      const mockBooking = {
        _id: "booking123",
        tour: "tour123",
        user: "user123",
        price: 497,
      };

      const mockReview = {
        _id: "review123",
        review: "Great tour!",
        rating: 5,
        tour: "tour123",
        user: "user123",
      };

      mockBookingModel.findOne.mockResolvedValue(mockBooking as any);
      mockReviewModel.create.mockResolvedValue(mockReview as any);

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({
          review: "Great tour!",
          rating: 5,
          tour: "tour123",
        })
        .expect(201);

      expect(mockBookingModel.findOne).toHaveBeenCalledWith({
        tour: "tour123",
        user: "user123",
      });
      expect(response.body.status).toBe("success");
    });

    it("should prevent review if user has not booked the tour", async () => {
      mockBookingModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({
          review: "Great tour!",
          rating: 5,
          tour: "tour123",
        })
        .expect(403);

      expect(mockBookingModel.findOne).toHaveBeenCalledWith({
        tour: "tour123",
        user: "user123",
      });
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "You can only review tours you have booked"
      );
    });
  });

  describe("POST /api/v1/tours/:tourId/reviews", () => {
    it("should allow review if user has booked the tour (nested route)", async () => {
      const tourId = "tour456";
      const mockBooking = {
        _id: "booking456",
        tour: tourId,
        user: "user123",
        price: 597,
      };

      const mockReview = {
        _id: "review456",
        review: "Amazing experience!",
        rating: 5,
        tour: tourId,
        user: "user123",
      };

      mockBookingModel.findOne.mockResolvedValue(mockBooking as any);
      mockReviewModel.create.mockResolvedValue(mockReview as any);

      const response = await request(app)
        .post(`/api/v1/tours/${tourId}/reviews`)
        .send({
          review: "Amazing experience!",
          rating: 5,
        })
        .expect(201);

      expect(mockBookingModel.findOne).toHaveBeenCalledWith({
        tour: tourId,
        user: "user123",
      });
      expect(response.body.status).toBe("success");
    });

    it("should prevent review if user has not booked the tour (nested route)", async () => {
      const tourId = "tour456";
      mockBookingModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/v1/tours/${tourId}/reviews`)
        .send({
          review: "Amazing experience!",
          rating: 5,
        })
        .expect(403);

      expect(mockBookingModel.findOne).toHaveBeenCalledWith({
        tour: tourId,
        user: "user123",
      });
      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "You can only review tours you have booked"
      );
    });
  });
});
