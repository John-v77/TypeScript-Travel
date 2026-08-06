import request from "supertest";
import { createServer } from "../server";
import { ReviewModel } from "../models/reviewModel";
import authController from "../controllers/authController";

jest.mock("../models/reviewModel");
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn(),
      // restrictTo("role") is called once at route-registration time (when
      // reviewRoutes.ts is first required), before any beforeEach runs, so
      // it needs a real pass-through implementation here — a bare jest.fn()
      // returns undefined and crashes Route.post() with "callback function
      // ... [object Undefined]". Tests below still override it per-scenario
      // via mockImplementation.
      restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
    },
  };
});

const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;

process.env.JWT_SECRET = "test-jwt-secret-key-for-nested-routes";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";

describe("Nested Routes - Tour Reviews", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();

    // Mock protect middleware to pass authentication
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { _id: "user123", role: "user" };
        next();
      },
    );

    // Mock restrictTo middleware
    mockAuthController.restrictTo.mockImplementation(() => {
      return (req: any, res: any, next: any) => next();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/v1/tours/:tourId/reviews", () => {
    it("should get reviews for a specific tour", async () => {
      const tourId = "tour123";
      const mockTourReviews = [
        {
          _id: "review1",
          review: "Great tour!",
          rating: 5,
          tour: tourId,
          user: { _id: "user1", name: "John Doe" },
        },
        {
          _id: "review2",
          review: "Amazing experience!",
          rating: 4,
          tour: tourId,
          user: { _id: "user2", name: "Jane Smith" },
        },
      ];

      const mockQuery = {
        find: jest.fn().mockResolvedValue(mockTourReviews),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}/reviews`)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data.allReviews).toEqual(mockTourReviews);

      // Verify that the filter was applied with the correct tourId
      expect(mockReviewModel.find).toHaveBeenCalledWith({ tour: tourId });
    });

    it("should return empty array when tour has no reviews", async () => {
      const tourId = "tour456";

      const mockQuery = {
        find: jest.fn().mockResolvedValue([]),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}/reviews`)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data.allReviews).toEqual([]);

      // Verify filter was applied
      expect(mockReviewModel.find).toHaveBeenCalledWith({ tour: tourId });
    });
  });

  describe("POST /api/v1/tours/:tourId/reviews", () => {
    it("should create a review for a specific tour", async () => {
      const tourId = "tour123";
      const reviewData = {
        review: "Excellent experience!",
        rating: 5,
        // Note: no tour field provided - should be auto-set from URL
      };

      const expectedReviewData = {
        ...reviewData,
        tour: tourId,
      };

      const mockCreatedReview = {
        _id: "review123",
        ...expectedReviewData,
        user: "user123",
        createdAt: new Date(),
      };

      mockReviewModel.create.mockResolvedValue(mockCreatedReview as any);

      const response = await request(app)
        .post(`/api/v1/tours/${tourId}/reviews`)
        .send(reviewData)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.newReview).toEqual(mockCreatedReview);

      // Verify that the tour ID was automatically set from the URL parameter
      expect(mockReviewModel.create).toHaveBeenCalledWith(expectedReviewData);
    });

    it("should not override tour field if already provided in body", async () => {
      const tourId = "tour123";
      const reviewData = {
        review: "Great tour!",
        rating: 4,
        tour: "differentTour456", // Explicitly provided tour ID
      };

      const mockCreatedReview = {
        _id: "review123",
        ...reviewData,
        user: "user123",
      };

      mockReviewModel.create.mockResolvedValue(mockCreatedReview as any);

      const response = await request(app)
        .post(`/api/v1/tours/${tourId}/reviews`)
        .send(reviewData)
        .expect(201);

      // Should use the explicitly provided tour ID, not the URL parameter
      expect(mockReviewModel.create).toHaveBeenCalledWith(reviewData);
    });
  });

  describe("Route comparison - Direct vs Nested", () => {
    it("should work for direct route /api/v1/reviews", async () => {
      const mockQuery = {
        find: jest.fn().mockResolvedValue([]),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/reviews").expect(200);

      expect(response.body.status).toBe("success");

      // Direct route should not have any filter
      expect(mockReviewModel.find).toHaveBeenCalledWith({});
    });

    it("should work for nested route /api/v1/tours/:tourId/reviews", async () => {
      const tourId = "tour789";
      const mockQuery = {
        find: jest.fn().mockResolvedValue([]),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}/reviews`)
        .expect(200);

      expect(response.body.status).toBe("success");

      // Nested route should filter by tour ID
      expect(mockReviewModel.find).toHaveBeenCalledWith({ tour: tourId });
    });
  });
});
