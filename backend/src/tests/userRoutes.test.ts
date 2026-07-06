import request from "supertest";
import { createServer } from "../server";
import { UserModel } from "../models/userModel";
import * as authController from "../controllers/authController";
import crypto from "crypto";
import sendEmail from "../utils/email";

jest.mock("../models/userModel");
jest.mock("../controllers/authController", () => ({
  ...jest.requireActual("../controllers/authController"),
  protect: jest.fn(),
}));
jest.mock("../utils/email");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

// Set JWT environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret-key-for-user-routes";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";

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

    it("should send JWT token via cookie with correct options", async () => {
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
      };

      mockUserModel.create.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData);

      expect(response.status).toBe(201);

      // Check if JWT cookie is set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const jwtCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith("jwt="),
      );
      expect(jwtCookie).toBeDefined();

      // Check cookie options
      expect(jwtCookie).toContain("HttpOnly");
      expect(jwtCookie).toContain("Max-Age=");
    });

    it("should set secure cookie flag in production", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

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
      };

      mockUserModel.create.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData);

      expect(response.status).toBe(201);

      const cookies = response.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const jwtCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith("jwt="),
      );
      expect(jwtCookie).toContain("Secure");

      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should not include password in response body when using cookies", async () => {
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
        password: "hashedPassword123",
      };

      mockUserModel.create.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .post("/api/v1/users/signup")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.password).toBeUndefined();
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

  describe("POST /api/v1/users/login", () => {
    it("should login successfully with valid credentials", async () => {
      const userData = {
        email: "john@example.com",
        password: "password123",
      };

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
        .send(userData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: userData.email,
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

    it("should return 400 when both email and password are missing", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({})
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
    });
  });

  describe("GET /api/v1/users - getAllUsers", () => {
    describe("Basic functionality", () => {
      it("should return all users successfully", async () => {
        const mockUsers = [
          {
            _id: "user1",
            name: "John Doe",
            email: "john@example.com",
            photo: "john.jpg",
          },
          {
            _id: "user2",
            name: "Jane Smith",
            email: "jane@example.com",
            photo: "jane.jpg",
          },
        ];

        // Mock the find method chain
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app).get("/api/v1/users").expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.results).toBe(2);
        expect(response.body.data.users).toHaveLength(2);
        expect(response.body.data.users[0].name).toBe("John Doe");
        expect(response.body.data.users[1].name).toBe("Jane Smith");
      });

      it("should return empty array when no users exist", async () => {
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app).get("/api/v1/users").expect(200);

        expect(response.body.status).toBe("success");
        expect(response.body.results).toBe(0);
        expect(response.body.data.users).toHaveLength(0);
      });

      it("should not return password fields", async () => {
        const mockUsers = [
          {
            _id: "user1",
            name: "John Doe",
            email: "john@example.com",
            photo: "john.jpg",
          },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app).get("/api/v1/users").expect(200);

        // Verify select was called to exclude password fields
        expect(mockQuery.select).toHaveBeenCalledWith(
          "-password -passwordConfirm",
        );

        // Check response doesn't contain password fields
        response.body.data.users.forEach((user: any) => {
          expect(user).not.toHaveProperty("password");
          expect(user).not.toHaveProperty("passwordConfirm");
        });
      });
    });

    describe("Pagination", () => {
      it("should handle pagination with default values", async () => {
        const mockUsers = Array.from({ length: 20 }, (_, i) => ({
          _id: `user${i + 1}`,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
        }));

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app).get("/api/v1/users").expect(200);

        // Verify default pagination: page 1, limit 20
        expect(mockQuery.skip).toHaveBeenCalledWith(0);
        expect(mockQuery.limit).toHaveBeenCalledWith(20);
        expect(response.body.results).toBe(20);
      });

      it("should handle custom page and limit", async () => {
        const mockUsers = Array.from({ length: 10 }, (_, i) => ({
          _id: `user${i + 21}`,
          name: `User ${i + 21}`,
          email: `user${i + 21}@example.com`,
        }));

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app)
          .get("/api/v1/users?page=3&limit=10")
          .expect(200);

        // Page 3 with limit 10 should skip 20 users
        expect(mockQuery.skip).toHaveBeenCalledWith(20);
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(response.body.results).toBe(10);
      });

      it("should handle invalid page numbers gracefully", async () => {
        const mockUsers = [
          { _id: "user1", name: "User 1", email: "user1@example.com" },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app)
          .get("/api/v1/users?page=0&limit=-5")
          .expect(200);

        // Invalid values should default to page 1, limit 20
        expect(mockQuery.skip).toHaveBeenCalledWith(0);
        expect(mockQuery.limit).toHaveBeenCalledWith(20);
      });
    });

    describe("Sorting", () => {
      it("should sort by createdAt in descending order by default", async () => {
        const mockUsers = [
          { _id: "user1", name: "User 1", email: "user1@example.com" },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        await request(app).get("/api/v1/users").expect(200);

        expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
      });

      it("should handle custom sorting", async () => {
        const mockUsers = [
          { _id: "user1", name: "User 1", email: "user1@example.com" },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        await request(app).get("/api/v1/users?sort=name,-email").expect(200);

        expect(mockQuery.sort).toHaveBeenCalledWith("name -email");
      });
    });

    describe("Field selection", () => {
      it("should handle custom field selection", async () => {
        const mockUsers = [
          { _id: "user1", name: "User 1", email: "user1@example.com" },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        await request(app).get("/api/v1/users?fields=name,email").expect(200);

        // Should include custom fields but always exclude passwords for security
        expect(mockQuery.select).toHaveBeenCalledWith(
          "name email -password -passwordConfirm",
        );
      });

      it("should exclude password fields even when not specified in fields", async () => {
        const mockUsers = [
          { _id: "user1", name: "User 1", email: "user1@example.com" },
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        await request(app)
          .get("/api/v1/users?fields=name,email,password")
          .expect(200);

        // Should still exclude password even if requested for security
        expect(mockQuery.select).toHaveBeenCalledWith(
          "name email password -password -passwordConfirm",
        );
      });
    });

    describe("Error handling", () => {
      it("should handle database errors gracefully", async () => {
        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest
            .fn()
            .mockRejectedValue(new Error("Database connection failed")),
        };

        mockUserModel.find.mockReturnValue(mockQuery as any);

        const response = await request(app).get("/api/v1/users").expect(500);

        expect(response.body.status).toBe("error");
        expect(response.body.message).toContain("Database connection failed");
      });
    });
  });

  describe("DELETE /api/v1/users/deleteMe - deleteUser", () => {
    beforeEach(() => {
      // Mock the protect middleware to add user to request
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123" };
          next();
        },
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
        .set("Authorization", "Bearer valid-jwt-token")
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
        },
      );

      const response = await request(app)
        .delete("/api/v1/users/deleteMe")
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("You are not logged in");
    });

    it("should handle database errors gracefully", async () => {
      mockUserModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .delete("/api/v1/users/deleteMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
    });

    it("should handle user not found", async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/v1/users/deleteMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .expect(204);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
        active: false,
      });
    });
  });

  describe("PATCH /api/v1/users/updateMe - updateUser", () => {
    beforeEach(() => {
      // Mock the protect middleware to add user to request
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { id: "user123" };
          next();
        },
      );
    });

    it("should update user name and email successfully", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const mockUpdatedUser = {
        _id: "user123",
        name: "Updated Name",
        email: "updated@example.com",
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(200);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { name: "Updated Name", email: "updated@example.com" },
        { new: true, runValidators: true },
      );

      expect(response.body).toEqual({
        status: "success",
        data: {
          user: mockUpdatedUser,
        },
      });
    });

    it("should reject password updates with 400 error", async () => {
      const updateData = {
        name: "Updated Name",
        password: "newpassword123",
      };

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "This route is not for password updates. Please use reset password feature.",
      );
    });

    it("should reject passwordConfirm updates with 400 error", async () => {
      const updateData = {
        name: "Updated Name",
        passwordConfirm: "newpassword123",
      };

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "This route is not for password updates. Please use reset password feature.",
      );
    });

    it("should filter out unwanted fields like role", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
        role: "admin",
        active: false,
      };

      const mockUpdatedUser = {
        _id: "user123",
        name: "Updated Name",
        email: "updated@example.com",
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(200);

      // Should only pass allowed fields (name, email) to update
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { name: "Updated Name", email: "updated@example.com" },
        { new: true, runValidators: true },
      );

      expect(response.body).toEqual({
        status: "success",
        data: {
          user: mockUpdatedUser,
        },
      });
    });

    it("should require authentication", async () => {
      // Mock protect to reject authentication
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access.",
          });
        },
      );

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .send({ name: "Updated Name" })
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toContain("You are not logged in");
    });

    it("should handle database errors gracefully", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      mockUserModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
    });

    it("should handle validation errors", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const validationError = new Error("Please provide a valid email");
      mockUserModel.findByIdAndUpdate.mockRejectedValue(validationError);

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please provide a valid email");
    });

    it("should allow updating only name", async () => {
      const updateData = {
        name: "Only Name Updated",
      };

      const mockUpdatedUser = {
        _id: "user123",
        name: "Only Name Updated",
        email: "original@example.com",
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(200);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { name: "Only Name Updated" },
        { new: true, runValidators: true },
      );

      expect(response.body.data.user.name).toBe("Only Name Updated");
    });

    it("should allow updating only email", async () => {
      const updateData = {
        email: "newemail@example.com",
      };

      const mockUpdatedUser = {
        _id: "user123",
        name: "Original Name",
        email: "newemail@example.com",
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch("/api/v1/users/updateMe")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(updateData)
        .expect(200);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        { email: "newemail@example.com" },
        { new: true, runValidators: true },
      );

      expect(response.body.data.user.email).toBe("newemail@example.com");
    });
  });

  describe("PATCH /api/v1/users/resetPassword/:token - resetPassword", () => {
    const validToken = "validresettoken123";
    const hashedToken = crypto
      .createHash("sha256")
      .update(validToken)
      .digest("hex");

    it("should reset password successfully with valid token", async () => {
      const resetData = {
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        password: "oldHashedPassword",
        passwordConfirm: undefined,
        save: jest.fn().mockResolvedValue(true),
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

      // Verify password was set and reset fields cleared
      expect(mockUser.password).toBe("newPassword123");
      expect(mockUser.passwordConfirm).toBe("newPassword123");
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

      // Verify response
      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
    });

    it("should return 400 for invalid token", async () => {
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

    it("should return 400 for expired token", async () => {
      const expiredToken = "expiredtoken123";
      const hashedExpiredToken = crypto
        .createHash("sha256")
        .update(expiredToken)
        .digest("hex");

      const resetData = {
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      // Mock user with expired token
      mockUserModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${expiredToken}`)
        .send(resetData)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Token is invalid or has expired");
    });

    it("should handle missing password field", async () => {
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

    it("should handle missing passwordConfirm field", async () => {
      const resetData = {
        password: "newPassword123",
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
          .mockRejectedValue(new Error("Please confirm a password")),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please confirm a password");
    });

    it("should handle password mismatch validation", async () => {
      const resetData = {
        password: "newPassword123",
        passwordConfirm: "differentPassword123",
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
          .mockRejectedValue(new Error("Passwords are not the same!")),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Passwords are not the same!");
    });

    it("should handle password too short validation", async () => {
      const resetData = {
        password: "123",
        passwordConfirm: "123",
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
          .mockRejectedValue(
            new Error("Password must be at least 8 characters long"),
          ),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "Password must be at least 8 characters long",
      );
    });

    it("should handle database errors gracefully", async () => {
      const resetData = {
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      mockUserModel.findOne.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
    });

    it("should clear reset token and expiry after successful reset", async () => {
      const resetData = {
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        password: undefined,
        passwordConfirm: undefined,
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(200);

      // Verify reset fields are cleared
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    });

    it("should return JWT token after successful password reset", async () => {
      const resetData = {
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        password: undefined,
        passwordConfirm: undefined,
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch(`/api/v1/users/resetPassword/${validToken}`)
        .send(resetData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");

      // JWT token should be a valid format (3 parts separated by dots)
      const tokenParts = response.body.token.split(".");
      expect(tokenParts).toHaveLength(3);
    });
  });

  describe("PATCH /api/v1/users/updateMyPassword - updatePassword", () => {
    beforeEach(() => {
      // Mock the protect middleware to add user to request
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = { _id: "user123" };
          next();
        },
      );
    });

    it("should update password successfully with correct current password", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        password: "hashedCurrentPassword",
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      // Mock user selection with password
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(200);

      // Verify the database query with password selection
      expect(mockUserModel.findById).toHaveBeenCalledWith("user123");
      expect(mockQuery.select).toHaveBeenCalledWith("+password");

      // Verify current password check
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        "currentPassword123",
        "hashedCurrentPassword",
      );

      // Verify new password was set
      expect(mockUser.password).toBe("newPassword123");
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
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Your current password is wrong.");
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        "wrongCurrentPassword",
        "hashedCurrentPassword",
      );
    });

    it("should require authentication", async () => {
      // Mock protect to reject authentication
      mockAuthController.protect.mockImplementation(
        (req: any, res: any, next: any) => {
          res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access.",
          });
        },
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

    it("should handle missing passwordCurrent field", async () => {
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
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Current password is required");
    });

    it("should handle missing new password field", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        password: "hashedCurrentPassword",
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest
          .fn()
          .mockRejectedValue(new Error("Please provide a password")),
      } as any;

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Please provide a password");
    });

    it("should handle password confirmation mismatch", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        password: "newPassword123",
        passwordConfirm: "differentPassword123",
      };

      const mockUser = {
        _id: "user123",
        password: "hashedCurrentPassword",
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest
          .fn()
          .mockRejectedValue(new Error("Passwords are not the same!")),
      } as any;

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Passwords are not the same!");
    });

    it("should handle password too short validation", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        password: "123",
        passwordConfirm: "123",
      };

      const mockUser = {
        _id: "user123",
        password: "hashedCurrentPassword",
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest
          .fn()
          .mockRejectedValue(
            new Error("Password must be at least 8 characters long"),
          ),
      } as any;

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "Password must be at least 8 characters long",
      );
    });

    it("should handle database errors gracefully", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockQuery = {
        select: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
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
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(500);

      expect(response.body.status).toBe("error");
    });

    it("should return JWT token and user data after successful password update", async () => {
      const passwordData = {
        passwordCurrent: "currentPassword123",
        password: "newPassword123",
        passwordConfirm: "newPassword123",
      };

      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "user@example.com",
        password: "hashedCurrentPassword",
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      mockUserModel.findById.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .patch("/api/v1/users/updateMyPassword")
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe("string");
      expect(response.body.data.user._id).toBe(mockUser._id);
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data.user.name).toBe(mockUser.name);

      // JWT token should be a valid format (3 parts separated by dots)
      const tokenParts = response.body.token.split(".");
      expect(tokenParts).toHaveLength(3);
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
        .set("Authorization", "Bearer valid-jwt-token")
        .send(passwordData)
        .expect(200);

      // Should call save without any options (default validation applies)
      expect(mockUser.save).toHaveBeenCalledWith();
    });
  });

  describe("POST /api/v1/users/forgotPassword - forgotPassword", () => {
    beforeEach(() => {
      mockSendEmail.mockClear();
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
      mockSendEmail.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(200);

      // Verify user lookup
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });

      // Verify reset token generation
      expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

      // Verify email sending
      expect(mockSendEmail).toHaveBeenCalledWith({
        email: "user@example.com",
        subject: "Your password reset token - valid for 10 min",
        message: expect.stringContaining("Forgot your password?"),
      });

      expect(mockSendEmail).toHaveBeenCalledWith({
        email: "user@example.com",
        subject: "Your password reset token - valid for 10 min",
        message: expect.stringContaining(resetToken),
      });

      // Verify response
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("Token send to email!");
    });

    it("should return 404 for non-existent email", async () => {
      const email = "nonexistent@example.com";

      mockUserModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(404);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "There is no user with email address.",
      );
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should handle missing email field", async () => {
      const response = await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({})
        .expect(404);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "There is no user with email address.",
      );
    });

    it("should handle email sending failure and cleanup reset token", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        passwordResetToken: "hashed-token",
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockSendEmail.mockRejectedValue(new Error("SMTP server error"));

      const response = await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(500);

      // Verify cleanup happened
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "There was an error sending the email. Try again later!",
      );
    });

    it("should generate correct reset URL", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockSendEmail.mockResolvedValue(undefined);

      await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(200);

      // Verify the reset URL format in the email message
      const emailCallArgs = mockSendEmail.mock.calls[0][0];
      expect(emailCallArgs.message).toMatch(
        /http:\/\/127\.0\.0\.1:\d+\/api\/v1\/users\/resetPassword\/abcd1234resettoken/,
      );
    });

    it("should handle database errors when finding user", async () => {
      const email = "user@example.com";

      mockUserModel.findOne.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Database connection failed");
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should handle database errors when saving reset token", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
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
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("should include correct email message content", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockSendEmail.mockResolvedValue(undefined);

      await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(200);

      const emailCallArgs = mockSendEmail.mock.calls[0][0];
      expect(emailCallArgs.message).toContain("Forgot your password?");
      expect(emailCallArgs.message).toContain("Submit a PATCH request");
      expect(emailCallArgs.message).toContain("password and confirm");
      expect(emailCallArgs.message).toContain(
        "If you didn't forget your password, please ignore this email!",
      );
    });

    it("should use correct email subject and recipient", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockSendEmail.mockResolvedValue(undefined);

      await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(200);

      expect(mockSendEmail).toHaveBeenCalledWith({
        email: "user@example.com",
        subject: "Your password reset token - valid for 10 min",
        message: expect.any(String),
      });
    });

    it("should call createPasswordResetToken and save user", async () => {
      const email = "user@example.com";
      const resetToken = "abcd1234resettoken";

      const mockUser = {
        _id: "user123",
        email: "user@example.com",
        createPasswordResetToken: jest.fn().mockReturnValue(resetToken),
        save: jest.fn().mockResolvedValue(true),
      } as any;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockSendEmail.mockResolvedValue(undefined);

      await request(app)
        .post("/api/v1/users/forgotPassword")
        .send({ email })
        .expect(200);

      expect(mockUser.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    });
  });
});
