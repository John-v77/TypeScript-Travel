import request from "supertest";
import { GearModel } from "../models/gearModel";
import { GearOrderModel } from "../models/gearOrderModel";
import authController from "../controllers/authController";
import { createMockQuery } from "./tourRoutes/testHelpers";

const mockSessionsCreate = jest.fn();
const mockSessionsRetrieve = jest.fn();

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
        retrieve: mockSessionsRetrieve,
      },
    },
  })),
);

jest.mock("../models/gearModel");
jest.mock("../models/gearOrderModel");

// authController's real export is `export default {...}`, so the override has
// to sit under `default` (with __esModule: true) - see tourRoutes.patch.test.
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, _res: any, next: any) => {
        req.user = {
          _id: "user123",
          id: "user123",
          email: "test@example.com",
          role: "user",
        };
        next();
      }),
      restrictTo: jest.fn((...roles: string[]) => {
        return (req: any, res: any, next: any) => {
          if (roles.includes(req.user?.role)) return next();
          res.status(403).json({
            status: "fail",
            message: "You do not have permission to perform this action",
          });
        };
      }),
    },
  };
});

process.env.STRIPE_SECRET_KEY = "sk_test_123";

import { createServer } from "../server";

const mockGearModel = GearModel as jest.Mocked<typeof GearModel>;
const mockGearOrderModel = GearOrderModel as jest.Mocked<typeof GearOrderModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

const jacket = {
  _id: "gear1",
  id: "gear1",
  name: "Alpine Blue Jacket",
  price: 199.99,
  image: "/img/gear/jacket-blue.avif",
};
const goggles = {
  _id: "gear2",
  id: "gear2",
  name: "Sunrise Yellow Goggles",
  price: 219,
  image: "/img/gear/googles-yellow.webp",
};

const signedInAs = (user: Record<string, string>) => {
  mockAuth.protect.mockImplementation((req: any, _res: any, next: any) => {
    req.user = user;
    next();
  });
};

const shopper = {
  _id: "user123",
  id: "user123",
  email: "test@example.com",
  role: "user",
};

