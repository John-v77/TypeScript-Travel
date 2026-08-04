import request from "supertest";
import { createServer } from "../../server";
import authController from "../../controllers/authController";
import tourController from "../../controllers/tourController";

// authController/tourController's real export is `export default {...}`, so
// overrides must be nested under `default` (with __esModule: true) or TS's
// esModuleInterop default-import helper reads the real (unmocked) functions
// instead of these jest.fn() ones.
jest.mock("../../controllers/authController", () => {
  const actual = jest.requireActual("../../controllers/authController")
    .default;
  return {
    __esModule: true,
    default: {
      ...actual,
      protect: jest.fn((req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "admin" };
        next();
      }),
      restrictTo: jest.fn((...roles: string[]) => {
        return (req: any, res: any, next: any) => {
          if (req.user && roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({
              status: "fail",
              message: "You do not have permission to perform this action",
            });
          }
        };
      }),
    },
  };
});
jest.mock("../../controllers/tourController", () => {
  const actual = jest.requireActual("../../controllers/tourController")
    .default;
  return {
    __esModule: true,
    default: {
      ...actual,
      deleteTourPackage: jest.fn(),
    },
  };
});

const mockAuthController = authController as jest.Mocked<typeof authController>;
const mockTourController = tourController as jest.Mocked<typeof tourController>;

describe("DELETE /api/v1/tours/:id", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: admin user, deleteTourPackage succeeds. Individual tests
    // override protect/restrictTo/deleteTourPackage to exercise other roles
    // and outcomes.
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "admin" };
        next();
      },
    );
    mockAuthController.restrictTo.mockImplementation((...roles: string[]) => {
      return (req: any, res: any, next: any) => {
        if (roles.includes(req.user.role)) {
          next();
        } else {
          res.status(403).json({
            status: "fail",
            message: "You do not have permission to perform this action",
          });
        }
      };
    });
    mockTourController.deleteTourPackage.mockImplementation(
      (req: any, res: any) => {
        res.status(204).json();
      },
    );
  });

  it("should delete a tour package with admin role", async () => {
    await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer admin-token")
      .expect(204);
  });

  it("should delete a tour package with lead-guide role", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "lead-guide" };
        next();
      },
    );

    await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer lead-guide-token")
      .expect(204);
  });

  it("should deny access for user role", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "user" };
        next();
      },
    );

    const response = await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer user-token")
      .expect(403);

    expect(response.body).toEqual({
      status: "fail",
      message: "You do not have permission to perform this action",
    });
  });

  it("should deny access for guide role", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any, next: any) => {
        req.user = { id: "user123", role: "guide" };
        next();
      },
    );

    const response = await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer guide-token")
      .expect(403);

    expect(response.body).toEqual({
      status: "fail",
      message: "You do not have permission to perform this action",
    });
  });

  it("should require authentication", async () => {
    mockAuthController.protect.mockImplementation(
      (req: any, res: any) => {
        res.status(401).json({
          status: "fail",
          message: "You are not logged in! Please log in to get access.",
        });
      },
    );

    const response = await request(app)
      .delete("/api/v1/tours/123")
      .expect(401);

    expect(response.body.status).toBe("fail");
    expect(response.body.message).toContain("You are not logged in");
  });

  it("should return 404 for non-existent tour with proper authorization", async () => {
    mockTourController.deleteTourPackage.mockImplementation(
      (req: any, res: any) => {
        res.status(404).json({
          status: "fail",
          message: "Tour not found",
        });
      },
    );

    const response = await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer admin-token")
      .expect(404);

    expect(response.body).toEqual({
      status: "fail",
      message: "Tour not found",
    });
  });

  it("should handle database error with proper authorization", async () => {
    mockTourController.deleteTourPackage.mockImplementation(
      (req: any, res: any) => {
        res.status(500).json({
          status: "error",
          message: "Database error",
        });
      },
    );

    const response = await request(app)
      .delete("/api/v1/tours/123")
      .set("Authorization", "Bearer admin-token")
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Database error",
    });
  });
});
