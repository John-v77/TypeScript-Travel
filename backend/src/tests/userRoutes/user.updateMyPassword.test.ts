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

describe("PATCH /api/v1/users/updateMyPassword - updatePassword", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { _id: "user123" };
        next();
      }
    );
  });

  it("should update password successfully with correct current password", async () => {
    const passwordData = {
      passwordCurrent: "currentPassword123",
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    // createSendToken deliberately clears user.password right before the
    // response is sent (so the hash never leaks in the JSON body), so we
    // capture the value at save() time, which is when it actually matters.
    let passwordAtSaveTime: string | undefined;

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      password: "hashedCurrentPassword",
      correctPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockImplementation(function (this: any) {
        passwordAtSaveTime = this.password;
        return Promise.resolve(true);
      }),
    } as any;

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    mockUserModel.findById.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .set(authHeader)
      .send(passwordData)
      .expect(200);

    // Verify the database query with password selection
    expect(mockUserModel.findById).toHaveBeenCalledWith("user123");
    expect(mockQuery.select).toHaveBeenCalledWith("+password");

    // Verify current password check
    expect(mockUser.correctPassword).toHaveBeenCalledWith(
      "currentPassword123",
      "hashedCurrentPassword"
    );

    // Verify new password was set (captured before createSendToken clears it)
    expect(passwordAtSaveTime).toBe("newPassword123");
    expect(mockUser.passwordConfirm).toBe("newPassword123");
    expect(mockUser.save).toHaveBeenCalled();

    // Verify response
    expect(response.body.status).toBe("success");
    expect(response.body.token).toBeDefined();
    expect(response.body.data.user._id).toBe(mockUser._id);
    expect(response.body.data.user.email).toBe(mockUser.email);
  });

  it("should return 401 for incorrect current password", async () => {
    const passwordData = {
      passwordCurrent: "wrongCurrentPassword",
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      password: "hashedCurrentPassword",
      correctPassword: jest.fn().mockResolvedValue(false),
    } as any;

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    mockUserModel.findById.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .set(authHeader)
      .send(passwordData)
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Your current password is wrong.");
    expect(mockUser.correctPassword).toHaveBeenCalledWith(
      "wrongCurrentPassword",
      "hashedCurrentPassword"
    );
  });

  it("should require authentication", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        res.status(401).json({
          status: "fail",
          message: "You are not logged in! Please log in to get access.",
        });
      }
    );

    const response = await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .send({
        passwordCurrent: "current123",
        password: "new123",
        passwordConfirm: "new123",
      })
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toContain("You are not logged in");
  });

  it("should return 500 when the update fails (validation or database error)", async () => {
    const passwordData = {
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    const mockUser = {
      _id: "user123",
      correctPassword: jest.fn().mockResolvedValue(true),
      save: jest
        .fn()
        .mockRejectedValue(new Error("Current password is required")),
    } as any;

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    mockUserModel.findById.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .set(authHeader)
      .send(passwordData)
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Current password is required");
  });

  it("should handle user not found error", async () => {
    const passwordData = {
      passwordCurrent: "currentPassword123",
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    const mockQuery = {
      select: jest.fn().mockResolvedValue(null),
    };
    mockUserModel.findById.mockReturnValue(mockQuery as any);

    const response = await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .set(authHeader)
      .send(passwordData)
      .expect(500);

    expect(response.body.status).toBe("error");
  });

  it("should call save() without validateBeforeSave option", async () => {
    const passwordData = {
      passwordCurrent: "currentPassword123",
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    const mockUser = {
      _id: "user123",
      password: "hashedCurrentPassword",
      correctPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    } as any;

    const mockQuery = {
      select: jest.fn().mockResolvedValue(mockUser),
    };
    mockUserModel.findById.mockReturnValue(mockQuery as any);

    await request(app)
      .patch("/api/v1/users/updateMyPassword")
      .set(authHeader)
      .send(passwordData)
      .expect(200);

    // Should call save without any options (default validation applies)
    expect(mockUser.save).toHaveBeenCalledWith();
  });
});
