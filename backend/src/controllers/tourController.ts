import { NextFunction, Request, Response } from "express";
import { TourModel } from "../models/tourModel";

import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";

import catchAsync from "../utils/catchAsync";
import handlerFactory from "../utils/handlerFactory";
import AppError from "../utils/appError";

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

interface TourImageFiles {
  imageCover?: Express.Multer.File[];
  images?: Express.Multer.File[];
}

const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const files = req.files as TourImageFiles | undefined;

    if (!files?.imageCover || !files?.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];

    await Promise.all(
      files.images.map(async (file: Express.Multer.File, i: number) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      }),
    );

    next();
  },
);

const aliasTopTours = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,-price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
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

const getToursStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats: TourStats[] = await TourModel.aggregate([
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          num: { $sum: 1 },
          numRatings: { $sum: "$ratingQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
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

const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = (latlng as string).split(",");

    const radius =
      unit === "mi" ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    if (!lat || !lng) {
      return next(
        new AppError(
          "Please provide latitude and longitude in the format lat, lng.",
          400,
        ),
      );
    }

    const tours = await TourModel.find({
      startLocation: {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] },
      },
    });

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { data: tours },
    });
  },
);

const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { latlng, unit } = req.params;
    const [lat, lng] = (latlng as string).split(",");

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      return next(
        new AppError(
          "Please provide latitude and longitude in the format lat, lng.",
          400,
        ),
      );
    }

    const distances = await TourModel.aggregate([
      {
        // need to be first on aggretation
        // & it needs an index (TourSchema.index({ startLocation: 2dsphere" });)
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: { data: distances },
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
  getToursStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
};
