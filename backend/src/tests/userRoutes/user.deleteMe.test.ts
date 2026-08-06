import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import authController from "../../controllers/authController";
import { authHeader } from "./testHelpers";

jest.mock("../../models/userModel");
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController");
  return {
    __esModule: true,
    default: {
      ...actual.default,
      protect: jest.fn((req: any, res: any, next: any) => next()),
      restrictTo: jest.fn(() => (req: any, res: any, next: any) => next()),
    },
  };
});

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;

describe("DELETE /api/v1/users/deleteMe - deleteUser", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the protect middleware to add user to request
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123" };
        next();
      }
    );
  });

  it("should deactivate user successfully", async () => {
    const mockUser = {
      _id: "user123",
      active: false,
    };

    mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set(authHeader)
      .expect(204);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
      active: false,
    });
    expect(response.body).toEqual({});
  });

  it("should require authentication", async () => {
    // Mock protect to reject authentication
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        res.status(401).json({
          status: "fail",
          message: "You are not logged in! Please log in to get access.",
        });
      }
    );

    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toContain("You are not logged in");
  });

  it("should handle database errors gracefully", async () => {
    mockUserModel.findByIdAndUpdate.mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set(authHeader)
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Database connection failed");
  });

  it("should handle user not found", async () => {
    mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set(authHeader)
      .expect(204);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
      active: false,
    });
  });
});
