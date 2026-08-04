import request from "supertest";
import { createServer } from "../../server";
import { TourModel } from "../../models/tourModel";
import { createMockQuery } from "./testHelpers";

jest.mock("../../models/tourModel");

const mockTourModel = TourModel as jest.Mocked<typeof TourModel>;

describe("GET /api/v1/tours", () => {
  const app = createServer();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should apply default sort/fields/pagination and return all tours", async () => {
    const mockTours = [
      { _id: "1", name: "Tour 1", price: 299 },
      { _id: "2", name: "Tour 2", price: 399 },
    ];

    const mockQuery = createMockQuery(mockTours);
    mockTourModel.find.mockReturnValue(mockQuery as any);

    const response = await request(app).get("/api/v1/tours").expect(200);

    expect(mockQuery.sort).toHaveBeenCalledWith("-createdAt");
    expect(mockQuery.select).toHaveBeenCalledWith("-__v");
    expect(mockQuery.skip).toHaveBeenCalledWith(0);
    expect(mockQuery.limit).toHaveBeenCalledWith(20);
    expect(response.body).toEqual({
      status: "success",
      results: 2,
      data: mockTours,
    });
  });

  describe("sorting", () => {
    it("should sort tours by price ascending", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should sort tours by price descending", async () => {
      const mockTours = [
        { _id: "2", name: "Tour 2", price: 399 },
        { _id: "1", name: "Tour 1", price: 299 },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=-price")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should sort tours by multiple fields", async () => {
      const mockTours = [
        { _id: "1", name: "Tour A", price: 299, difficulty: "easy" },
        { _id: "2", name: "Tour B", price: 299, difficulty: "medium" },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=price,difficulty")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("price difficulty");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should sort tours by name ascending", async () => {
      const mockTours = [
        { _id: "1", name: "A Tour", price: 299 },
        { _id: "2", name: "B Tour", price: 399 },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?sort=name")
        .expect(200);

      expect(mockQuery.sort).toHaveBeenCalledWith("name");
      expect(response.body.data).toEqual(mockTours);
    });
  });

  describe("filtering", () => {
    it("should handle filtering with sorting", async () => {
      const mockTours = [
        { _id: "1", name: "Easy Tour", price: 299, difficulty: "easy" },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(response.body).toEqual({
        status: "success",
        results: 1,
        data: mockTours,
      });
    });

    it("should handle advanced filtering (comparison operators) with sorting", async () => {
      const mockTours = [{ _id: "1", name: "Expensive Tour", price: 500 }];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?price[gte]=400&sort=-price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ price: { $gte: "400" } });
      expect(mockQuery.sort).toHaveBeenCalledWith("-price");
      expect(response.body.data).toEqual(mockTours);
    });
  });

  describe("field limiting", () => {
    it("should select only the requested fields", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", price: 299 },
        { _id: "2", name: "Tour 2", price: 399 },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=name,price")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should select a single requested field", async () => {
      const mockTours = [{ name: "Tour 1" }, { name: "Tour 2" }];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=name")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("name");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should exclude specific fields using minus prefix", async () => {
      const mockTours = [
        { _id: "1", name: "Tour 1", difficulty: "easy" },
        { _id: "2", name: "Tour 2", difficulty: "medium" },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?fields=-price,-summary")
        .expect(200);

      expect(mockQuery.select).toHaveBeenCalledWith("-price -summary");
      expect(response.body.data).toEqual(mockTours);
    });

    it("should combine field limiting with sorting and filtering", async () => {
      const mockTours = [{ _id: "1", name: "Easy Tour", price: 299 }];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?difficulty=easy&sort=price&fields=name,price")
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(response.body.data).toEqual(mockTours);
    });
  });

  describe("pagination", () => {
    it("should apply custom page/limit", async () => {
      const mockTours = [
        { _id: "3", name: "Tour 3", price: 499 },
        { _id: "4", name: "Tour 4", price: 599 },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=2&limit=5")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body.data).toEqual(mockTours);
    });

    it("should compute skip from page * limit for later pages", async () => {
      const mockTours = [{ _id: "11", name: "Tour 11", price: 799 }];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=3&limit=10")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(response.body.data).toEqual(mockTours);
    });

    it("should return an empty list for a page beyond the available results", async () => {
      // No page-bounds validation is implemented: paginate() just skips/limits
      // the query, so a page past the end of the data returns an empty array
      // rather than a 400.
      const mockQuery = createMockQuery([]);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=5&limit=10")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(40);
      expect(response.body).toEqual({
        status: "success",
        results: 0,
        data: [],
      });
    });

    it("should combine pagination with filtering, sorting, and field limiting", async () => {
      const mockTours = [
        { _id: "1", name: "Easy Tour 1", price: 299, difficulty: "easy" },
      ];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get(
          "/api/v1/tours?difficulty=easy&sort=price&fields=name,price&page=1&limit=5",
        )
        .expect(200);

      expect(mockQuery.where).toHaveBeenCalledWith({ difficulty: "easy" });
      expect(mockQuery.sort).toHaveBeenCalledWith("price");
      expect(mockQuery.select).toHaveBeenCalledWith("name price");
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(response.body.data).toEqual(mockTours);
    });

    it("should fall back to default page/limit when parameters are non-numeric", async () => {
      const mockTours = [{ _id: "1", name: "Tour 1", price: 299 }];
      const mockQuery = createMockQuery(mockTours);
      mockTourModel.find.mockReturnValue(mockQuery as any);

      const response = await request(app)
        .get("/api/v1/tours?page=abc&limit=xyz")
        .expect(200);

      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(response.body.data).toEqual(mockTours);
    });
  });

  it("should handle database error", async () => {
    const mockQuery = createMockQuery(new Error("Database error"));
    mockTourModel.find.mockReturnValue(mockQuery as any);

    const response = await request(app).get("/api/v1/tours").expect(500);

    expect(response.body).toEqual({
      status: "error",
      message: "Database error",
    });
  });
});
