import { Schema, model, Document, Types } from "mongoose";

export interface GearOrderItem {
  gear: Types.ObjectId;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface GearOrder extends Document {
  user: Types.ObjectId;
  items: GearOrderItem[];
  totalPrice: number;
  stripeSessionId: string;
  paid: boolean;
  createdAt: Date;
  paidAt?: Date;
}

const gearOrderItemSchema = new Schema<GearOrderItem>(
  {
    gear: {
      type: Schema.Types.ObjectId,
      ref: "Gear",
      required: [true, "An order item must reference a gear item."],
    },
    name: {
      type: String,
      required: [true, "An order item must have a name."],
    },
    price: {
      type: Number,
      required: [true, "An order item must have a price."],
    },
    image: {
      type: String,
      required: [true, "An order item must have an image."],
    },
    quantity: {
      type: Number,
      required: [true, "An order item must have a quantity."],
      min: [1, "Quantity must be at least 1."],
    },
  },
  { _id: false },
);

const gearOrderSchema = new Schema<GearOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "An order must belong to a user."],
  },
  items: {
    type: [gearOrderItemSchema],
    validate: {
      validator: (items: GearOrderItem[]) => items.length > 0,
      message: "An order must contain at least one item.",
    },
  },

  totalPrice: {
    type: Number,
    required: [true, "An order must have a total price."],
    min: [0, "Total price must be a positive number."],
  },
  stripeSessionId: {
    type: String,
    required: [true, "An order must reference a Stripe session."],
    unique: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: Date,
});

gearOrderSchema.index({ user: 1, createdAt: -1 });

export const GearOrderModel = model<GearOrder>("GearOrder", gearOrderSchema);
