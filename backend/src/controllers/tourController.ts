import { NextFunction, Request, Response } from "express";
import { Tour, TourModel } from "../models/tourModel";
import { Query } from "mongoose";
import { APIFeatures } from "../utils/apiFeatures";
import { skip } from "node:test";

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
