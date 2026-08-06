import request from "supertest";
import { BookingModel } from "../models/bookingModel";
import { TourModel } from "../models/tourModel";
import authController from "../controllers/authController";

const mockCheckoutSessionsCreate = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockCheckoutSessionsCreate,
      },
    },
  }));
});

jest.mock("../models/bookingModel");
jest.mock("../models/tourModel");

const mockBookingModel = BookingModel as jest.Mocked<typeof BookingModel>;
const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController");
  return {
    __esModule: true,
    default: {
      ...actual.default,
      protect: jest.fn((req: any, res: any, next: any) => {
        req.user = {
          _id: "user123",
          email: "test@example.com",
          name: "Test User",
        };
        next();
      }),
      restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
    },
  };
});

process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";

import { createServer } from "../server";

describe("Booking Routes", () => {
  const app = createServer();
  const mockAuthController = authController as jest.Mocked<
    typeof authController
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = {
          _id: "user123",
          email: "test@example.com",
          name: "Test User",
        };
        next();
      },
    );

    mockAuthController.restrictTo.mockImplementation(
      () => (req: any, res: any, next: any) => next(),
    );
  });

  describe("GET /api/v1/bookings/checkout-session/:tourId", () => {
    it("should create a checkout session successfully", async () => {
      const tourId = "507f1f77bcf86cd799439011";
      const mockTour = {
        _id: tourId,
        name: "The Forest Hiker",
        slug: "the-forest-hiker",
        summary: "Exciting tour in the forest",
        imageCover: "tour-1-cover.jpg",
        price: 497,
      };

      const mockSession = {
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
        payment_method_types: ["card"],
        customer_email: "test@example.com",
        client_reference_id: tourId,
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);
      mockCheckoutSessionsCreate.mockResolvedValue(mockSession);

      const response = await request(app)
        .get(`/api/v1/bookings/checkout-session/${tourId}`)
        .expect(200);

      expect(mockTourModel.findById).toHaveBeenCalledWith(tourId);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ["card"],
          customer_email: "test@example.com",
          client_reference_id: tourId,
        }),
      );
      expect(response.body.status).toBe("success");
      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBe("cs_test_123");
    });

    it("should include correct URLs in checkout session", async () => {
      const tourId = "507f1f77bcf86cd799439011";
      const mockTour = {
        _id: tourId,
        name: "The Forest Hiker",
        slug: "the-forest-hiker",
        summary: "Exciting tour in the forest",
        imageCover: "tour-1-cover.jpg",
        price: 497,
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: "cs_test_123",
      } as any);

      await request(app)
        .get(`/api/v1/bookings/checkout-session/${tourId}`)
        .expect(200);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining("/my-tours?alert=booking"),
          cancel_url: expect.stringContaining(`/tour/${mockTour.slug}`),
        }),
      );
    });

    it("should include correct line items with tour details", async () => {
      const tourId = "507f1f77bcf86cd799439011";
      const mockTour = {
        _id: tourId,
        name: "The Forest Hiker",
        slug: "the-forest-hiker",
        summary: "Exciting tour in the forest",
        imageCover: "tour-1-cover.jpg",
        price: 497,
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: "cs_test_123",
      } as any);

      await request(app)
        .get(`/api/v1/bookings/checkout-session/${tourId}`)
        .expect(200);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: "usd",
                unit_amount: 49700,
                product_data: expect.objectContaining({
                  name: "The Forest Hiker Tour",
                  description: "Exciting tour in the forest",
                }),
              }),
              quantity: 1,
            }),
          ]),
        }),
      );
    });

    it("should return 500 if tour not found", async () => {
      const tourId = "507f1f77bcf86cd799439011";
      mockTourModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/bookings/checkout-session/${tourId}`)
        .expect(500);

      expect(response.body.status).toBe("error");
    });

    it("should require authentication", async () => {
      mockAuthController.protect.mockImplementationOnce(
        (req: any, res: any) => {
          res.status(401).json({
            status: "fail",
            message: "You are not logged in!",
          });
        },
      );

      await request(app)
        .get("/api/v1/bookings/checkout-session/507f1f77bcf86cd799439011")
        .expect(401);
    });

    it("should handle Stripe API errors", async () => {
      const tourId = "507f1f77bcf86cd799439011";
      const mockTour = {
        _id: tourId,
        name: "The Forest Hiker",
        slug: "the-forest-hiker",
        summary: "Exciting tour in the forest",
        imageCover: "tour-1-cover.jpg",
        price: 497,
      };

      mockTourModel.findById.mockResolvedValue(mockTour as any);
      mockCheckoutSessionsCreate.mockRejectedValue(
        new Error("Stripe API error"),
      );

      const response = await request(app)
        .get(`/api/v1/bookings/checkout-session/${tourId}`)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Stripe API error");
    });
  });

  describe("GET /api/v1/bookings", () => {
    it("should get all bookings for admin", async () => {
      const mockBookings = [
        {
          _id: "booking1",
          tour: "tour1",
          user: "user1",
          price: 497,
          createdAt: new Date(),
        },
        {
          _id: "booking2",
          tour: "tour2",
          user: "user2",
          price: 997,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockBookings),
      };

      mockBookingModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/bookings").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/v1/bookings", () => {
    it("should create a booking manually for admin", async () => {
      const bookingData = {
        tour: "507f1f77bcf86cd799439011",
        user: "507f1f77bcf86cd799439012",
        price: 497,
      };

      const mockBooking = {
        _id: "booking123",
        ...bookingData,
        createdAt: new Date(),
        paid: true,
      };

      mockBookingModel.create.mockResolvedValue(mockBooking as any);

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toBe(bookingData.tour);
      expect(response.body.data.user).toBe(bookingData.user);
      expect(response.body.data.price).toBe(bookingData.price);
    });
  });

  describe("GET /api/v1/bookings/:id", () => {
    it("should get a single booking by id", async () => {
      const bookingId = "booking123";
      const mockBooking = {
        _id: bookingId,
        tour: "tour1",
        user: "user1",
        price: 497,
        createdAt: new Date(),
      };

      mockBookingModel.findById.mockResolvedValue(mockBooking as any);

      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data._id).toBe(bookingId);
    });

    it("should return 404 if booking not found", async () => {
      mockBookingModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/bookings/nonexistent123")
        .expect(404);

      expect(response.body.status).toBe("fail");
    });
  });

  describe("PATCH /api/v1/bookings/:id", () => {
    it("should update a booking", async () => {
      const bookingId = "booking123";
      const updateData = { price: 597 };
      const mockUpdatedBooking = {
        _id: bookingId,
        tour: "tour1",
        user: "user1",
        price: 597,
        createdAt: new Date(),
      };

      mockBookingModel.findByIdAndUpdate.mockResolvedValue(
        mockUpdatedBooking as any,
      );

      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.price).toBe(597);
    });
  });

  describe("DELETE /api/v1/bookings/:id", () => {
    it("should delete a booking", async () => {
      const bookingId = "booking123";
      mockBookingModel.findByIdAndDelete.mockResolvedValue({} as any);

      await request(app).delete(`/api/v1/bookings/${bookingId}`).expect(204);

      expect(mockBookingModel.findByIdAndDelete).toHaveBeenCalledWith(
        bookingId,
      );
    });
  });
});
