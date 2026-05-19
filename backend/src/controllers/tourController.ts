import { Request, Response } from "express";
import { Tour } from "../models/tourModel";

export const getAllTours = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
};

export const createTour = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Get all tours -dummy implementation",
  });
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
