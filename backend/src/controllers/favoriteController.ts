import { Request, Response, NextFunction } from "express";
import { FavoriteModel } from "../models/favoriteModel";
import { User } from "../models/userModel";
import handlerFactory from "../utils/handlerFactory";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

interface AuthenticatedRequest extends Request {
  user?: User;
}

const setMyFilter = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.params.userId = req.user!.id;
  next();
};

const setMyFavorite = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.body = { tour: req.body.tour, user: req.user!.id };
  next();
};

const checkFavoriteOwner = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const favorite = await FavoriteModel.findOne({
      _id: req.params.id,
      user: req.user!.id,
    });
    if (!favorite) {
      return next(new AppError("No favourite found with that ID", 404));
    }
    next();
  },
);

const getAllFavorites = handlerFactory.getAll(FavoriteModel);
const createFavorite = handlerFactory.createOne(FavoriteModel);
const deleteFavorite = handlerFactory.deleteOne(FavoriteModel);

export default {
  setMyFilter,
  setMyFavorite,
  checkFavoriteOwner,
  getAllFavorites,
  createFavorite,
  deleteFavorite,
};
