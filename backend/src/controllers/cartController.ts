import { Request, Response, NextFunction } from "express";
import { CartItemModel } from "../models/cartItemModel";
import { User } from "../models/userModel";
import handlerFactory from "../utils/handlerFactory";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

interface AuthenticatedRequest extends Request {
  user?: User;
}

// getAll filters by req.params.userId, so this limits it to the user's cart.
const setMyFilter = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.params.userId = req.user!.id;
  next();
};

// The owner always comes from the token, never from the body.
const setMyCartItem = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.body = {
    gear: req.body.gear,
    quantity: req.body.quantity,
    user: req.user!.id,
  };
  next();
};

// Only the quantity of a line can change - not its owner or its gear.
const setQuantityOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.body = { quantity: req.body.quantity };
  next();
};

const checkCartItemOwner = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const item = await CartItemModel.exists({
      _id: req.params.id,
      user: req.user!.id,
    });
    if (!item) {
      return next(new AppError("No cart item found with that ID", 404));
    }
    next();
  },
);

const getMyCart = handlerFactory.getAll(CartItemModel);
const addCartItem = handlerFactory.createOne(CartItemModel);
const updateCartItem = handlerFactory.updateOne(CartItemModel);
const deleteCartItem = handlerFactory.deleteOne(CartItemModel);

export default {
  setMyFilter,
  setMyCartItem,
  setQuantityOnly,
  checkCartItemOwner,
  getMyCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
};
