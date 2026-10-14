import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";

jest.mock("../../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

const tourId = "5c88fa8cf4afda39709c2955";
const tour = {
  _id: tourId,
  name: "The Sea Explorer",
  slug: "the-sea-explorer",
};

/**
 * GET /api/v1/tours/:idOrSlug - one route for both. A 24-character hex value
 * is a MongoDB id; anything else is a slug ("the-sea-explorer"). Either way
 * the tour comes back with its guides populated.
 */
describe("GET /api/v1/tours/:idOrSlug", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("by id", () => {
    it("returns the tour", async () => {
      mockTourModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(tour),
      } as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(200);

      expect(mockTourModel.findById).toHaveBeenCalledWith(tourId);
      expect(mockTourModel.findOne).not.toHaveBeenCalled();
      expect(response.body).toEqual({ status: "success", data: tour });
    });

    it("returns 404 for a tour that does not exist", async () => {
      mockTourModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app)
        .get(`/api/v1/tours/${tourId}`)
        .expect(404);

      expect(response.body).toEqual({
        status: "fail",
        message: "No tour found with that ID or slug",
      });
    });

    it("handles a database error", async () => {
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

  describe("by slug", () => {
    it("returns the tour with its guides", async () => {
      const populate = jest.fn().mockResolvedValue(tour);
      mockTourModel.findOne.mockReturnValue({ populate } as any);

      const response = await request(app)
        .get("/api/v1/tours/the-sea-explorer")
        .expect(200);

      expect(mockTourModel.findOne).toHaveBeenCalledWith({
        slug: "the-sea-explorer",
      });
      expect(mockTourModel.findById).not.toHaveBeenCalled();
      expect(populate).toHaveBeenCalledWith(
        expect.objectContaining({ path: "guides" }),
      );
      expect(response.body).toEqual({ status: "success", data: tour });
    });

    it("returns 404 when no tour has that slug", async () => {
      mockTourModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app)
        .get("/api/v1/tours/no-such-tour")
        .expect(404);

      expect(response.body.message).toBe("No tour found with that ID or slug");
    });

    it("looks up an operator in the slug only as a plain string", async () => {
      mockTourModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await request(app).get('/api/v1/tours/{"$ne":null}').expect(404);

      expect(mockTourModel.findOne).toHaveBeenCalledWith({
        slug: '{"$ne":null}',
      });
    });

    it("has no separate /slug/ route", async () => {
      mockTourModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await request(app).get("/api/v1/tours/slug/the-sea-explorer").expect(404);
    });
  });
});
