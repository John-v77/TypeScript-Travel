import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import authController from "../../controllers/authController";
import { createMockFindQuery } from "./testHelpers";

jest.mock("../../models/userModel");
// protect sets whoever the test signs in as; restrictTo does the real role
// check (it is built once, when the routes load).
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController").default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn(),
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

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuth = authController as jest.Mocked<typeof authController>;

const signInAs = (role: string) => {
  mockAuth.protect.mockImplementation((req: any, _res: any, next: any) => {
    req.user = { _id: "admin1", id: "admin1", role };
    next();
  });
};

const target = { _id: "user2", name: "Max Smith", email: "max@example.com" };

describe("Admin user management", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    signInAs("admin");
  });

  it("lists every user", async () => {
    mockUserModel.find.mockReturnValue(createMockFindQuery([target]) as any);

    const response = await request(app).get("/api/v1/users").expect(200);

    expect(response.body.results).toBe(1);
  });

  it("creates a user", async () => {
    mockUserModel.create.mockResolvedValue(target as any);

    await request(app)
      .post("/api/v1/users")
      .send({ name: "Max Smith", email: "max@example.com" })
      .expect(201);
  });

  it("reads one user by id", async () => {
    mockUserModel.findById.mockResolvedValue(target as any);

    const response = await request(app).get("/api/v1/users/user2").expect(200);

    expect(mockUserModel.findById).toHaveBeenCalledWith("user2");
    expect(response.body.data.name).toBe("Max Smith");
  });

  // There is no admin update route; users change their own details
  // through /updateMe.
  it("has no route for an admin to update another user", async () => {
    await request(app)
      .patch("/api/v1/users/user2")
      .send({ role: "admin" })
      .expect(404);

    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  // Regression: this used to deactivate req.user.id - the admin's own account.
  it("deletes the user in the URL, not the admin", async () => {
    mockUserModel.findByIdAndDelete.mockResolvedValue(target as any);

    await request(app).delete("/api/v1/users/user2").expect(204);

    expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith("user2");
    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("is forbidden to a regular user", async () => {
    signInAs("user");

    await request(app).get("/api/v1/users").expect(403);
    await request(app).delete("/api/v1/users/user2").expect(403);

    expect(mockUserModel.findByIdAndDelete).not.toHaveBeenCalled();
  });
});
