import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { ReviewModel } from "../models/reviewModel";
import handlerFactory from "../utils/handlerFactory";
import { factory } from "typescript";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

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
};
