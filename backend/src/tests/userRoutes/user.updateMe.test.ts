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

describe("PATCH /api/v1/users/updateMe - updateUser", () => {
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
      .set(authHeader)
      .send(updateData)
      .expect(200);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { name: "Updated Name", email: "updated@example.com" },
      { new: true, runValidators: true }
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
      .set(authHeader)
      .send(updateData)
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe(
      "This route is not for password updates. Please use reset password feature."
    );
  });

  it("should reject passwordConfirm updates with 400 error", async () => {
    const updateData = {
      name: "Updated Name",
      passwordConfirm: "newpassword123",
    };

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send(updateData)
      .expect(400);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe(
      "This route is not for password updates. Please use reset password feature."
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
      .set(authHeader)
      .send(updateData)
      .expect(200);

    // Should only pass allowed fields (name, email) to update
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { name: "Updated Name", email: "updated@example.com" },
      { new: true, runValidators: true }
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
      }
    );

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .send({ name: "Updated Name" })
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toContain("You are not logged in");
  });

  it("should return 500 when the update fails (validation or database error)", async () => {
    const updateData = {
      name: "Updated Name",
      email: "updated@example.com",
    };

    mockUserModel.findByIdAndUpdate.mockRejectedValue(
      new Error("Database connection failed")
    );

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send(updateData)
      .expect(500);

    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Database connection failed");
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
      .set(authHeader)
      .send(updateData)
      .expect(200);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { name: "Only Name Updated" },
      { new: true, runValidators: true }
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
      .set(authHeader)
      .send(updateData)
      .expect(200);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      { email: "newemail@example.com" },
      { new: true, runValidators: true }
    );

    expect(response.body.data.user.email).toBe("newemail@example.com");
  });

  it("should treat an empty body as a no-op update", async () => {
    const mockUpdatedUser = { _id: "user123", name: "Original Name" };
    mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send({})
      .expect(200);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {},
      { new: true, runValidators: true }
    );
    expect(response.body.data.user).toEqual(mockUpdatedUser);
  });

  it("should treat a body of only disallowed fields as a no-op update", async () => {
    const mockUpdatedUser = { _id: "user123", name: "Original Name" };
    mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send({ role: "admin", active: false })
      .expect(200);

    // role/active are filtered out and no allowed field was supplied, so
    // findByIdAndUpdate is called with an empty update payload rather than
    // being skipped.
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {},
      { new: true, runValidators: true }
    );
    expect(response.body.data.user).toEqual(mockUpdatedUser);
  });

  it("returns a null user when findByIdAndUpdate can't find the record, without erroring", async () => {
    // updateUser doesn't check for a null result, so a stale/missing user
    // id currently produces a 200 with data.user: null rather than a 404.
    mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .patch("/api/v1/users/updateMe")
      .set(authHeader)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      data: { user: null },
    });
  });
});
