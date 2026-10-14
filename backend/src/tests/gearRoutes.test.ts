import request from "supertest";
import { createServer } from "../server";
import { GearModel } from "../models/gearModel";
import authController from "../controllers/authController";
import { createMockQuery } from "./tourRoutes/testHelpers";

jest.mock("../models/gearModel");
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn(),
      // Built once when the routes load, so it does the real role check.
      restrictTo: jest.fn(
        (...roles: string[]) =>
          (req: any, res: any, next: any) => {
            if (roles.includes(req.user?.role)) return next();
            res.status(403).json({
              status: "fail",
              message: "You do not have permission to perform this action",
            });
          },
      ),
    },
  };
});

const mockGearModel = GearModel as jest.Mocked<typeof GearModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

const signInAs = (role: string) => {
  mockAuth.protect.mockImplementation((req: any, _res: any, next: any) => {
    req.user = { _id: "u1", id: "u1", role };
    next();
  });
};

const jacket = {
  _id: "6aa04b5bd2461a771da34641",
  name: "Alpine Blue Jacket",
  slug: "alpine-blue-jacket",
  price: 199.99,
  image: "/img/gear/jacket-blue.avif",
  description: "Waterproof jacket.",
  category: "jacket",
};

describe("Gear catalogue - /api/v1/gear", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    // Any protected call without a role set would be a test bug.
    mockAuth.protect.mockImplementation((_req: any, res: any) => {
      res.status(401).json({ status: "fail", message: "Not logged in" });
    });
  });

  describe("public reads", () => {
    it("lists the catalogue without a login", async () => {
      mockGearModel.find.mockReturnValue(createMockQuery([jacket]) as any);

      const response = await request(app).get("/api/v1/gear").expect(200);

      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: [jacket],
      });
      expect(mockAuth.protect).not.toHaveBeenCalled();
    });

    it("filters by category from the query string", async () => {
      const query = createMockQuery([jacket]);
      mockGearModel.find.mockReturnValue(query as any);

      await request(app).get("/api/v1/gear?category=jacket").expect(200);

      expect(query.where).toHaveBeenCalledWith({ category: "jacket" });
    });

    it("reads one item by id without a login", async () => {
      mockGearModel.findById.mockResolvedValue(jacket as any);

      const response = await request(app)
        .get("/api/v1/gear/6aa04b5bd2461a771da34641")
        .expect(200);

      expect(mockGearModel.findById).toHaveBeenCalledWith(
        "6aa04b5bd2461a771da34641",
      );
      expect(mockGearModel.findOne).not.toHaveBeenCalled();
      expect(response.body.data).toEqual(jacket);
    });

    // A 24-character hex value is an id; anything else is a slug.
    it("reads one item by its slug without a login", async () => {
      mockGearModel.findOne.mockResolvedValue(jacket as any);

      const response = await request(app)
        .get("/api/v1/gear/alpine-blue-jacket")
        .expect(200);

      expect(mockGearModel.findOne).toHaveBeenCalledWith({
        slug: "alpine-blue-jacket",
      });
      expect(mockGearModel.findById).not.toHaveBeenCalled();
      expect(response.body.data).toEqual(jacket);
    });

    it("returns 404 for an item that does not exist", async () => {
      mockGearModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/v1/gear/no-such-item")
        .expect(404);

      expect(response.body.message).toBe("No gear found with that ID or slug");
    });

    it("looks up an operator in the slug only as a plain string", async () => {
      mockGearModel.findOne.mockResolvedValue(null);

      await request(app).get('/api/v1/gear/{"$ne":null}').expect(404);

      expect(mockGearModel.findOne).toHaveBeenCalledWith({
        slug: '{"$ne":null}',
      });
    });
  });

  describe("admin writes", () => {
    it("lets an admin create, update and delete gear", async () => {
      signInAs("admin");
      mockGearModel.create.mockResolvedValue(jacket as any);
      mockGearModel.findByIdAndUpdate.mockResolvedValue({
        ...jacket,
        price: 179,
      } as any);
      mockGearModel.findByIdAndDelete.mockResolvedValue(jacket as any);

      await request(app).post("/api/v1/gear").send(jacket).expect(201);
      const updated = await request(app)
        .patch("/api/v1/gear/gear1")
        .send({ price: 179 })
        .expect(200);
      await request(app).delete("/api/v1/gear/gear1").expect(204);

      expect(updated.body.data.price).toBe(179);
      expect(mockGearModel.findByIdAndDelete).toHaveBeenCalledWith("gear1");
    });

    it("forbids a regular user from changing the catalogue", async () => {
      signInAs("user");

      await request(app).post("/api/v1/gear").send(jacket).expect(403);
      await request(app)
        .patch("/api/v1/gear/gear1")
        .send({ price: 1 })
        .expect(403);
      await request(app).delete("/api/v1/gear/gear1").expect(403);

      expect(mockGearModel.create).not.toHaveBeenCalled();
      expect(mockGearModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockGearModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("requires a login to change the catalogue", async () => {
      await request(app).post("/api/v1/gear").send(jacket).expect(401);
      expect(mockGearModel.create).not.toHaveBeenCalled();
    });
  });
});
