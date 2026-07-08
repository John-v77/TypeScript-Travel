import { NextFunction, Request, Response } from "express";
import { Tour, TourModel } from "../models/tourModel";
import { APIFeatures } from "../utils/apiFeatures";

import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import handlerFactory from "../utils/handlerFactory";

const aliasTopTours = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.query.limit = "5";
    req.query.sort = "-ratingAverage,price";
    req.query.fields = "name,price,ratingAverage,summary,difficulty";
    next();
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to set top tours parameters",
    });
  }
};

const getAllTours = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check for page validation if page parameter is provided
    if (req.query.page) {
      const page: number = parseInt(req.query.page as string) || 1;
      const limitNo: number = parseInt(req.query.limit as string) || 20;
      const skipNo: number = (page - 1) * limitNo;
      const numTours: number = await TourModel.countDocuments();
      if (skipNo >= numTours) {
        return next(new AppError("This page does not exist", 400));
      }
    }

    const features = new APIFeatures<Tour>(TourModel, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours: Tour[] = await features.query;

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { tours },
    });
  },
);

const getTourById = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tour: Tour | null = await TourModel.findById(id as string);

    if (!tour) {
      return next(new AppError("Tour not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: { tour },
    });
  },
);

const updateTourPackage = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tour: Tour | null = await TourModel.findByIdAndUpdate(
      id as string,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!tour) {
      return next(new AppError("Tour not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  },
);

interface TourStats {
  _id: string;
  num: number;
  numRatings: number;
  avgRating: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats: TourStats[] = await TourModel.aggregate([
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          num: { $sum: 1 },
          numRatings: { $sum: "$ratingQuantity" },
          avgRating: { $avg: "$ratingAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $sort: { avgPrice: 1 } },
      { $match: { _id: { $ne: "EASY" } } },
    ]);
    res.status(200).json({
      status: "success",
      data: { stats },
    });
  },
);

interface MonthlyPlan {
  month: number;
  numToursStarts: number;
  tours: string[];
}

const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const year: number =
      parseInt(req.params.year as string, 10) || new Date().getFullYear();

    const plan: MonthlyPlan[] = await TourModel.aggregate([
      { $unwind: "$startDates" },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      { $addFields: { month: "$_id" } },
      {
        $project: {
          _id: 0,
        },
      },
      { $sort: { numTourStarts: -1 } },
      { $limit: 6 },
    ]);
    res.status(200).json({
      status: "success",
      data: { plan },
    });
  },
);

const createTour = handlerFactory.createOne(TourModel);
const deleteTourPackage = handlerFactory.deleteOne(TourModel);

export default {
  aliasTopTours,
  getAllTours,
  getTourById,
  createTour,
  updateTourPackage,
  deleteTourPackage,
  getTourStats,
  getMonthlyPlan,
};
