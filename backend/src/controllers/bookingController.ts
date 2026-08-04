import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { TourModel } from "../models/tourModel";
import { BookingModel } from "../models/bookingModel";
import catchAsync from "../utils/catchAsync";
import factory from "../utils/handlerFactory";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

let stripe: Stripe;

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getCheckoutSession = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!stripe) stripe = getStripe();

    const tour = await TourModel.findById(req.params.tourId);

    if (!tour) {
      throw new Error("Tour not found");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
      cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
      customer_email: req.user.email as string,
      client_reference_id: req.params.tourId as string,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
                `${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`,
              ],
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
    });

    res.status(200).json({
      status: "success",
      session,
    });
  }
);

export const getMyBookings = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const bookings = await BookingModel.find({ user: req.user?.id });

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: bookings,
    });
  }
);

export const createBooking = factory.createOne(BookingModel);
export const getBooking = factory.getOne(BookingModel);
export const getAllBookings = factory.getAll(BookingModel);
export const updateBooking = factory.updateOne(BookingModel);
export const deleteBooking = factory.deleteOne(BookingModel);

export default {
  getCheckoutSession,
  getMyBookings,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
};
