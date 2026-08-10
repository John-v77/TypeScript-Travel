import { Schema, model, Document } from "mongoose";
import slugify from "slugify";
import validator from "validator";

// Defines a TypeScript interface for type safety
export interface TourDate {
  date: Date;
  participants: number;
  soldOut: boolean;
}

export interface Tour extends Document {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: string;
  difficulty: string;
  ratingsAverage?: number;
  ratingQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  createdAt?: Date;
  startDates?: TourDate[];
  secretTour?: boolean;
  durationWeeks?: number;
  guides?: string[];
  startLocation?: {
    type: string;
    coordinates: number[];
    address?: string;
    description?: string;
  };
}

// Creates the Mongoose schema using generics
const TourSchema = new Schema<Tour>(
  {
    name: {
      type: String,
      required: [true, "Add a name for Tours"],
      unique: true,
      maxlength: [40, "A tour name must have less or equal then 40 characters"],
      minlength: [10, "A tour name must at least 10 characters"],
      validate: {
        validator: function (strName: string) {
          return validator.isAlpha(strName, "en-US", { ignore: " " });
        },
        message: "Tour name must only contain characters and spaces",
      },
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
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val: number): number => Math.round(val * 100) / 100,
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
    startDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        participants: {
          type: Number,
          default: 0,
        },
        soldOut: {
          type: Boolean,
          default: false,
        },
      },
    ],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
    guides: [
      {
        type: Schema.ObjectId,
        ref: "User",
      },
    ],
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
  },
  {
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        const { _id, __v, name, ...rest } = ret;
        return {
          id: ret.id,
          name,
          ...rest
        };
      }
    },
    toObject: { virtuals: true },
  },
);

TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });
TourSchema.index({ startLocation: "2dsphere" });

// Virtual fields - cannot query agains them.
TourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Important!
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
TourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

TourSchema.pre(/^find/, function (next) {
  (this as any).find({ secretTour: { $ne: true } });
  (this as any).start = Date.now();
  next();
});

TourSchema.pre(/^find/, function (next) {
  console.log("populating");
  (this as any).populate({
    path: "guides",
    select: "-__v -active",
  });
  next();
});

TourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - (this as any).start} milliseconds!`);
  console.log(docs);
  next();
});

TourSchema.pre("aggregate", function (next) {
  const firstStage = (this as any).pipeline()?.[0];
  if (!firstStage?.$geoNear) {
    (this as any).pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log((this as any).pipeline());
  }
  next();
});

export { TourSchema };
export const TourModel = model<Tour>("Tour", TourSchema);
