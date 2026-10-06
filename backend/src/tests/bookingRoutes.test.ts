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

import { createServer } from "../server";

const tourId = "507f1f77bcf86cd799439011";
const selectedDate = "2030-06-01T09:00:00.000Z";
const bookableTour = () => ({
  _id: tourId,
  name: "The Forest Hiker",
  slug: "the-forest-hiker",
  summary: "Exciting tour in the forest",
  imageCover: "tour-1-cover.jpg",
  price: 497,
  maxGroupSize: 10,
  startDates: [{ date: selectedDate, participants: 2, soldOut: false }],
});

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

  describe("POST /api/v1/bookings/checkout-session/:tourId", () => {
    const checkout = (body: object = { selectedDate }) =>
      request(app)
        .post(`/api/v1/bookings/checkout-session/${tourId}`)
        .send(body);

    it("should create a checkout session successfully", async () => {
      const mockSession = {
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      };

      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockResolvedValue(mockSession);

      const response = await checkout().expect(200);

      expect(mockTourModel.findById).toHaveBeenCalledWith(tourId);
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ["card"],
          customer_email: "test@example.com",
          client_reference_id: tourId,
          metadata: { selectedDate, userId: "user123", guests: "1" },
        }),
      );
      expect(response.body.status).toBe("success");
      expect(response.body.session.id).toBe("cs_test_123");
    });

    it("should send Stripe back to the frontend pages", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockResolvedValue({ id: "cs_test_123" });

      await checkout().expect(200);

      // cancel_url is by id, not slug: the tour page does a findById.
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url:
            "http://localhost:5173/myaccount/my-bookings?alert=booking",
          cancel_url: `http://localhost:5173/tour/${tourId}`,
        }),
      );
    });

    it("records the buyer in the session metadata", async () => {
      // A later webhook cannot trust a request body, so the user it books for
      // has to travel inside the Stripe session itself.
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockResolvedValue({ id: "cs_test_123" });

      await checkout().expect(200);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: "user123" }),
        }),
      );
    });

    it("should include correct line items with tour details", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockResolvedValue({ id: "cs_test_123" });

      await checkout().expect(200);

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: 49700,
                product_data: {
                  name: "The Forest Hiker Tour",
                  description: "Exciting tour in the forest",
                  images: ["http://localhost:5173/img/tours/tour-1-cover.jpg"],
                },
              },
              quantity: 1,
            },
            {
              price_data: {
                currency: "usd",
                unit_amount: 4500,
                product_data: { name: "Service fee" },
              },
              quantity: 1,
            },
          ],
        }),
      );
    });

    it("charges the tour and the service fee once per guest", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockResolvedValue({ id: "cs_test_123" });

      await checkout({ selectedDate, guests: 3 }).expect(200);

      const { line_items, metadata } =
        mockCheckoutSessionsCreate.mock.calls[0][0];
      expect(line_items[0].price_data.unit_amount).toBe(49700);
      expect(line_items[0].quantity).toBe(3);
      expect(line_items[1].price_data.unit_amount).toBe(4500);
      expect(line_items[1].quantity).toBe(3);
      expect(metadata.guests).toBe("3");
    });

    it("should return 400 for a guest count that is not a whole number of at least 1", async () => {
      await checkout({ selectedDate, guests: 0 }).expect(400);
      const response = await checkout({ selectedDate, guests: 2.5 }).expect(
        400,
      );

      expect(response.body.message).toBe(
        "Guests must be a whole number of at least 1.",
      );
      expect(mockTourModel.findById).not.toHaveBeenCalled();
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when there are not enough places left", async () => {
      // maxGroupSize 10, participants 2: 8 places left.
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);

      const response = await checkout({ selectedDate, guests: 9 }).expect(400);

      expect(response.body.message).toBe(
        "Only 8 places are left on this date.",
      );
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when no date is selected", async () => {
      const response = await checkout({}).expect(400);

      expect(response.body.message).toBe("Please select a tour date");
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when the selected date is not offered", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);

      const response = await checkout({
        selectedDate: "2031-01-01T09:00:00.000Z",
      }).expect(400);

      expect(response.body.message).toBe(
        "Selected date is not available for this tour",
      );
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    });

    it("should return 400 when the selected date is sold out", async () => {
      const tour = bookableTour();
      tour.startDates[0].soldOut = true;
      mockTourModel.findById.mockResolvedValue(tour as any);

      const response = await checkout().expect(400);

      expect(response.body.message).toBe("This tour date is sold out");
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
    });

    it("should return 404 if tour not found", async () => {
      mockTourModel.findById.mockResolvedValue(null);

      const response = await checkout().expect(404);

      expect(response.body.message).toBe("No tour found with that ID");
      expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
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

      await checkout().expect(401);
    });

    it("should handle Stripe API errors", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockCheckoutSessionsCreate.mockRejectedValue(
        new Error("Stripe API error"),
      );

      const response = await checkout().expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Stripe API error");
    });
  });

  describe("GET /api/v1/bookings", () => {
    it("should get all bookings for admin", async () => {
      const mockBookings = [
        { _id: "booking1", tour: "tour1", user: "user1", price: 497 },
        { _id: "booking2", tour: "tour2", user: "user2", price: 997 },
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
    const bookingData = {
      tour: tourId,
      user: "507f1f77bcf86cd799439012",
      price: 497,
      selectedDate,
    };

    it("should create a booking manually for admin", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockTourModel.findOneAndUpdate.mockResolvedValue(bookableTour() as any);
      mockBookingModel.create.mockResolvedValue({
        _id: "booking123",
        ...bookingData,
        paid: true,
      } as any);

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(201);

      // The seat is taken on the tour before the booking is written.
      expect(mockTourModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: tourId }),
        expect.objectContaining({ $inc: { "startDates.$.participants": 1 } }),
        expect.anything(),
      );
      expect(mockBookingModel.create).toHaveBeenCalledWith({
        tour: tourId,
        user: bookingData.user,
        price: 497,
        selectedDate: new Date(selectedDate),
      });
      expect(response.body.status).toBe("success");
      expect(response.body.data.tour).toBe(tourId);
      expect(response.body.data.user).toBe(bookingData.user);
      expect(response.body.data.price).toBe(497);
    });

    it("marks the date sold out when the last seat is taken", async () => {
      const tour = bookableTour();
      tour.startDates[0].participants = 9;
      mockTourModel.findById.mockResolvedValue(tour as any);
      mockTourModel.findOneAndUpdate.mockResolvedValue(tour as any);
      mockBookingModel.create.mockResolvedValue({ _id: "booking123" } as any);

      await request(app).post("/api/v1/bookings").send(bookingData).expect(201);

      expect(mockTourModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { "startDates.$.soldOut": true } }),
        expect.anything(),
      );
    });

    it("should return 400 when no date is selected", async () => {
      const response = await request(app)
        .post("/api/v1/bookings")
        .send({ tour: tourId, user: bookingData.user, price: 497 })
        .expect(400);

      expect(response.body.message).toBe("Please select a tour date");
      expect(mockBookingModel.create).not.toHaveBeenCalled();
    });

    it("should return 404 when the tour does not exist", async () => {
      mockTourModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(404);

      expect(response.body.message).toBe("No tour found with that ID");
      expect(mockBookingModel.create).not.toHaveBeenCalled();
    });

    it("should return 400 when the selected date is sold out", async () => {
      const tour = bookableTour();
      tour.startDates[0].soldOut = true;
      mockTourModel.findById.mockResolvedValue(tour as any);

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe("This tour date is sold out");
      expect(mockTourModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockBookingModel.create).not.toHaveBeenCalled();
    });

    it("should return 400 when the seat cannot be taken", async () => {
      mockTourModel.findById.mockResolvedValue(bookableTour() as any);
      mockTourModel.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/bookings")
        .send(bookingData)
        .expect(400);

      expect(response.body.message).toBe(
        "Unable to book tour, please try again",
      );
      expect(mockBookingModel.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/bookings/:id", () => {
    it("should get a single booking by id", async () => {
      const bookingId = "booking123";
      mockBookingModel.findById.mockResolvedValue({
        _id: bookingId,
        tour: "tour1",
        user: "user1",
        price: 497,
      } as any);

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
      mockBookingModel.findByIdAndUpdate.mockResolvedValue({
        _id: bookingId,
        price: 597,
      } as any);

      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}`)
        .send({ price: 597 })
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
