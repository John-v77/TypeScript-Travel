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

describe("PATCH /api/v1/tours/:id", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a tour package", async () => {
    const tourId = "123";
    const updateData = {
      name: "Updated Tour Name",
      price: 399,
    };

    const mockUpdatedTour = { _id: tourId, ...updateData };
    mockTourModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedTour as any);

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      data: mockUpdatedTour,
    });
  });

  it("should return 404 for non-existent tour", async () => {
    const tourId = "123";

    mockTourModel.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .send({ name: "Updated" })
      .expect(404);

    expect(response.body).toEqual({
      status: "fail",
      message: "No document found with that ID",
    });
  });

  it("should handle database error", async () => {
    const tourId = "123";

    mockTourModel.findByIdAndUpdate.mockRejectedValue(
      new Error("Database error"),
    );

    const response = await request(app)
      .patch(`/api/v1/tours/${tourId}`)
      .send({ name: "Updated" })
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Database error",
    });
  });
});
