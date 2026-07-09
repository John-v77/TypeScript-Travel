import { Request, Response, NextFunction } from "express";
import { Model, Document } from "mongoose";
import catchAsync from "./catchAsync";
import AppError from "./appError";
import { APIFeatures } from "./apiFeatures";

const getAll = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // To allow for nested GET reviews on tour (hack)
      let filter: any = {};
      if (req.params.tourId) {
        filter = { tour: req.params.tourId };
      }

      // Apply filter to the model then use APIFeatures
      const features = new APIFeatures(Model.find(filter), req.query);

      // Apply filter then use the other features
      features.filter().sort().limitFields().paginate();

      const docs = await features.query;

      res.status(200).json({
        status: "success",
        results: docs.length,
        data: { data: docs },
      });
    },
  );

const getOne = <T extends Document>(Model: Model<T>, popOptions?: any) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);
      const doc = await query;

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: { data: doc },
      });
    },
  );

const updateOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    },
  );

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
  updateOne,
  getOne,
  getAll,
};
