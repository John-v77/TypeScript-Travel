import { Schema, model, Model, Document, Query } from "mongoose";

export interface Review extends Document {
  review: string;
  rating?: number;
  createdAt?: Date;
  tour: string;
  user: string;
}

export interface ReviewModel extends Model<Review> {
  calcAverageRatings(tourId: string): Promise<void>;
}

interface ReviewDocument extends Review {
  constructor: ReviewModel;
}

const ReviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      defaul: Date.now,
    },
    tour: {
      type: Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index to ensure one review per user per tour
ReviewSchema.index({ Tour: 1, user: 1 }, { unique: true });

// Populates middleware for all find operations
ReviewSchema.pre(/^find/, function (this: Query<any, Review>, next) {
  this.populate({
    path: "tour",
    select: "name",
  }).populate({
    path: "user",
    select: "name photo",
  });
  next();
});

// Static method to calculate average ratings
ReviewSchema.statics.calcAverageRatings = async function (tourId: string) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    // Import here to avoid circular dependency
    const { TourModel } = await import("./tourModel.ts");
    await TourModel.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingAverate: stats[0].avgRating,
    });
  } else {
    // Import here to avoid circular dependency
    const { TourModel } = await import("./tourModel.ts");
    await TourModel.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingsAverage: 4.5,
    });
  }

  // Middleware to calculate ratings after saving a new review
  ReviewSchema.post("save", function (this: ReviewDocument) {
    // this points to current review
    (this.constructor as ReviewModel).calcAverageRatings(this.tour);
  });
};

// Middleware for findOneAndUpdate and findOneAndDelete operations
ReviewSchema.pre(/^findOneAnd/, async function (next) {
  const query = this as any;
  query.reviewDoc = await query.model.findOne(query.getQuery()).clone();
  next();
});

ReviewSchema.post(/^findOneAnd/, async function () {
  const query = this as any;
  // this.reviewDoc is the document that was found in the pre middleware
  if (query.reviewDoc) {
    await (query.reviewDoc.constructor as ReviewModel).calcAverageRatings(
      query.reviewDoc.tour,
    );
  }
});

export const ReviewModel = model<Review, ReviewModel>(
  "Review",
  ReviewSchema,
) as ReviewModel;
