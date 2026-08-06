import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import Email from "../../utils/email/email";
import { validSignup } from "./testHelpers";

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

describe("POST /api/v1/users/signup", () => {
  const app = createServer();
  const mockSendWelcome = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockEmail.mockImplementation(
      () =>
        ({
          sendWelcome: mockSendWelcome.mockResolvedValue(undefined),
          sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        }) as any
    );
  });

  it("should successfully signup a new user with valid data", async () => {
    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
      photo: undefined,
      // password should not be in response
      toJSON: () => ({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      }),
    };

    mockUserModel.create.mockResolvedValue(mockUser as any);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(validSignup);

    expect(response.status).toBe(201);

    expect(mockUserModel.create).toHaveBeenCalledWith({
      name: validSignup.name,
      email: validSignup.email,
      password: validSignup.password,
      passwordConfirm: validSignup.passwordConfirm,
    });

    expect(response.body.status).toBe("success");
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");
    expect(response.body.data.user).toEqual({
      _id: "user123",
      name: "John Doe",
      email: "john@example.com",
    });
  });

  it("should send JWT token via cookie with correct options", async () => {
    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
    };

    mockUserModel.create.mockResolvedValue(mockUser as any);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(validSignup);

    expect(response.status).toBe(201);

    // Check if JWT cookie is set
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const jwtCookie = cookieArray.find((cookie: string) =>
      cookie.startsWith("jwt=")
    );
    expect(jwtCookie).toBeDefined();

    // Check cookie options
    expect(jwtCookie).toContain("HttpOnly");
    expect(jwtCookie).toContain("Max-Age=");
  });

  it("should set secure cookie flag in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
    };

    mockUserModel.create.mockResolvedValue(mockUser as any);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(validSignup);

    expect(response.status).toBe(201);

    const cookies = response.headers["set-cookie"];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const jwtCookie = cookieArray.find((cookie: string) =>
      cookie.startsWith("jwt=")
    );
    expect(jwtCookie).toContain("Secure");

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should return 500 when user creation fails (validation or database error)", async () => {
    // signup has no bespoke error handling of its own: whatever
    // UserModel.create() rejects with (a Mongoose validation error, a
    // duplicate-key error, a connection failure, ...) reaches catchAsync
    // and the same generic 500 handler. One representative case covers
    // that whole path; the specific error message is incidental.
    mockUserModel.create.mockRejectedValue(
      new Error("Invalid input data. User name is required")
    );

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(validSignup)
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe(
      "Invalid input data. User name is required"
    );
  });

  it("should not return password or passwordConfirm in the response", async () => {
    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
      password: "hashedpassword",
      toJSON: () => ({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      }),
    };

    mockUserModel.create.mockResolvedValue(mockUser as any);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(validSignup)
      .expect(201);

    expect(response.body.data.user).not.toHaveProperty("password");
    expect(response.body.data.user).not.toHaveProperty("passwordConfirm");
  });

  it("should accept optional photo field", async () => {
    const userData = { ...validSignup, photo: "profile.jpg" };

    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      name: "John Doe",
      email: "john@example.com",
      photo: "profile.jpg",
      toJSON: () => ({
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        photo: "profile.jpg",
      }),
    };

    mockUserModel.create.mockResolvedValue(mockUser as any);

    const response = await request(app)
      .post("/api/v1/users/signup")
      .send(userData)
      .expect(201);

    expect(response.body.data.user.photo).toBe("profile.jpg");
  });
});
