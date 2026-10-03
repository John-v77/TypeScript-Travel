import { Schema, model, Document, Query, Types } from "mongoose";

/** One saved tour: a user and the tour they hearted. */
export interface Favorite extends Document {
  tour: Types.ObjectId;
  user: Types.ObjectId;
  createdAt?: Date;
}

const FavoriteSchema = new Schema<Favorite>(
  {
    tour: {
      type: Schema.ObjectId,
      ref: "Tour",
      required: [true, "A favourite must belong to a tour."],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "A favourite must belong to a user."],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// A user can save a tour only once.
FavoriteSchema.index({ user: 1, tour: 1 }, { unique: true });

// Every find returns the saved tour itself, so the list can render cards.
FavoriteSchema.pre(/^find/, function (this: Query<any, Favorite>, next) {
  this.populate({ path: "tour" });
  next();
});

export const FavoriteModel = model<Favorite>("Favorite", FavoriteSchema);
