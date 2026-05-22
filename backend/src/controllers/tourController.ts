import { Request, Response } from "express";
import { Tour, TourModel } from "../models/tourModel";
import { Query } from "mongoose";

export const getAllTours = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // const tours = await TourModel.find();

    const queryObj: Record<string, any> = { ...req.query };
    const excludedFields: string[] = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el: string) => delete queryObj[el]);

    let queryStr: string = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query: Query<Tour[], Tour> = TourModel.find(JSON.parse(queryStr));

    //Sorting
    if (req.query.sort) {
      const sortBy: string = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    if (req.query.fields) {
      const fields: string = (req.query.fields as string).split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    const tours: Tour[] = await query;

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
