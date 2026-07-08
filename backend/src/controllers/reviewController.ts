import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import { ReviewModel } from "../models/reviewModel";
import { start } from "repl";

const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const allReviews = await ReviewModel.find();

    res.status(200).json({
      status: "success",
      results: allReviews.length,
      data: { allReviews },
    });
  },
);

const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newReview = await ReviewModel.create(req.body);

    res.status(201).json({
      status: "success",
      data: { newReview },
    });
  },
);

export default {
  getAllReviews,
  createReview,
};
