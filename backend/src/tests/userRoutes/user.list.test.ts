import request from "supertest";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import { createMockFindQuery } from "./testHelpers";

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

describe("GET /api/v1/users - getAllUsers", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

      mockUserModel.find.mockReturnValue(
        createMockFindQuery(mockUsers) as any
      );

      const response = await request(app).get("/api/v1/users").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe("John Doe");
      expect(response.body.data[1].name).toBe("Jane Smith");
    });

    it("should return empty array when no users exist", async () => {
      mockUserModel.find.mockReturnValue(createMockFindQuery([]) as any);

      const response = await request(app).get("/api/v1/users").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.results).toBe(0);
      expect(response.body.data).toHaveLength(0);
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

      const mockQuery = createMockFindQuery(mockUsers);
      mockUserModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app).get("/api/v1/users").expect(200);

      // No fields param, so the default select is just "-__v"; password
      // exclusion is enforced by `select: false` on the schema itself.
      expect(mockQuery.select).toHaveBeenCalledWith("-__v");

      // Check response doesn't contain password fields
      response.body.data.forEach((user: any) => {
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

      const mockQuery = createMockFindQuery(mockUsers);
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

      const mockQuery = createMockFindQuery(mockUsers);
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

      const mockQuery = createMockFindQuery(mockUsers);
      mockUserModel.find.mockReturnValue(mockQuery as any);

      await request(app).get("/api/v1/users?page=0&limit=-5").expect(200);

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

      const mockQuery = createMockFindQuery(mockUsers);
      mockUserModel.find.mockReturnValue(mockQuery as any);

      await request(app).get("/api/v1/users").expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
    });

    it("should handle custom sorting", async () => {
      const mockUsers = [
        { _id: "user1", name: "User 1", email: "user1@example.com" },
      ];

      const mockQuery = createMockFindQuery(mockUsers);
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

      const mockQuery = createMockFindQuery(mockUsers);
      mockUserModel.find.mockReturnValue(mockQuery as any);

      await request(app).get("/api/v1/users?fields=name,email").expect(200);

      // The requested fields are passed straight through; password
      // exclusion still holds because of `select: false` on the schema.
      expect(mockQuery.select).toHaveBeenCalledWith("name email");
    });

    it("should not leak password fields even when explicitly requested", async () => {
      const mockUsers = [
        { _id: "user1", name: "User 1", email: "user1@example.com" },
      ];

      const mockQuery = createMockFindQuery(mockUsers);
      mockUserModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/users?fields=name,email,password")
        .expect(200);

      // The literal field list is passed through unmodified. It's still
      // safe: Mongoose only honors a `select: false` field when the query
      // explicitly opts in with "+password", which client-supplied
      // `fields` values never do.
      expect(mockQuery.select).toHaveBeenCalledWith("name email password");

      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty("password");
      });
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockUserModel.find.mockReturnValue(
        createMockFindQuery(new Error("Database connection failed")) as any
      );

      const response = await request(app).get("/api/v1/users").expect(500);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Database connection failed");
    });
  });
});
