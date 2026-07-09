import { Request, Response, NextFunction } from "express";
import { User, UserModel } from "../models/userModel";
import { APIFeatures } from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { filterObj } from "../utils";
import handlerFactory from "../utils/handlerFactory";

interface AuthenticatedRequest extends Request {
  user?: User;
}

const getAllUsers = handlerFactory.getAll(UserModel);
const getUserById = handlerFactory.getOne(UserModel);

// Admin only user creation
const createUser = handlerFactory.createOne(UserModel);

const updateUser = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Creates an error if the POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use reset password feature.",
          400,
        ),
      );
    }

    // Filters out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email");

    const updateUser = await UserModel.findByIdAndUpdate(
      req.user!.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updateUser,
      },
    });
  },
);

const deleteUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await UserModel.findByIdAndUpdate(req.user!.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);

// Middleware to set user ID for "me" routes
const getMe = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  req.params.id = req.user?.id;
  next();
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  createUser,
  deleteUser,
  getMe,
};
