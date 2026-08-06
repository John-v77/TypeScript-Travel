import request from "supertest";
import jwt from "jsonwebtoken";
import { createServer } from "../../server";
import { UserModel } from "../../models/userModel";
import "./testHelpers"; // sets JWT_SECRET etc.

// Unlike the other userRoutes.*.test.ts files, authController.protect is NOT
// mocked here — these tests exercise the real jwt verification path.
jest.mock("../../models/userModel");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe("authController.protect (real JWT verification)", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an expired JWT", async () => {
    // globalErrorHandler only maps raw jsonwebtoken errors to a friendly
    // 401 when NODE_ENV === "production" (see handleJWTExpiredError in
    // errorController.ts). Under NODE_ENV=test the raw TokenExpiredError
    // has no statusCode of its own, so it falls back to the generic 500
    // path instead of a 401 — documenting that gap here rather than the
    // 401 the code will eventually send in production.
    const expiredToken = jwt.sign({ id: "user123" }, process.env.JWT_SECRET!, {
      expiresIn: -10,
    });

    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(500);

    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(response.body.message).toContain("jwt expired");
  });

  it("rejects a malformed JWT", async () => {
    // Same NODE_ENV=test caveat as the expired-token case above.
    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .set("Authorization", "Bearer not.a.valid.token")
      .expect(500);

    expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(response.body.message).toContain("jwt malformed");
  });

  it("rejects when no token is provided", async () => {
    const response = await request(app)
      .delete("/api/v1/users/deleteMe")
      .expect(401);

    expect(response.body.message).toContain("You are not logged in");
  });

  it("allows a valid JWT for a user that still exists", async () => {
    const validToken = jwt.sign({ id: "user123" }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    mockUserModel.findById.mockResolvedValue({
      _id: "user123",
      id: "user123",
      changedPasswordAfter: jest.fn().mockReturnValue(false),
    } as any);
    mockUserModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      active: false,
    });

    await request(app)
      .delete("/api/v1/users/deleteMe")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(204);

    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith("user123", {
      active: false,
    });
  });
});
