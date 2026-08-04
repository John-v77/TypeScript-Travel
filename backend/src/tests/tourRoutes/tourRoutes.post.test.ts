import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";

jest.mock("../../models/tourModel");

// authController's real export is `export default {...}`, so overrides must
// be nested under `default` (with __esModule: true) or TS's esModuleInterop
// default-import helper reads the real (unmocked) functions instead of
// these jest.fn() ones.
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

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

describe("POST /api/v1/tours", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new tour", async () => {
    const tourData = {
      name: "Test Tour",
      price: 299,
    };

    const mockCreatedTour = { _id: "123", ...tourData };
    mockTourModel.create.mockResolvedValue(mockCreatedTour as any);

    const response = await request(app)
      .post("/api/v1/tours")
      .send(tourData)
      .expect(201);

    expect(response.body).toEqual({
      status: "success",
      data: mockCreatedTour,
    });
  });

  it("should handle validation error", async () => {
    mockTourModel.create.mockRejectedValue(new Error("Validation error"));

    const response = await request(app)
      .post("/api/v1/tours")
      .send({})
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Validation error",
    });
  });
});
