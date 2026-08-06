import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import Email from "../../utils/email/email";

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
jest.mock("../../utils/email/email");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockEmail = Email as jest.MockedClass<typeof Email>;

describe("POST /api/v1/users/forgotPassword - forgotPassword", () => {
  const app = createServer();
  const mockSendPasswordReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendPasswordReset.mockResolvedValue(undefined);
    mockEmail.mockImplementation(
      () =>
        ({
          sendWelcome: jest.fn().mockResolvedValue(undefined),
          sendPasswordReset: mockSendPasswordReset,
        }) as any
    );
  });

  it("should send password reset email successfully", async () => {
    const email = "user@example.com";
    const resetToken = "abcd1234resettoken";

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      name: "Test User",
      createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
      save: jest.fn().mockResolvedValue(true),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(200);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(mockEmail).toHaveBeenCalledWith(
      mockUser,
      expect.stringContaining(resetToken)
    );
    expect(mockSendPasswordReset).toHaveBeenCalled();
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Token sent to email!");
  });

  it("should return 404 for non-existent email", async () => {
    const email = "nonexistent@example.com";

    mockUserModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(404);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("There is no user with email address.");
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("should handle missing email field", async () => {
    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({})
      .expect(404);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("There is no user with email address.");
  });

  it("should handle email sending failure and cleanup reset token", async () => {
    const email = "user@example.com";
    const resetToken = "abcd1234resettoken";

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      name: "Test User",
      passwordResetToken: "hashed-token",
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
      save: jest.fn().mockResolvedValue(true),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);
    mockSendPasswordReset.mockRejectedValue(new Error("SMTP server error"));

    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(500);

    expect(mockUser.passwordResetToken).toBeUndefined();
    expect(mockUser.passwordResetExpires).toBeUndefined();
    expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe(
      "There was an error sending the email. Try again later!"
    );
  });

  it("should generate correct reset URL", async () => {
    const email = "user@example.com";
    const resetToken = "abcd1234resettoken";

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      name: "Test User",
      createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
      save: jest.fn().mockResolvedValue(true),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);

    await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(200);

    expect(mockEmail).toHaveBeenCalledWith(
      mockUser,
      expect.stringMatching(
        /http:\/\/127\.0\.0\.1:\d+\/api\/v1\/users\/resetPassword\/abcd1234resettoken/
      )
    );
  });

  it("should handle database errors when finding user", async () => {
    const email = "user@example.com";

    mockUserModel.findOne.mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Database connection failed");
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("should handle database errors when saving reset token", async () => {
    const email = "user@example.com";
    const resetToken = "abcd1234resettoken";

    const mockUser = {
      _id: "user123",
      email: "user@example.com",
      name: "Test User",
      createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
      save: jest.fn().mockRejectedValue(new Error("Database save failed")),
    } as any;

    mockUserModel.findOne.mockResolvedValue(mockUser);

    const response = await request(app)
      .post("/api/v1/users/forgotPassword")
      .send({ email })
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Database save failed");
    expect(mockEmail).not.toHaveBeenCalled();
  });
});
