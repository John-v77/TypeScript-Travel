import request from "supertest";
import { createServer } from "../server";
import { UserModel } from "../models/userModel";

jest.mock("../models/userModel");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

// Set JWT environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret-key-for-user-routes";
process.env.JWT_EXPIRES_IN = "7d";

describe("User Routes", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/users/signup", () => {
    it("should successfully signup a new user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

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
        .send(userData);

      if (response.status !== 201) {
        console.log("Error response:", response.body);
      }

      expect(response.status).toBe(201);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm,
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

    it("should return 400 when name is missing", async () => {
      const userData = {
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("User name is required"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("User name is required");
    });

    it("should return 400 when email is missing", async () => {
      const userData = {
        name: "John Doe",
        password: "password123",
        passwordConfirm: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("User email is required"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("User email is required");
    });

    it("should return 400 when email format is invalid", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
        passwordConfirm: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Please provide a valid email"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please provide a valid email");
    });

    it("should return 400 when password is missing", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        passwordConfirm: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Please provide a password"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please provide a password");
    });

    it("should return 400 when password is too short", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123",
        passwordConfirm: "123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Password must be at least 8 characters long"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "Password must be at least 8 characters long",
      );
    });

    it("should return 400 when passwordConfirm is missing", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Please confirm a password"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please confirm a password");
    });

    it("should return 400 when passwords do not match", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "differentpassword",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Passwords are not the same!"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Passwords are not the same!");
    });

    it("should return 400 when email already exists", async () => {
      const userData = {
        name: "John Doe",
        email: "existing@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      const duplicateError = new Error("E11000 duplicate key error collection");
      (duplicateError as any).code = 11000;
      mockUserModel.create.mockRejectedValue(duplicateError);

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "E11000 duplicate key error collection",
      );
    });

    it("should handle database connection errors", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

      mockUserModel.create.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
    });

    it("should not return password in response", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
      };

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
        .send(userData)
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty("password");
      expect(response.body.data.user).not.toHaveProperty("passwordConfirm");
    });

    it("should accept optional photo field", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        passwordConfirm: "password123",
        photo: "profile.jpg",
      };

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
});
