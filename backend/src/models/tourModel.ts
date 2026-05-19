import { Schema, model, Document } from "mongoose";

// Defines a TypeScript interface for type safety
export interface Tour extends Document {
  name: string;
  rating?: number;
  price: number;
}

// Creates the Mongoose schema using generics
const TourSchema = new Schema<Tour>({
  name: {
    type: String,
    required: [true, "Add a name for Tours"],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, "Add price for your package"],
  },
});

export const TourModel = model<Tour>("Tour", TourSchema);
