import { Schema, model, Document, Types, Query } from "mongoose";

/** One line in a user's cart - like a favourite, each line is its own document. */
export interface CartItem extends Document {
  user: Types.ObjectId;
  gear: Types.ObjectId;
  quantity: number;
}

const cartItemSchema = new Schema<CartItem>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "A cart item must belong to a user."],
  },
  gear: {
    type: Schema.Types.ObjectId,
    ref: "Gear",
    required: [true, "A cart item must reference a gear item."],
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, "Quantity must be at least 1."],
  },
});

// One line per gear item per user: adding it again is a quantity change.
cartItemSchema.index({ user: 1, gear: 1 }, { unique: true });

cartItemSchema.pre(/^find/, function (this: Query<any, CartItem>, next) {
  this.populate({ path: "gear" });
  next();
});

export const CartItemModel = model<CartItem>("CartItem", cartItemSchema);
