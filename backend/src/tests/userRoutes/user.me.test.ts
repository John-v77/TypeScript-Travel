import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import authController from "../../controllers/authController";

jest.mock("../../models/userModel");
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, _res: any, next: any) => {
        req.user = { _id: "user1", id: "user1", role: "user" };
        next();
      }),
    },
  };
});

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

describe("GET /api/v1/users/me", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the signed-in user", async () => {
    mockUserModel.findById.mockResolvedValue({
      _id: "user1",
      name: "Laura Wilson",
    } as any);

    const response = await request(app).get("/api/v1/users/me").expect(200);

    expect(mockUserModel.findById).toHaveBeenCalledWith("user1");
    expect(response.body.data.name).toBe("Laura Wilson");
  });

  it("requires a login", async () => {
    mockAuth.protect.mockImplementationOnce((_req: any, res: any) => {
      res.status(401).json({ status: "fail", message: "Not logged in" });
    });

    await request(app).get("/api/v1/users/me").expect(401);
    expect(mockUserModel.findById).not.toHaveBeenCalled();
  });
});
