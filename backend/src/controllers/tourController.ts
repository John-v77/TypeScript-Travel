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

export const getTourById = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
};

export const updateTourPackage = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
};

export const deleteTourPackage = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
};
