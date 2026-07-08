import { Schema, model, Document, Query } from "mongoose";

export interface Review extends Document {
  review: string;
  rating?: number;
  createdAt?: Date;
  tour: string;
  user: string;
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

export const ReviewModel = model<Review>("Review", ReviewSchema);
