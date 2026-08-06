import request from "supertest";
import crypto from "crypto";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import "./testHelpers"; // sets JWT_SECRET etc. before createSendToken signs a token

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

describe("PATCH /api/v1/users/resetPassword/:token - resetPassword", () => {
  const app = createServer();
  const validToken = "validresettoken123";
  const hashedToken = crypto
    .createHash("sha256")
    .update(validToken)
    .digest("hex");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset password successfully with valid token", async () => {
    const resetData = {
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
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      password: "oldHashedPassword",
      passwordConfirm: undefined,
      save: jest.fn().mockImplementation(function (this: any) {
        passwordAtSaveTime = this.password;
        return Promise.resolve(true);
      }),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .patch(`/api/v1/users/resetPassword/${validToken}`)
      .send(resetData)
      .expect(200);

    // Verify the database query
    expect(mockUserModel.findOne).toHaveBeenCalledWith({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: expect.any(Number) },
    });

    // Verify password was set (captured before createSendToken clears it)
    // and reset fields were cleared
    expect(passwordAtSaveTime).toBe("newPassword123");
    expect(mockUser.passwordConfirm).toBe("newPassword123");
    expect(mockUser.passwordResetToken).toBeUndefined();
    expect(mockUser.passwordResetExpires).toBeUndefined();
    expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

    // Verify response
    expect(response.body.status).toBe("success");
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");
  });

  it("should return 400 when the token is invalid or expired", async () => {
    // The controller looks up the user by hashed token AND a
    // passwordResetExpires > now filter in one query, so an invalid
    // token and an expired one are indistinguishable here: both just
    // mean findOne() returns null.
    const resetData = {
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    mockUserModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/v1/users/resetPassword/invalidtoken`)
      .send(resetData)
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Token is invalid or has expired");
  });

  it("should return 500 when the reset fails (validation or database error)", async () => {
    const resetData = {
      passwordConfirm: "newPassword123",
    };

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      password: undefined,
      passwordConfirm: undefined,
      save: jest
        .fn()
        .mockRejectedValue(new Error("Please provide a password")),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .patch(`/api/v1/users/resetPassword/${validToken}`)
      .send(resetData)
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Please provide a password");
  });
});
