import request from "supertest";
import { createServer } from "../server";
import { ReviewModel } from "../models/reviewModel";
import authController from "../controllers/authController";

jest.mock("../models/reviewModel");
jest.mock("../controllers/authController", () => ({
  ...jest.requireActual("../controllers/authController"),
  protect: jest.fn(),
  restrictTo: jest.fn(),
}));

const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;

process.env.JWT_SECRET = "test-jwt-secret-key-for-review-controller";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";

describe("Review Controller", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/v1/reviews - getAllReviews", () => {
    it("should get all reviews successfully", async () => {
      const mockReviews = [
        {
          _id: "review1",
          review: "Great tour experience!",
          rating: 5,
          tour: { _id: "tour1", name: "Mountain Adventure" },
          user: { _id: "user1", name: "John Doe", photo: "john.jpg" },
        },
      ];

      const mockQuery = {
        find: jest.fn().mockResolvedValue(mockReviews),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/reviews").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(1);
      expect(response.body.data.allReviews).toEqual(mockReviews);
    });

    it("should handle database errors", async () => {
      mockReviewModel.find.mockRejectedValue(
        new Error("Database connection error"),
      );

      const response = await request(app).get("/api/v1/reviews").expect(500);

      expect(response.body.status).toBe("error");
    });
  });

  describe("POST /api/v1/reviews - createReview", () => {
    beforeEach(() => {
      // Mock protect middleware to pass through with user info
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { _id: "user123", role: "user" };
          next();
        },
      );

      // Mock restrictTo middleware to allow 'user' role
      mockAuthController.restrictTo.mockImplementation(
        (...allowedRoles: any[]) => {
          return (req: any, res: any, next: any) => {
            if (req.user && allowedRoles.includes(req.user.role)) {
              next();
            } else {
              return res.status(403).json({
                status: "fail",
                message: "You do not have permission to perform this action",
              });
            }
          };
        },
      );
    });

    it("should create a new review successfully", async () => {
      const reviewData = {
        review: "Excellent tour experience!",
        rating: 5,
        tour: "tour123",
      };

      const mockCreatedReview = {
        _id: "review123",
        ...reviewData,
        user: "user123",
        createdAt: new Date(),
      };

      mockReviewModel.create.mockResolvedValue(mockCreatedReview as any);

      const response = await request(app)
        .post("/api/v1/reviews")
        .send(reviewData)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.newReview).toEqual(mockCreatedReview);
      expect(console.log).toHaveBeenCalledWith("create review");
    });

    it("should require authentication", async () => {
      // Mock protect to reject authentication
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          return res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access.",
          });
        },
      );

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({ review: "Test review", tour: "tour123" })
        .expect(401);

      expect(response.body.message).toBe(
        "You are not logged in! Please log in to get access.",
      );
    });

    it("should restrict access to users only", async () => {
      // Mock user with admin role (should be rejected)
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { _id: "admin123", role: "admin" };
          next();
        },
      );

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({ review: "Admin review", rating: 5, tour: "tour123" })
        .expect(403);

      expect(response.body.message).toBe(
        "You do not have permission to perform this action",
      );
    });

    it("should handle validation errors", async () => {
      mockReviewModel.create.mockRejectedValue({
        errors: {
          review: { message: "Review can not be empty!" },
        },
      });

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({ tour: "tour123" })
        .expect(500);

      expect(response.body.status).toBe("error");
    });
  });
});
