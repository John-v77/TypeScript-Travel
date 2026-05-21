import { Schema, model, Document } from "mongoose";

// Defines a TypeScript interface for type safety
export interface Tour extends Document {
  name: string;
  duration: number;
  maxGroupSize: string;
  difficulty: string;
  ratingAverate?: number;
  ratingQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  createdAt?: Date;
  startDates?: Date[];
}

// Creates the Mongoose schema using generics
const TourSchema = new Schema<Tour>({
  name: {
    type: String,
    required: [true, "Add a name for Tours"],
    unique: true,
  },
  duration: {
    type: Number,
    required: [true, "A tour must have a duration"],
  },
  maxGroupSize: {
    type: String,
    required: [true, "A tour must have a group size"],
  },
  difficulty: {
    type: String,
    required: [true, "A tour must have a difficulty"],
  },
  ratingAverate: {
    type: Number,
    default: 4.5,
  },
  ratingQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, "Add price for your package"],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, "A tour must have a description"],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, "A tour must have a cover image"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startDates: [Date],
});

export const TourModel = model<Tour>("Tour", TourSchema);
