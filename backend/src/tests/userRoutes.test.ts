import request from "supertest";
import { createServer } from "../server";
import { UserModel } from "../models/userModel";
import * as authController from "../controllers/authController";
jest.mock("../models/userModel");
jest.mock("../controllers/authController", () => ({
  ...jest.requireActual("../controllers/authController"),
  protect: jest.fn(),
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthController = authController as jest.Mocked<typeof authController>;

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
});
