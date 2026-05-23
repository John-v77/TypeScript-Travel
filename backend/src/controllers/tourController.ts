import { NextFunction, Request, Response } from "express";
import { Tour, TourModel } from "../models/tourModel";
import { APIFeatures } from "../utils/apiFeatures";

export const aliasTopTours = (
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

export const getAllTours = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (req.query.page) {
      const page: number = parseInt(req.query.page as string) || 1;
      const limitNo: number = parseInt(req.query.limit as string) || 20;
      const skipNo: number = (page - 1) * limitNo;
      const numTours: number = await TourModel.countDocuments();
      if (skipNo >= numTours) {
        res.status(400).json({
          status: "error",
          message: "This page does not exist",
        });
        return;
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
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch tours",
    });
  }
};

export const createTour = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const newTour: Tour = await TourModel.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to create tour",
    });
  }
};

export const getTourById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const tour: Tour | null = await TourModel.findById(id as string);

    if (!tour) {
      res.status(404).json({
        status: "error",
        message: "Tour not found",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      data: { tour },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch tour",
    });
  }
};

export const updateTourPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
      res.status(404).json({
        status: "error",
        message: "Tour not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to update tour",
    });
  }
};

export const deleteTourPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const tour: Tour | null = await TourModel.findByIdAndDelete(id);

    if (!tour) {
      res.status(404).json({
        status: "error",
        message: "Tour not found",
      });
      return;
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete tour",
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

export const getTourStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to get tour statistics",
    });
  }
};

interface MonthlyPlan {
  month: number;
  numToursStarts: number;
  tours: string[];
}

export const getMonthlyPlan = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to get monthly plan",
    });
  }
};
