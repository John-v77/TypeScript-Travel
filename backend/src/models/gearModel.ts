import { Schema, model, Document } from "mongoose";

// Mirrors the GearItem interface the frontend's Gear page and cartSlice
// already use, so the catalog can be swapped from its hardcoded array to
// this endpoint without reshaping anything client-side.
export const GEAR_CATEGORIES = [
  "jacket",
  "backpack",
  "skis",
  "goggles",
] as const;

export type GearCategory = (typeof GEAR_CATEGORIES)[number];

export interface Gear extends Document {
  name: string;
  price: number;
  image: string;
  description: string;
  category: GearCategory;
  createdAt?: Date;
}

const GearSchema = new Schema<Gear>(
  {
    name: {
      type: String,
      required: [true, "A gear item must have a name"],
      unique: true,
      trim: true,
      maxlength: [60, "A gear name must be 60 characters or fewer"],
    },
    price: {
      type: Number,
      required: [true, "A gear item must have a price"],
      min: [0, "Price must be a positive number"],
    },
    image: {
      type: String,
      required: [true, "A gear item must have an image"],
    },
    description: {
      type: String,
      required: [true, "A gear item must have a description"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "A gear item must have a category"],
      enum: {
        values: GEAR_CATEGORIES,
        message: `Category must be one of: ${GEAR_CATEGORIES.join(", ")}`,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
);

GearSchema.index({ category: 1, price: 1 });

export const GearModel = model<Gear>("Gear", GearSchema);
