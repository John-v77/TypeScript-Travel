import { Request, Response, NextFunction } from "express";
import { Model, Document } from "mongoose";
import catchAsync from "./catchAsync";
import AppError from "./appError";

const createOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const newEntryDoc = await Model.create(req.body);

      res.status(201).json({
        status: "success",
        data: {
          data: newEntryDoc,
        },
      });
    },
  );

const deleteOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(204).json({
        status: "success",
        data: null,
      });
    },
  );

export default {
  deleteOne,
  createOne,
};
