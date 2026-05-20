import { Request, Response } from "express";
import { Tour, TourModel } from "../models/tourModel";
import { start } from "repl";

export const getAllTours = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tours = await TourModel.find();

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
    const newTour = await TourModel.create(req.body);
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
    const tour = await TourModel.findById(id);

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

export const updateTourPackage = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
};

export const deleteTourPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const tour = await TourModel.findByIdAndDelete(id);

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
