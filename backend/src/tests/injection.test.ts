import request from "supertest";
import { createServer } from "../server";
import { UserModel } from "../models/userModel";
import { TourModel } from "../models/tourModel";
import { CartItemModel } from "../models/cartItemModel";
import { GearModel } from "../models/gearModel";
import { GearOrderModel } from "../models/gearOrderModel";
import { createMockQuery } from "./tourRoutes/testHelpers";

jest.mock("../models/userModel");
jest.mock("../models/tourModel");
jest.mock("../models/cartItemModel");
jest.mock("../models/gearModel");
jest.mock("../models/gearOrderModel");
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: "cs_1", url: "https://x" }),
      },
    },
  })),
);
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
          email: "a@b.com",
          role: "user",
        };
        next();
      }),
    },
  };
});

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;
const mockCartItemModel = CartItemModel as jest.Mocked<typeof CartItemModel>;
const mockGearModel = GearModel as jest.Mocked<typeof GearModel>;
const mockGearOrderModel = GearOrderModel as jest.Mocked<typeof GearOrderModel>;


const operatorKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(operatorKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, inner]) => [
    ...(key.startsWith("$") ? [key] : []),
    ...operatorKeys(inner),
  ]);
};

const argsOf = (fn: jest.Mock | ((...a: any[]) => any)) =>
  (fn as jest.Mock).mock.calls.flat();

describe("NoSQL injection", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);
    mockTourModel.find.mockReturnValue(createMockQuery([]) as any);
    mockTourModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    } as any);
    mockCartItemModel.create.mockImplementation(
      async (doc: any) => ({ _id: "line1", ...doc }) as any,
    );
    mockGearModel.find.mockResolvedValue([] as any);
    mockGearOrderModel.create.mockResolvedValue({ _id: "order1" } as any);
  });

  describe("login", () => {
    it.each([
      ["$gt on the email", { email: { $gt: "" }, password: "anything" }],
      ["$ne on the email", { email: { $ne: null }, password: "anything" }],
      ["$regex on the email", { email: { $regex: ".*" }, password: "x" }],
      [
        "$where on the email",
        { email: { $where: "sleep(5000)" }, password: "x" },
      ],
    ])("cannot log in with %s", async (_label, body) => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send(body);

      expect(response.status).toBe(401);
      expect(operatorKeys(argsOf(mockUserModel.findOne))).toEqual([]);
    });

    it("treats an operator written as a string as a plain string", async () => {
      await request(app)
        .post("/api/v1/users/login")
        .send({ email: '{"$gt":""}', password: "x" });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: '{"$gt":""}',
      });
    });
  });

  describe("query strings", () => {
    it.each([
      ["$where", "/api/v1/tours?price[$where]=sleep(5000)"],
      ["$regex", "/api/v1/tours?difficulty[$regex]=.*"],
      ["$ne", "/api/v1/tours?name[$ne]=nothing"],
      ["$expr", "/api/v1/tours?$expr[$gt][0]=1"],
    ])("strips %s from tour filters", async (_label, url) => {
      const query = createMockQuery([]);
      mockTourModel.find.mockReturnValue(query as any);

      const response = await request(app).get(url);

      expect(response.status).toBe(200);
      expect(operatorKeys(argsOf(mockTourModel.find))).toEqual([]);
      expect(operatorKeys(argsOf(query.where))).toEqual([]);
    });


    it("still allows the API's own price[gte] filter", async () => {
      const query = createMockQuery([]);
      mockTourModel.find.mockReturnValue(query as any);

      await request(app).get("/api/v1/tours?price[gte]=500").expect(200);

      expect(query.where).toHaveBeenCalledWith({ price: { $gte: "500" } });
    });
  });

  describe("route parameters", () => {
    // Not a 24-character id, so it is looked up as a slug - as plain text.
    it("passes an operator in the id or slug through only as a plain string", async () => {
      mockTourModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await request(app).get('/api/v1/tours/{"$gt":""}').expect(404);

      expect(mockTourModel.findOne).toHaveBeenCalledWith({ slug: '{"$gt":""}' });
    });
  });

  describe("request bodies", () => {
    it("strips operators from a new cart line", async () => {
      await request(app)
        .post("/api/v1/cart")
        .send({ gear: { $ne: null }, quantity: { $gt: 0 } });

      expect(operatorKeys(argsOf(mockCartItemModel.create))).toEqual([]);
    });

    it("strips operators from gear checkout item ids", async () => {
      await request(app)
        .post("/api/v1/gear/checkout-session")
        .send({ items: [{ id: { $ne: null }, quantity: 1 }] });

      expect(operatorKeys(argsOf(mockGearModel.find))).toEqual([
        // The controller's own `$in`, around ids that carry no operators.
        "$in",
      ]);
    });

    it("strips dotted keys, which Mongo reads as nested paths", async () => {
      await request(app)
        .post("/api/v1/cart")
        .send({ gear: "g1", "quantity.$gt": 0 });

      const created = argsOf(mockCartItemModel.create);
      expect(JSON.stringify(created)).not.toContain("$gt");
    });
  });

  describe("prototype pollution", () => {
    it("cannot add properties to every object through __proto__", async () => {
      await request(app)
        .post("/api/v1/users/login")
        .set("Content-Type", "application/json")
        .send('{"email":"a@b.com","password":"x","__proto__":{"isAdmin":true}}');

      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });

    it("cannot reach Object.prototype through constructor.prototype", async () => {
      await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "a@b.com",
          password: "x",
          constructor: { prototype: { isAdmin: true } },
        });

      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });
  });
});
