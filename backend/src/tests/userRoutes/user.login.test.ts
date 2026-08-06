import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import { validLogin } from "./testHelpers";

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

describe("POST /api/v1/users/login", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should login successfully with valid credentials", async () => {
    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      email: "john@example.com",
      correctPassword: jest.fn().mockResolvedValue(true),
    };

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const response = await request(app)
      .post("/api/v1/users/login")
      .send(validLogin)
      .expect(200);

    expect(response.body.status).toBe("success");
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");
    expect(mockUserModel.findOne).toHaveBeenCalledWith({
      email: validLogin.email,
    });
  });

  it("should return 400 when email is missing", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({
        password: "password123",
      })
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Please provide email and password!");
  });

  it("should return 400 when password is missing", async () => {
    const response = await request(app)
      .post("/api/v1/users/login")
      .send({ email: "john@example.com" })
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Please provide email and password!");
  });

  it("should return 401 when user does not exist", async () => {
    const userData = {
      email: "nonexistent@example.com",
      password: "password123",
    };

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);

    const response = await request(app)
      .post("/api/v1/users/login")
      .send(userData)
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Incorrect email or password");
  });

  it("should return 401 when password is incorrect", async () => {
    const userData = {
      email: "john@example.com",
      password: "wrongpassword",
    };

    const mockUser = {
      _id: {
        toString: () => "user123",
      },
      email: "john@example.com",
      correctPassword: jest.fn().mockResolvedValue(false),
    };

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const response = await request(app)
      .post("/api/v1/users/login")
      .send(userData)
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Incorrect email or password");
    expect(mockUser.correctPassword).toHaveBeenCalledWith(
      "wrongpassword",
      undefined
    );
  });
});
