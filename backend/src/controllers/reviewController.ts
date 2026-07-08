import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { ReviewModel } from "../models/reviewModel";
import handlerFactory from "../utils/handlerFactory";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};

    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const allReviews = await ReviewModel.find(filter);

    res.status(200).json({
      status: "success",
      results: allReviews.length,
      data: { allReviews },
    });
  },
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

const createReview = handlerFactory.createOne(ReviewModel);
const deleteReview = handlerFactory.deleteOne(ReviewModel);

export default {
  getAllReviews,
  createReview,
  deleteReview,
  setTourUserIds,
};
