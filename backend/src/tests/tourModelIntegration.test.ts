import mongoose from "mongoose";
import { database } from "../database";
import { TourModel } from "../models/tourModel";
import { UserModel } from "../models/userModel";

// Integration tests against a real MongoDB connection (DATABASE_LOCAL env var).
// Unlike tourRoutes.test.ts, TourModel/UserModel are NOT mocked here, so
// schema middleware (slug generation, secretTour filtering, populate,
// query logging) actually runs.
describe("Tour model middleware (integration)", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_LOCAL!);
  });

  afterEach(async () => {
    await TourModel.deleteMany();
    await UserModel.deleteMany();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  it("should populate the guides field when finding tours", async () => {
    const guide = await UserModel.create({
      name: "John Doe",
      email: "john@test.com",
      password: "password123",
      passwordConfirm: "password123",
    });

    const tour = await TourModel.create({
      name: "Amazing Forest Tour",
      duration: 10,
      maxGroupSize: "8",
      difficulty: "easy",
      price: 299,
      summary: "Great tour",
      imageCover: "cover.jpg",
      guides: [guide._id],
    });

    const result = await TourModel.findById(tour._id);

    expect(result).not.toBeNull();
    expect(result!.guides).toHaveLength(1);
  });

  it("should exclude secret tours", async () => {
    await TourModel.create({
      name: "Visible Tour",
      duration: 5,
      maxGroupSize: "10",
      difficulty: "easy",
      price: 100,
      summary: "summary",
      imageCover: "cover.jpg",
    });

    await TourModel.create({
      name: "Hidden Secret Tour",
      duration: 5,
      maxGroupSize: "10",
      difficulty: "easy",
      price: 100,
      summary: "summary",
      imageCover: "cover.jpg",
      secretTour: true,
    });

    const tours = await TourModel.find();

    expect(tours).toHaveLength(1);
    expect(tours[0].name).toBe("Visible Tour");
  });

  it("should generate a slug before saving", async () => {
    const tour = await TourModel.create({
      name: "Amazing Forest Adventure",
      duration: 10,
      maxGroupSize: "5",
      difficulty: "easy",
      price: 250,
      summary: "summary",
      imageCover: "cover.jpg",
    });

    expect(tour.slug).toBe("amazing-forest-adventure");
  });

  it("should calculate durationWeeks", async () => {
    const tour = new TourModel({
      name: "Amazing Forest Adventure",
      duration: 14,
      maxGroupSize: "5",
      difficulty: "easy",
      price: 250,
      summary: "summary",
      imageCover: "cover.jpg",
    });

    expect(tour.durationWeeks).toBe(2);
  });

  it("should exclude secret tours from aggregate", async () => {
    await TourModel.create({
      name: "Visible Tour",
      duration: 5,
      maxGroupSize: "5",
      difficulty: "easy",
      price: 200,
      summary: "summary",
      imageCover: "cover.jpg",
    });

    await TourModel.create({
      name: "Secret Tour",
      duration: 5,
      maxGroupSize: "5",
      difficulty: "easy",
      price: 200,
      summary: "summary",
      imageCover: "cover.jpg",
      secretTour: true,
    });

    const tours = await TourModel.aggregate([{ $match: {} }]);

    expect(tours).toHaveLength(1);
    expect(tours[0].name).toBe("Visible Tour");
  });

  it("should log query execution time", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    await TourModel.find();

    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/^Query took \d+ milliseconds!$/),
    );

    spy.mockRestore();
  });

  it("should log when populate middleware executes", async () => {
    const spy = jest.spyOn(console, "log").mockImplementation();

    await TourModel.find();

    expect(spy).toHaveBeenCalledWith("populating");

    spy.mockRestore();
  });
});
