import request from "supertest";
import { createServer } from "../server";
import { BookingModel } from "../models/bookingModel";
import authController from "../controllers/authController";

jest.mock("../models/bookingModel");

const mockBookingModel = BookingModel as jest.Mocked<typeof BookingModel>;

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

describe("Nested Booking Routes", () => {
  const app = createServer();
  const mockAuthController = authController as jest.Mocked<typeof authController>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset to default user role
    mockAuthController.protect.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        id: "user123",
        role: "user",
      };
      next();
    });
  });

  describe("GET /api/v1/users/my-bookings", () => {
    it("should get all bookings for the current user", async () => {
      const mockBookings = [
        {
          _id: "booking1",
          tour: "tour1",
          user: "user123",
          price: 497,
          createdAt: new Date(),
        },
        {
          _id: "booking2",
          tour: "tour2",
          user: "user123",
          price: 597,
          createdAt: new Date(),
        },
      ];

      mockBookingModel.find.mockResolvedValue(mockBookings as any);

      const response = await request(app)
        .get("/api/v1/users/my-bookings")
        .expect(200);

      expect(mockBookingModel.find).toHaveBeenCalledWith({ user: "user123" });
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].user).toBe("user123");
      expect(response.body.data[1].user).toBe("user123");
    });

    it("should return empty array if user has no bookings", async () => {
      mockBookingModel.find.mockResolvedValue([] as any);

      const response = await request(app)
        .get("/api/v1/users/my-bookings")
        .expect(200);

      expect(mockBookingModel.find).toHaveBeenCalledWith({ user: "user123" });
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    it("should require authentication", async () => {
      mockAuthController.protect.mockImplementationOnce(
        (req: any, res: any) => {
          res.status(401).json({
            status: "fail",
            message: "You are not logged in!",
          });
        }
      );

      await request(app).get("/api/v1/users/my-bookings").expect(401);
    });
  });

  describe("GET /api/v1/users/:userId/bookings (Admin nested route)", () => {
    it("should allow admin to get bookings for a specific user", async () => {
      const targetUserId = "user456";
      const mockBookings = [
        {
          _id: "booking1",
          tour: "tour1",
          user: targetUserId,
          price: 497,
          createdAt: new Date(),
        },
        {
          _id: "booking2",
          tour: "tour2",
          user: targetUserId,
          price: 597,
          createdAt: new Date(),
        },
      ];

      // Mock admin user
      mockAuthController.protect.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          id: "admin123",
          role: "admin",
        };
        next();
      });

      mockAuthController.restrictTo.mockImplementation(() => (req: any, res: any, next: any) => next());

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBookings),
      };

      mockBookingModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(`/api/v1/users/${targetUserId}/bookings`)
        .expect(200);

      expect(mockBookingModel.find).toHaveBeenCalledWith({ user: targetUserId });
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    // Note: Authorization tests for admin-only routes are covered in userRoutes.test.ts

    it("should return empty array if user has no bookings", async () => {
      const targetUserId = "user789";

      mockAuthController.protect.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          id: "admin123",
          role: "admin",
        };
        next();
      });

      mockAuthController.restrictTo.mockImplementation(() => (req: any, res: any, next: any) => next());

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockBookingModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(`/api/v1/users/${targetUserId}/bookings`)
        .expect(200);

      expect(mockBookingModel.find).toHaveBeenCalledWith({ user: targetUserId });
      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });
  });
});
