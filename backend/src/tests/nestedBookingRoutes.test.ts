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

  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockAuthController = authController as jest.Mocked<
        typeof authController
      >;

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
});