describe("Gear checkout and orders", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    signedInAs(shopper);
  });

  describe("POST /api/v1/gear/checkout-session", () => {
    const checkout = (items: unknown) =>
      request(app).post("/api/v1/gear/checkout-session").send({ items });

    beforeEach(() => {
      mockGearModel.find.mockResolvedValue([jacket, goggles] as any);
      mockSessionsCreate.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });
      mockGearOrderModel.create.mockImplementation(
        async (doc: any) => ({ _id: "order1", ...doc }) as any,
      );
    });

    it("creates a Stripe session and an unpaid order for the cart", async () => {
      const response = await checkout([
        { id: "gear1", quantity: 2 },
        { id: "gear2", quantity: 1 },
      ]).expect(200);

      expect(mockGearOrderModel.create).toHaveBeenCalledWith({
        user: "user123",
        items: [
          {
            gear: "gear1",
            name: "Alpine Blue Jacket",
            price: 199.99,
            image: "/img/gear/jacket-blue.avif",
            quantity: 2,
          },
          {
            gear: "gear2",
            name: "Sunrise Yellow Goggles",
            price: 219,
            image: "/img/gear/googles-yellow.webp",
            quantity: 1,
          },
        ],
        totalPrice: 618.98,
        stripeSessionId: "cs_test_123",
        paid: false,
      });
      expect(response.body.status).toBe("success");
      expect(response.body.session.url).toBe(
        "https://checkout.stripe.com/pay/cs_test_123",
      );
    });

    it("charges the database price, never one sent by the client", async () => {
      mockGearModel.find.mockResolvedValue([jacket] as any);

      await checkout([{ id: "gear1", quantity: 1, price: 0.01 }]).expect(200);

      expect(mockSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ unit_amount: 19999 }),
            }),
          ],
        }),
      );
    });

    it("sends Stripe back to the frontend billing tab and the cart", async () => {
      mockGearModel.find.mockResolvedValue([jacket] as any);

      await checkout([{ id: "gear1", quantity: 1 }]).expect(200);

      expect(mockSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          customer_email: "test@example.com",
          success_url:
            "http://localhost:5173/myaccount/billing?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "http://localhost:5173/cart",
        }),
      );
    });

    it("builds line items with absolute image URLs", async () => {
      mockGearModel.find.mockResolvedValue([jacket] as any);

      await checkout([{ id: "gear1", quantity: 2 }]).expect(200);

      const { line_items } = mockSessionsCreate.mock.calls[0][0];
      expect(line_items[0]).toEqual({
        price_data: {
          currency: "usd",
          unit_amount: 19999,
          product_data: {
            name: "Alpine Blue Jacket",
            images: ["http://localhost:5173/img/gear/jacket-blue.avif"],
          },
        },
        quantity: 2,
      });
    });

    it("adds up the quantities of a gear id sent twice", async () => {
      mockGearModel.find.mockResolvedValue([jacket] as any);

      await checkout([
        { id: "gear1", quantity: 1 },
        { id: "gear1", quantity: 2 },
      ]).expect(200);

      const order = mockGearOrderModel.create.mock.calls[0][0] as any;
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(3);
    });

    it("returns 400 for an empty cart", async () => {
      const response = await checkout([]).expect(400);

      expect(response.body.message).toBe("Your cart is empty.");
      expect(mockSessionsCreate).not.toHaveBeenCalled();
    });

    it("returns 400 for an item without an id", async () => {
      const response = await checkout([{ quantity: 1 }]).expect(400);

      expect(response.body.message).toBe("Every cart item must have an id.");
    });

    it("returns 400 for a quantity that is not a whole number of at least 1", async () => {
      await checkout([{ id: "gear1", quantity: 0 }]).expect(400);
      await checkout([{ id: "gear1", quantity: 1.5 }]).expect(400);

      expect(mockGearModel.find).not.toHaveBeenCalled();
    });

    it("returns 404 naming gear that no longer exists", async () => {
      mockGearModel.find.mockResolvedValue([jacket] as any);

      const response = await checkout([
        { id: "gear1", quantity: 1 },
        { id: "gone", quantity: 1 },
      ]).expect(404);

      expect(response.body.message).toBe("No gear found with id(s): gone");
      expect(mockSessionsCreate).not.toHaveBeenCalled();
      expect(mockGearOrderModel.create).not.toHaveBeenCalled();
    });

    it("requires a login", async () => {
      mockAuth.protect.mockImplementationOnce((_req: any, res: any) => {
        res.status(401).json({ status: "fail", message: "Not logged in" });
      });

      await checkout([{ id: "gear1", quantity: 1 }]).expect(401);
    });
  });

  describe("POST /api/v1/gear/orders/confirm/:sessionId", () => {
    const confirm = () =>
      request(app).post("/api/v1/gear/orders/confirm/cs_test_123");

    const unpaidOrder = () => ({
      _id: "order1",
      user: { toString: () => "user123" },
      paid: false,
      paidAt: undefined as Date | undefined,
      save: jest.fn().mockResolvedValue(undefined),
    });

    it("marks the order paid once Stripe says it is", async () => {
      const order = unpaidOrder();
      mockGearOrderModel.findOne.mockResolvedValue(order as any);
      mockSessionsRetrieve.mockResolvedValue({ payment_status: "paid" });

      await confirm().expect(200);

      expect(mockGearOrderModel.findOne).toHaveBeenCalledWith({
        stripeSessionId: "cs_test_123",
      });
      expect(mockSessionsRetrieve).toHaveBeenCalledWith("cs_test_123");
      expect(order.paid).toBe(true);
      expect(order.paidAt).toBeInstanceOf(Date);
      expect(order.save).toHaveBeenCalled();
    });

    it("returns 402 while Stripe has not taken the payment", async () => {
      const order = unpaidOrder();
      mockGearOrderModel.findOne.mockResolvedValue(order as any);
      mockSessionsRetrieve.mockResolvedValue({ payment_status: "unpaid" });

      const response = await confirm().expect(402);

      expect(response.body.message).toBe(
        "This order has not been paid for yet.",
      );
      expect(order.save).not.toHaveBeenCalled();
    });

    it("is idempotent - an order already paid is returned unchanged", async () => {
      const order = { ...unpaidOrder(), paid: true };
      mockGearOrderModel.findOne.mockResolvedValue(order as any);

      await confirm().expect(200);

      expect(mockSessionsRetrieve).not.toHaveBeenCalled();
      expect(order.save).not.toHaveBeenCalled();
    });

    it("returns 404 when no order matches the session", async () => {
      mockGearOrderModel.findOne.mockResolvedValue(null);

      const response = await confirm().expect(404);

      expect(response.body.message).toBe("No order found for that session.");
    });

    it("returns 403 for another user's order", async () => {
      mockGearOrderModel.findOne.mockResolvedValue({
        ...unpaidOrder(),
        user: { toString: () => "someoneElse" },
      } as any);

      await confirm().expect(403);

      expect(mockSessionsRetrieve).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/gear/my-orders", () => {
    it("lists the user's paid orders, newest first", async () => {
      const orders = [{ _id: "order1", paid: true }];
      const sort = jest.fn().mockResolvedValue(orders);
      mockGearOrderModel.find.mockReturnValue({ sort } as any);

      const response = await request(app)
        .get("/api/v1/gear/my-orders")
        .expect(200);

      expect(mockGearOrderModel.find).toHaveBeenCalledWith({
        user: "user123",
        paid: true,
      });
      expect(sort).toHaveBeenCalledWith("-createdAt");
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: orders,
      });
    });

    it("is not read as a gear id", async () => {
      mockGearOrderModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as any);

      await request(app).get("/api/v1/gear/my-orders").expect(200);

      expect(mockGearModel.findById).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/gear/orders", () => {
    it("lists every order for an admin", async () => {
      signedInAs({ ...shopper, role: "admin" });
      const orders = [{ _id: "order1" }, { _id: "order2" }];
      mockGearOrderModel.find.mockReturnValue(createMockQuery(orders) as any);

      const response = await request(app)
        .get("/api/v1/gear/orders")
        .expect(200);

      expect(response.body.results).toBe(2);
      expect(mockGearModel.findById).not.toHaveBeenCalled();
    });

    it("is forbidden to everyone else", async () => {
      await request(app).get("/api/v1/gear/orders").expect(403);

      expect(mockGearOrderModel.find).not.toHaveBeenCalled();
    });
  });
});
