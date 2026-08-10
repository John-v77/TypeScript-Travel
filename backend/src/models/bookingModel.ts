import { Schema, model, Document, Types } from 'mongoose';

export interface Booking extends Document {
  tour: Types.ObjectId;
  user: Types.ObjectId;
  price: number;
  createdAt: Date;
  paid: boolean;
  selectedDate: Date;
}

const bookingSchema = new Schema<Booking>({
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid: {
    type: Boolean,
    default: true,
  },
  selectedDate: {
    type: Date,
    required: [true, 'Booking must have a selected tour date.'],
  },
});

bookingSchema.pre(/^find/, function (this: any, next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

export const BookingModel = model<Booking>('Booking', bookingSchema);
