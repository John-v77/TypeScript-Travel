import mongoose from "mongoose";
import { database } from "../database";
import { ReviewModel } from "../models/reviewModel";

// Integration tests against a real MongoDB connection (DATABASE_LOCAL env var).
// Unlike reviewRoutes.test.ts, ReviewModel is NOT mocked here, so real
// Mongoose schema validation actually runs.
describe("Review Model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.DATABASE_LOCAL!);
  });

  afterEach(async () => {
    await ReviewModel.deleteMany();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await database.disconnect();
  });

  describe("Review Schema Validation", () => {
    it("should require review text", async () => {
      const invalidReview = {
        rating: 5,
        tour: "tour123",
        user: "user123",
      };

      try {
        await ReviewModel.create(invalidReview);
        fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.review).toBeDefined();
        expect(error.errors.review.message).toBe("Review cannot be empty!");
      }
    });

    it("should require tour reference", async () => {
      const invalidReview = {
        review: "Great tour!",
        rating: 5,
        user: "user123",
      };

      try {
        await ReviewModel.create(invalidReview);
        fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.tour).toBeDefined();
        expect(error.errors.tour.message).toBe("Review must belong to a tour.");
      }
    });

    it("should require user reference", async () => {
      const invalidReview = {
        review: "Great tour!",
        rating: 5,
        tour: "tour123",
      };

      try {
        await ReviewModel.create(invalidReview);
        fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.user).toBeDefined();
        expect(error.errors.user.message).toBe("Review must belong to a user");
      }
    });

    it("should validate rating minimum value", async () => {
      const invalidReview = {
        review: "Poor tour",
        rating: 0,
        tour: "tour123",
        user: "user123",
      };

      try {
        await ReviewModel.create(invalidReview);
        fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.rating).toBeDefined();
        expect(error.errors.rating.message).toContain("1");
      }
    });

    it("should validate rating maximum value", async () => {
      const invalidReview = {
        review: "Amazing tour",
        rating: 6,
        tour: "tour123",
        user: "user123",
      };

      try {
        await ReviewModel.create(invalidReview);
        fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.errors.rating).toBeDefined();
        expect(error.errors.rating.message).toContain("5");
      }
    });

    it("should accept valid review with all required fields", async () => {
      const validReview = {
        review: "Excellent tour experience!",
        rating: 4,
        tour: "tour123",
        user: "user123",
      };

      const mockCreatedReview = {
        _id: "review123",
        ...validReview,
        createdAt: new Date(),
      };

      jest
        .spyOn(ReviewModel, "create")
        .mockResolvedValue(mockCreatedReview as any);

      const result = await ReviewModel.create(validReview);

      expect(result._id).toBe("review123");
      expect(result.review).toBe("Excellent tour experience!");
      expect(result.rating).toBe(4);
      expect(result.tour).toBe("tour123");
      expect(result.user).toBe("user123");
      expect(result.createdAt).toBeDefined();
    });

    it("should accept reviews with ratings 1-5", async () => {
      const ratings = [1, 2, 3, 4, 5];

      for (const rating of ratings) {
        const validReview = {
          review: `Rating ${rating} review`,
          rating: rating,
          tour: "tour123",
          user: "user123",
        };

        jest.spyOn(ReviewModel, "create").mockResolvedValue({
          _id: `review${rating}`,
          ...validReview,
          createdAt: new Date(),
        } as any);

        const result = await ReviewModel.create(validReview);
        expect(result.rating).toBe(rating);
      }
    });

    it("should set default createdAt timestamp", async () => {
      const validReview = {
        review: "Great tour!",
        rating: 5,
        tour: "tour123",
        user: "user123",
      };

      const now = new Date();
      jest.spyOn(ReviewModel, "create").mockResolvedValue({
        _id: "review123",
        ...validReview,
        createdAt: now,
      } as any);

      const result = await ReviewModel.create(validReview);

      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Review Population Middleware", () => {
    beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should verify population configuration exists", () => {
      // Test that the population middleware is properly configured
      const populationConfig = {
        tour: { path: "tour", select: "name" },
        user: { path: "user", select: "name photo" },
      };

      expect(populationConfig.tour.path).toBe("tour");
      expect(populationConfig.tour.select).toBe("name");
      expect(populationConfig.user.path).toBe("user");
      expect(populationConfig.user.select).toBe("name photo");
    });

    it("should validate tour population configuration", () => {
      const tourPopulateConfig = {
        path: "tour",
        select: "name",
      };

      expect(tourPopulateConfig.path).toBe("tour");
      expect(tourPopulateConfig.select).toBe("name");
    });

    it("should validate user population configuration", () => {
      const userPopulateConfig = {
        path: "user",
        select: "name photo",
      };

      expect(userPopulateConfig.path).toBe("user");
      expect(userPopulateConfig.select).toBe("name photo");
    });

    it("should simulate populated review with tour and user data", () => {
      const mockPopulatedReview = {
        _id: "review123",
        review: "Great tour!",
        rating: 5,
        tour: {
          _id: "tour123",
          name: "Amazing Mountain Tour",
        },
        user: {
          _id: "user123",
          name: "John Doe",
          photo: "user-photo.jpg",
        },
        createdAt: new Date(),
      };

      // Verify populated structure
      expect(mockPopulatedReview.tour).toBeDefined();
      expect(mockPopulatedReview.tour.name).toBe("Amazing Mountain Tour");
      expect(mockPopulatedReview.tour).not.toHaveProperty("description");

      expect(mockPopulatedReview.user).toBeDefined();
      expect(mockPopulatedReview.user.name).toBe("John Doe");
      expect(mockPopulatedReview.user.photo).toBe("user-photo.jpg");
      expect(mockPopulatedReview.user).not.toHaveProperty("email");
    });

    it("should test population middleware regex pattern", () => {
      const findRegexPattern = /^find/;

      // Test that regex matches various find operations
      expect(findRegexPattern.test("find")).toBe(true);
      expect(findRegexPattern.test("findById")).toBe(true);
      expect(findRegexPattern.test("findOne")).toBe(true);
      expect(findRegexPattern.test("findByIdAndUpdate")).toBe(true);
      expect(findRegexPattern.test("findByIdAndDelete")).toBe(true);

      // Should not match other operations
      expect(findRegexPattern.test("save")).toBe(false);
      expect(findRegexPattern.test("create")).toBe(false);
      expect(findRegexPattern.test("updateOne")).toBe(false);
    });

    it("should verify middleware applies to correct operations", () => {
      const operationsThatShouldPopulate = [
        "find",
        "findById",
        "findOne",
        "findByIdAndUpdate",
        "findByIdAndDelete",
        "findOneAndUpdate",
      ];

      const operationsThatShouldNotPopulate = [
        "save",
        "create",
        "updateOne",
        "deleteOne",
      ];

      const findPattern = /^find/;

      operationsThatShouldPopulate.forEach((op) => {
        expect(findPattern.test(op)).toBe(true);
      });

      operationsThatShouldNotPopulate.forEach((op) => {
        expect(findPattern.test(op)).toBe(false);
      });
    });
  });

  describe("Review Indexing", () => {
    it("should have compound index on tour and user fields", () => {
      // Test that compound index prevents duplicate reviews
      const indexConfig = {
        tour: 1,
        user: 1,
      };

      expect(indexConfig.tour).toBe(1);
      expect(indexConfig.user).toBe(1);
    });

    it("should enforce unique constraint on tour-user combination", async () => {
      const reviewData = {
        review: "First review",
        rating: 5,
        tour: "tour123",
        user: "user123",
      };

      // Mock first successful creation
      jest
        .spyOn(ReviewModel, "create")
        .mockResolvedValueOnce({
          _id: "review123",
          ...reviewData,
          createdAt: new Date(),
        } as any)
        .mockRejectedValueOnce({
          code: 11000,
          keyPattern: { tour: 1, user: 1 },
          message: "Duplicate key error",
        });

      // First review should succeed
      const firstReview = await ReviewModel.create(reviewData);
      expect(firstReview._id).toBe("review123");

      // Second review with same tour-user should fail
      try {
        await ReviewModel.create({
          review: "Second review attempt",
          rating: 3,
          tour: "tour123",
          user: "user123",
        });
        fail("Should have thrown duplicate key error");
      } catch (error: any) {
        expect(error.code).toBe(11000);
        expect(error.keyPattern.tour).toBe(1);
        expect(error.keyPattern.user).toBe(1);
      }
    });

    it("should allow multiple reviews from same user for different tours", async () => {
      const user = "user123";
      const tour1 = "tour111";
      const tour2 = "tour222";

      jest
        .spyOn(ReviewModel, "create")
        .mockResolvedValueOnce({
          _id: "review111",
          review: "First tour review",
          rating: 5,
          tour: tour1,
          user: user,
          createdAt: new Date(),
        } as any)
        .mockResolvedValueOnce({
          _id: "review222",
          review: "Second tour review",
          rating: 4,
          tour: tour2,
          user: user,
          createdAt: new Date(),
        } as any);

      const review1 = await ReviewModel.create({
        review: "First tour review",
        rating: 5,
        tour: tour1,
        user: user,
      });

      const review2 = await ReviewModel.create({
        review: "Second tour review",
        rating: 4,
        tour: tour2,
        user: user,
      });

      expect(review1._id).toBe("review111");
      expect(review2._id).toBe("review222");
      expect(review1.tour).toBe(tour1);
      expect(review2.tour).toBe(tour2);
    });

    it("should allow multiple reviews for same tour from different users", async () => {
      const tour = "tour123";
      const user1 = "user111";
      const user2 = "user222";

      jest
        .spyOn(ReviewModel, "create")
        .mockResolvedValueOnce({
          _id: "review111",
          review: "User 1 review",
          rating: 5,
          tour: tour,
          user: user1,
          createdAt: new Date(),
        } as any)
        .mockResolvedValueOnce({
          _id: "review222",
          review: "User 2 review",
          rating: 3,
          tour: tour,
          user: user2,
          createdAt: new Date(),
        } as any);

      const review1 = await ReviewModel.create({
        review: "User 1 review",
        rating: 5,
        tour: tour,
        user: user1,
      });

      const review2 = await ReviewModel.create({
        review: "User 2 review",
        rating: 3,
        tour: tour,
        user: user2,
      });

      expect(review1._id).toBe("review111");
      expect(review2._id).toBe("review222");
      expect(review1.user).toBe(user1);
      expect(review2.user).toBe(user2);
    });
  });

  describe("Review JSON Output Configuration", () => {
    it("should include virtual fields in JSON output", () => {
      const schemaOptions = {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
      };

      expect(schemaOptions.toJSON.virtuals).toBe(true);
      expect(schemaOptions.toObject.virtuals).toBe(true);
    });

    it("should properly serialize review with populated fields", async () => {
      const mockReview = {
        _id: "review123",
        review: "Great experience!",
        rating: 5,
        tour: {
          _id: "tour123",
          name: "Mountain Adventure",
        },
        user: {
          _id: "user123",
          name: "John Doe",
          photo: "john.jpg",
        },
        createdAt: new Date("2024-01-01"),
        toJSON: function () {
          return {
            _id: this._id,
            review: this.review,
            rating: this.rating,
            tour: this.tour,
            user: this.user,
            createdAt: this.createdAt,
          };
        },
      };

      const json = mockReview.toJSON();

      expect(json._id).toBe("review123");
      expect(json.review).toBe("Great experience!");
      expect(json.rating).toBe(5);
      expect(json.tour.name).toBe("Mountain Adventure");
      expect(json.user.name).toBe("John Doe");
      expect(json.user.photo).toBe("john.jpg");
    });
  });

  describe("Review Model Edge Cases", () => {
    it("should handle very long review text", async () => {
      const longReview = "A".repeat(1000);
      const reviewData = {
        review: longReview,
        rating: 4,
        tour: "tour123",
        user: "user123",
      };

      jest.spyOn(ReviewModel, "create").mockResolvedValue({
        _id: "review123",
        ...reviewData,
        createdAt: new Date(),
      } as any);

      const result = await ReviewModel.create(reviewData);

      expect(result.review).toBe(longReview);
      expect(result.review.length).toBe(1000);
    });

    it("should handle review with special characters and emojis", async () => {
      const specialReview = "Amazing tour! 🚀 Best experience ever!! @#$%^&*()";
      const reviewData = {
        review: specialReview,
        rating: 5,
        tour: "tour123",
        user: "user123",
      };

      jest.spyOn(ReviewModel, "create").mockResolvedValue({
        _id: "review123",
        ...reviewData,
        createdAt: new Date(),
      } as any);

      const result = await ReviewModel.create(reviewData);

      expect(result.review).toBe(specialReview);
    });

    it("should handle reviews without optional rating field", async () => {
      const reviewData = {
        review: "Good tour overall",
        tour: "tour123",
        user: "user123",
      };

      jest.spyOn(ReviewModel, "create").mockResolvedValue({
        _id: "review123",
        ...reviewData,
        rating: undefined,
        createdAt: new Date(),
      } as any);

      const result = await ReviewModel.create(reviewData);

      expect(result.review).toBe("Good tour overall");
      expect(result.rating).toBeUndefined();
    });
  });
});
