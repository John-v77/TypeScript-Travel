import { Schema, model, Document } from "mongoose";
import slugify from "slugify";
// Defines a TypeScript interface for type safety
export interface Tour extends Document {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: string;
  difficulty: string;
  ratingAverage?: number;
  ratingQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  createdAt?: Date;
  startDates?: Date[];
  secretTour?: boolean;
  durationWeeks?: number;
}

// Creates the Mongoose schema using generics
const TourSchema = new Schema<Tour>(
  {
    name: {
      type: String,
      required: [true, "Add a name for Tours"],
      unique: true,
    },
    slug: String,
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
    ratingAverage: {
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
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val: number) {
          if (val == undefined || val === null) return true;
          const allowedDiscounts = [3, 5, 8, 10, 11, 15, 20, 25, 30, 35, 40];
          return allowedDiscounts.includes(val);
        },
        message:
          "Price discount must be one of the following values: 3%, 5%, 8%, 10%, 11%, 15%, 20%, 25%, 30%, 35%, 40%",
      },
    },
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
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

TourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

TourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

TourSchema.pre(/^find/, function (next) {
  (this as any).find({ secretTour: { $ne: true } });
  (this as any).start = Date.now();
  next();
});

TourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - (this as any).start} milliseconds!`);
  console.log(docs);
  next();
});
export const TourModel = model<Tour>("Tour", TourSchema);
