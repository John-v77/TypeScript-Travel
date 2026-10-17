import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { TourModel } from "../models/tourModel";
import { BookingModel } from "../models/bookingModel";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import factory from "../utils/handlerFactory";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

let stripe: Stripe;

const frontendUrl = () =>
  (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/+$/, "");

/**
 * Atomically takes one seat on a departure. The filter includes
 * `participants < maxGroupSize`, so two requests racing for the last seat
 * cannot both succeed: the second matches nothing and gets null.
 */
const takeSeat = (
  tourId: string,
  selectedDate: string | Date,
  tourDate: { participants: number },
  maxGroupSize: number,
) =>
  TourModel.findOneAndUpdate(
    {
      _id: tourId,
      "startDates.date": new Date(selectedDate),
      "startDates.participants": { $lt: maxGroupSize },
    },
    {
      $inc: { "startDates.$.participants": 1 },
      $set: {
        "startDates.$.soldOut": tourDate.participants + 1 >= maxGroupSize,
      },
    },
    { new: true },
  );

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getCheckoutSession = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!stripe) stripe = getStripe();

    const { selectedDate } = req.body;
    // Defaults to one, so a request without it books a single place.
    const guests = Number(req.body.guests ?? 1);

    if (!selectedDate) {
      res.status(400).json({
        status: "fail",
        message: "Please select a tour date",
      });
      return;
    }

    if (!Number.isInteger(guests) || guests < 1) {
      return next(
        new AppError("Guests must be a whole number of at least 1.", 400),
      );
    }

    const tour = await TourModel.findById(req.params.tourId);

    if (!tour) {
      return next(new AppError("No tour found with that ID", 404));
    }

    const maxGroupSize = Number(tour.maxGroupSize);

    const tourDate = tour.startDates?.find(
      (d) => new Date(d.date).getTime() === new Date(selectedDate).getTime(),
    );

    if (!tourDate) {
      res.status(400).json({
        status: "fail",
        message: "Selected date is not available for this tour",
      });
      return;
    }

    if (tourDate.soldOut || tourDate.participants >= maxGroupSize) {
      res.status(400).json({
        status: "fail",
        message: "This tour date is sold out",
      });
      return;
    }

    const seatsLeft = maxGroupSize - tourDate.participants;
    if (guests > seatsLeft) {
      return next(
        new AppError(
          `Only ${String(seatsLeft)} places are left on this date.`,
          400,
        ),
      );
    }

    // 9% of the tour price per person
    const serviceFeePerGuest = Math.round(tour.price * 0.09);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      success_url: `${frontendUrl()}/myaccount/my-bookings?alert=booking`,
      // Back to the tour page, whose URL is the tour's slug.
      cancel_url: `${frontendUrl()}/tour/${String(tour.slug)}`,
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
              images: [`${frontendUrl()}/img/tours/${tour.imageCover}`],
            },
          },
          quantity: guests,
        },
        {
          price_data: {
            currency: "usd",
            unit_amount: serviceFeePerGuest * 100,
            product_data: { name: "Service fee" },
          },
          quantity: guests,
        },
      ],
      mode: "payment",
      metadata: {
        selectedDate: new Date(selectedDate).toISOString(),
        userId: String(req.user._id),
        guests: String(guests),
      },
    });

    res.status(200).json({
      status: "success",
      session,
    });
  },
);

export const getMyBookings = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const bookings = await BookingModel.find({ user: req.user?.id });

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: bookings,
    });
  },
);

export const createBooking = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { tour, user, price, selectedDate } = req.body;

    if (!selectedDate) {
      res.status(400).json({
        status: "fail",
        message: "Please select a tour date",
      });
      return;
    }

    const tourDoc = await TourModel.findById(tour);

    if (!tourDoc) {
      return next(new AppError("No tour found with that ID", 404));
    }

    const maxGroupSize = Number(tourDoc.maxGroupSize);

    const tourDate = tourDoc.startDates?.find(
      (d) => new Date(d.date).getTime() === new Date(selectedDate).getTime(),
    );

    if (!tourDate) {
      res.status(400).json({
        status: "fail",
        message: "Selected date is not available for this tour",
      });
      return;
    }

    if (tourDate.soldOut || tourDate.participants >= maxGroupSize) {
      res.status(400).json({
        status: "fail",
        message: "This tour date is sold out",
      });
      return;
    }

    // The seat is taken before the booking is written, so a full date can
    // never end up with a booking.
    const updatedTour = await takeSeat(
      tour,
      selectedDate,
      tourDate,
      maxGroupSize,
    );

    if (!updatedTour) {
      res.status(400).json({
        status: "fail",
        message: "Unable to book tour, please try again",
      });
      return;
    }

    const booking = await BookingModel.create({
      tour,
      user,
      price,
      selectedDate: new Date(selectedDate),
    });

    res.status(201).json({
      status: "success",
      data: booking,
    });
  },
);
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
