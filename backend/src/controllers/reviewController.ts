import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { ReviewModel } from "../models/reviewModel";
import handlerFactory from "../utils/handlerFactory";

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

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Allow nested routes to set tourId automatically
    if (!req.body.tour && req.params.tourId) {
      req.body.tour = req.params.tourId;
    }

    const newReview = await ReviewModel.create(req.body);

    res.status(201).json({
      status: "success",
      data: { newReview },
    });
  },
);

const deleteReview = handlerFactory.deleteOne(ReviewModel);

export default {
  getAllReviews,
  createReview,
  deleteReview,
};
