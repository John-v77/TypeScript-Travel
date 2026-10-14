import request from "supertest";
import { createServer } from "../server";
import { FavoriteModel } from "../models/favoriteModel";
import authController from "../controllers/authController";
import { createMockQuery } from "./tourRoutes/testHelpers";

jest.mock("../models/favoriteModel");
jest.mock("../controllers/authController", () => {
  const actual = jest.requireActual("../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, _res: any, next: any) => {
        req.user = { _id: "user123", id: "user123", role: "user" };
        next();
      }),
    },
  };
});

const mockFavoriteModel = FavoriteModel as jest.Mocked<typeof FavoriteModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

describe("Favourites - /api/v1/users/my-favorites", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists only the signed-in user's favourites", async () => {
    const favourites = [
      { _id: "fav1", tour: { id: "tour1" }, user: "user123" },
    ];
    mockFavoriteModel.find.mockReturnValue(createMockQuery(favourites) as any);

    const response = await request(app)
      .get("/api/v1/users/my-favorites")
      .expect(200);

    expect(mockFavoriteModel.find).toHaveBeenCalledWith({ user: "user123" });
    expect(response.body.data).toEqual(favourites);
  });

  it("saves a tour for the signed-in user, whoever the body names", async () => {
    mockFavoriteModel.create.mockImplementation(
      async (doc: any) => ({ _id: "fav1", ...doc }) as any,
    );

    await request(app)
      .post("/api/v1/users/my-favorites")
      .send({ tour: "tour1", user: "someoneElse" })
      .expect(201);

    expect(mockFavoriteModel.create).toHaveBeenCalledWith({
      tour: "tour1",
      user: "user123",
    });
  });

  it("removes the user's own favourite", async () => {
    mockFavoriteModel.findOne.mockResolvedValue({ _id: "fav1" } as any);
    mockFavoriteModel.findByIdAndDelete.mockResolvedValue({
      _id: "fav1",
    } as any);

    await request(app).delete("/api/v1/users/my-favorites/fav1").expect(204);

    expect(mockFavoriteModel.findOne).toHaveBeenCalledWith({
      _id: "fav1",
      user: "user123",
    });
    expect(mockFavoriteModel.findByIdAndDelete).toHaveBeenCalledWith("fav1");
  });

  it("returns 404 for someone else's favourite and deletes nothing", async () => {
    mockFavoriteModel.findOne.mockResolvedValue(null);

    await request(app).delete("/api/v1/users/my-favorites/fav2").expect(404);

    expect(mockFavoriteModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("requires a login", async () => {
    mockAuth.protect.mockImplementationOnce((_req: any, res: any) => {
      res.status(401).json({ status: "fail", message: "Not logged in" });
    });

    await request(app).get("/api/v1/users/my-favorites").expect(401);
    expect(mockFavoriteModel.find).not.toHaveBeenCalled();
  });
});
