import request from "supertest";
import { createServer } from "../server";
import { CartItemModel } from "../models/cartItemModel";
import authController from "../controllers/authController";
import { createMockQuery } from "./tourRoutes/testHelpers";


jest.mock("../models/cartItemModel");
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, _res: any, next: any) => {
        req.user = { _id: "user123", id: "user123" };
        next();
      }),
    },
  };
});

const mockCartItemModel = CartItemModel as jest.Mocked<typeof CartItemModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

const gearId = "68d2f1a4c3b2a10012ab0001";
const itemId = "68d2f1a4c3b2a10012ab0099";

describe("GET /api/v1/cart", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns only the signed-in user's cart lines", async () => {
    const lines = [{ _id: itemId, user: "user123", gear: gearId, quantity: 2 }];
    mockCartItemModel.find.mockReturnValue(createMockQuery(lines) as any);

    const response = await request(app).get("/api/v1/cart").expect(200);

    expect(mockCartItemModel.find).toHaveBeenCalledWith({ user: "user123" });
    expect(response.body).toEqual({
      status: "success",
      results: 1,
      data: lines,
    });
  });

  it("returns an empty list when the cart is empty", async () => {
    mockCartItemModel.find.mockReturnValue(createMockQuery([]) as any);

    const response = await request(app).get("/api/v1/cart").expect(200);

    expect(response.body.results).toBe(0);
    expect(response.body.data).toEqual([]);
  });
});

describe("POST /api/v1/cart", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartItemModel.create.mockImplementation(
      async (doc: any) => ({ _id: itemId, ...doc }) as any,
    );
  });

  it("adds a line for the signed-in user", async () => {
    const response = await request(app)
      .post("/api/v1/cart")
      .send({ gear: gearId, quantity: 2 })
      .expect(201);

    expect(mockCartItemModel.create).toHaveBeenCalledWith({
      gear: gearId,
      quantity: 2,
      user: "user123",
    });
    expect(response.body.data.user).toBe("user123");
  });

  it("takes the owner from the token, never from the body", async () => {
    await request(app)
      .post("/api/v1/cart")
      .send({ gear: gearId, quantity: 1, user: "someoneElse" })
      .expect(201);

    expect(mockCartItemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ user: "user123" }),
    );
  });
});

describe("PATCH /api/v1/cart/:id", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartItemModel.exists.mockResolvedValue({ _id: itemId } as any);
    mockCartItemModel.findByIdAndUpdate.mockResolvedValue({
      _id: itemId,
      quantity: 3,
    } as any);
  });

  it("changes the quantity of the user's own line", async () => {
    const response = await request(app)
      .patch(`/api/v1/cart/${itemId}`)
      .send({ quantity: 3 })
      .expect(200);

    expect(mockCartItemModel.exists).toHaveBeenCalledWith({
      _id: itemId,
      user: "user123",
    });
    expect(response.body.data.quantity).toBe(3);
  });

  it("can only change the quantity - not the owner or the gear", async () => {
    await request(app)
      .patch(`/api/v1/cart/${itemId}`)
      .send({ quantity: 3, user: "someoneElse", gear: "otherGear" })
      .expect(200);

    expect(mockCartItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
      itemId,
      { quantity: 3 },
      { new: true, runValidators: true },
    );
  });

  it("returns 404 for a line that belongs to someone else", async () => {
    mockCartItemModel.exists.mockResolvedValue(null);

    await request(app)
      .patch(`/api/v1/cart/${itemId}`)
      .send({ quantity: 3 })
      .expect(404);

    expect(mockCartItemModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/cart/:id", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartItemModel.exists.mockResolvedValue({ _id: itemId } as any);
    mockCartItemModel.findByIdAndDelete.mockResolvedValue({
      _id: itemId,
    } as any);
  });

  it("removes the user's own line", async () => {
    await request(app).delete(`/api/v1/cart/${itemId}`).expect(204);

    expect(mockCartItemModel.findByIdAndDelete).toHaveBeenCalledWith(itemId);
  });

  it("returns 404 for a line that belongs to someone else", async () => {
    mockCartItemModel.exists.mockResolvedValue(null);

    await request(app).delete(`/api/v1/cart/${itemId}`).expect(404);

    expect(mockCartItemModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});

describe("cart authentication", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires a login on every cart route", async () => {
    const notLoggedIn = (_req: any, res: any) => {
      res.status(401).json({ status: "fail", message: "Not logged in" });
    };
    mockAuth.protect
      .mockImplementationOnce(notLoggedIn)
      .mockImplementationOnce(notLoggedIn)
      .mockImplementationOnce(notLoggedIn)
      .mockImplementationOnce(notLoggedIn);

    await request(app).get("/api/v1/cart").expect(401);
    await request(app).post("/api/v1/cart").send({}).expect(401);
    await request(app).patch(`/api/v1/cart/${itemId}`).send({}).expect(401);
    await request(app).delete(`/api/v1/cart/${itemId}`).expect(401);

    expect(mockCartItemModel.find).not.toHaveBeenCalled();
    expect(mockCartItemModel.create).not.toHaveBeenCalled();
  });
});
