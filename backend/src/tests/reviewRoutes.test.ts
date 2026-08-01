import authController from "../controllers/authController";
import request from "supertest";
import { createServer } from "../server";
import { ReviewModel } from "../models/reviewModel";

jest.mock("../models/reviewModel");
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, res: any, next: any) => next()),
      // restrictTo("user") is only ever called once, when createServer()
      // registers the route. The returned closure must therefore do its
      // own dynamic req.user.role check on every request - a later
      // mockImplementation() override on restrictTo itself would never
      // reach the already-wired-in route.
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

const mockReviewModel = ReviewModel as jest.Mocked<typeof ReviewModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;

process.env.JWT_SECRET = "test-jwt-secret-key-for-review-routes";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";

describe("Review Routes", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/v1/reviews", () => {
    it("should be accessible without authentication", async () => {
      const mockReviews = [
        {
          _id: "review1",
          review: "Great tour!",
          rating: 5,
          tour: { _id: "tour1", name: "Adventure Tour" },
          user: { _id: "user1", name: "John Doe", photo: "john.jpg" },
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReviews),
      };

      mockReviewModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/reviews").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(1);
      expect(response.body.data).toEqual(mockReviews);
    });
  });

  describe("POST /api/v1/reviews", () => {
    beforeEach(() => {
      // Mock protect middleware to pass through with user info.
      // restrictTo("user") is NOT re-mocked here: it's only ever invoked
      // once, when createServer() registers the route, so the closure
      // wired into the route is fixed at that point and is already
      // role-aware by default (see the module-level mock above).
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { _id: "user123", role: "user" };
          next();
        },
      );
    });

    it("should allow authenticated users to create reviews", async () => {
      const reviewData = {
        review: "Excellent experience!",
        rating: 5,
        tour: "tour123",
      };

      const mockCreatedReview = {
        _id: "review123",
        ...reviewData,
        user: "user123",
      };

      mockReviewModel.create.mockResolvedValue(mockCreatedReview as any);

      const response = await request(app)
        .post("/api/v1/reviews")
        .send(reviewData)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual(mockCreatedReview);
      expect(mockAuthController.protect).toHaveBeenCalled();
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
        .send({ review: "Test", tour: "tour123" })
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

    it("should handle controller errors gracefully", async () => {
      mockReviewModel.create.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .post("/api/v1/reviews")
        .send({ review: "Test review", tour: "tour123" })
        .expect(500);

      expect(response.body.status).toBe("error");
    });
  });

  describe("Route Configuration", () => {
    it("should return 404 for unsupported routes", async () => {
      const response = await request(app)
        .put("/api/v1/reviews")
        .send({ data: "test" })
        .expect(404);

      expect(response.body.status).toBe("fail");
    });

    it("should handle OPTIONS request for CORS", async () => {
      const response = await request(app).options("/api/v1/reviews");

      expect([200, 204]).toContain(response.status);
    });
  });
});
