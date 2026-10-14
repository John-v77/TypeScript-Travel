import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { GearModel } from "../models/gearModel";
import { GearOrderModel } from "../models/gearOrderModel";
import { User } from "../models/userModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import factory from "../utils/handlerFactory";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

let stripe: Stripe;

interface AuthenticatedRequest extends Request {
  user?: User;
}

const frontendUrl = () =>
  (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/+$/, "");

interface RequestedItem {
  id: string;
  quantity: number;
}

export const getAllGear = factory.getAll(GearModel);
export const getGear = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idOrSlug = String(req.params.id);
    const gear = /^[0-9a-f]{24}$/i.test(idOrSlug)
      ? await GearModel.findById(idOrSlug)
      : await GearModel.findOne({ slug: idOrSlug });

    if (!gear) {
      return next(new AppError("No gear found with that ID or slug", 404));
    }

    res.status(200).json({
      status: "success",
      data: gear,
    });
  },
);

// Admin-only
export const createGear = factory.createOne(GearModel);
export const updateGear = factory.updateOne(GearModel);
export const deleteGear = factory.deleteOne(GearModel);

export const getCheckoutSession = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!stripe) stripe = getStripe();

    const { items } = req.body as { items?: RequestedItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return next(new AppError("Your cart is empty.", 400));
    }

    // Collapse duplicate ids and validate quantities before touching the DB.
    const requested = new Map<string, number>();
    for (const item of items) {
      const quantity = Number(item?.quantity);

      if (!item?.id) {
        return next(new AppError("Every cart item must have an id.", 400));
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return next(
          new AppError(
            `Quantity for item ${item.id} must be a whole number of at least 1.`,
            400,
          ),
        );
      }

      requested.set(item.id, (requested.get(item.id) ?? 0) + quantity);
    }

    const ids = [...requested.keys()];
    const gearItems = await GearModel.find({ _id: { $in: ids } });

    if (gearItems.length !== ids.length) {
      const found = new Set(gearItems.map((gear) => gear.id as string));
      const missing = ids.filter((id) => !found.has(id));
      return next(
        new AppError(`No gear found with id(s): ${missing.join(", ")}`, 404),
      );
    }

    const orderItems = gearItems.map((gear) => ({
      gear: gear._id as any,
      name: gear.name,
      price: gear.price,
      image: gear.image,
      quantity: requested.get(gear.id as string)!,
    }));

    // Rounded to cents, so floating point never leaves a stray fraction.
    const totalPrice =
      Math.round(
        orderItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ) * 100,
      ) / 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${frontendUrl()}/myaccount/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/cart`,
      customer_email: req.user!.email,
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            images: [`${frontendUrl()}${item.image}`],
          },
        },
        quantity: item.quantity,
      })),
    });

    // Recorded up front as unpaid so the payment can be matched back to a
    // real order afterwards; confirmOrder is what flips `paid`.
    const order = await GearOrderModel.create({
      user: req.user!._id,
      items: orderItems,
      totalPrice,
      stripeSessionId: session.id,
      paid: false,
    });

    res.status(200).json({
      status: "success",
      session,
      data: order,
    });
  },
);

// Called by the frontend on return from Stripe with the session id from the
// success_url. The paid flag is taken from Stripe's own record of the
// session, not from the client saying so.
export const confirmOrder = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!stripe) stripe = getStripe();

    const sessionId = String(req.params.sessionId);

    const order = await GearOrderModel.findOne({
      stripeSessionId: sessionId,
    });

    if (!order) {
      return next(new AppError("No order found for that session.", 404));
    }

    // Don't let one user confirm - or read - another user's order.
    if (order.user.toString() !== String(req.user!._id)) {
      return next(
        new AppError("You do not have permission to access this order.", 403),
      );
    }

    if (order.paid) {
      res.status(200).json({ status: "success", data: order });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return next(new AppError("This order has not been paid for yet.", 402));
    }

    order.paid = true;
    order.paidAt = new Date();
    await order.save();

    res.status(200).json({
      status: "success",
      data: order,
    });
  },
);

// Past orders for the logged-in user. Unpaid orders are abandoned checkouts -
// a session was created but never completed - so they are left out.
export const getMyOrders = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const orders = await GearOrderModel.find({
      user: req.user!._id,
      paid: true,
    }).sort("-createdAt");

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders,
    });
  },
);

export const getAllOrders = factory.getAll(GearOrderModel);

export default {
  getAllGear,
  getGear,
  createGear,
  updateGear,
  deleteGear,
  getCheckoutSession,
  confirmOrder,
  getMyOrders,
  getAllOrders,
};
