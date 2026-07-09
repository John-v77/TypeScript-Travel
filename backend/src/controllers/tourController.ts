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
const updateTourPackage = handlerFactory.updateOne(TourModel);
const getAllTours = handlerFactory.getAll(TourModel);
const getTourById = handlerFactory.getOne(TourModel, {
  path: "guides",
  select: "-__v -passwordChangedAt",
});

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
