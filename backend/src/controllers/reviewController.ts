import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { ReviewModel } from "../models/reviewModel";
import handlerFactory from "../utils/handlerFactory";
import { factory } from "typescript";
import { BookingModel } from "../models/bookingModel";
import AppError from "../utils/appError";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

const checkIfBooked = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const tourId = req.body.tour || req.params.tourId;
    const userId = req.user?.id;

    const booking = await BookingModel.findOne({
      tour: tourId,
      user: userId,
    });

    if (!booking) {
      return next(
        new AppError("You can only review tours you have booked", 403)
      );
    }

    next();
  }
);

const setTourUserIds = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  //Allow nested routes
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user?.id;
  }
  next();
};

const getAllReviews = handlerFactory.getAll(ReviewModel);
const createReview = handlerFactory.createOne(ReviewModel);
const deleteReview = handlerFactory.deleteOne(ReviewModel);
const getReviewById = handlerFactory.getOne(ReviewModel);
const updateReview = handlerFactory.updateOne(ReviewModel);

export default {
  getAllReviews,
  createReview,
  deleteReview,
  setTourUserIds,
  getReviewById,
  updateReview,
  checkIfBooked,
};
