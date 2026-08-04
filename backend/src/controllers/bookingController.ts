import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { TourModel } from "../models/tourModel";
import catchAsync from "../utils/catchAsync";

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

const getCheckoutSession = catchAsync(
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

export default {
  getCheckoutSession,
};
