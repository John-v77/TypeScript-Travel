import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";

jest.mock("../../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

describe("GET /api/v1/tours/:id", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get a tour by ID", async () => {
    const tourId = "123";
    const mockTour = { _id: tourId, name: "Test Tour", price: 299 };

    // handlerFactory.getOne calls .populate(popOptions) on the findById query
    // (getTourById passes a guides popOptions), so the mock must be a chainable
    // object, not a plain resolved value, or the real code 500s on
    // "query.populate is not a function".
    mockTourModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockTour),
    } as any);

    const response = await request(app)
      .get(`/api/v1/tours/${tourId}`)
      .expect(200);

    expect(response.body).toEqual({
      status: "success",
      data: mockTour,
    });
  });

  it("should return 404 for non-existent tour", async () => {
    const tourId = "123";

    mockTourModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    } as any);

    const response = await request(app)
      .get(`/api/v1/tours/${tourId}`)
      .expect(404);

    expect(response.body).toEqual({
      status: "fail",
      message: "No document found with that ID",
    });
  });

  it("should handle database error", async () => {
    const tourId = "123";

    mockTourModel.findById.mockReturnValue({
      populate: jest.fn().mockRejectedValue(new Error("Database error")),
    } as any);

    const response = await request(app)
      .get(`/api/v1/tours/${tourId}`)
      .expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Database error",
    });
  });
});
