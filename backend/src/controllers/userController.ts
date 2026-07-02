import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/userModel";
import { APIFeatures } from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    //Create base query
    let query = UserModel.find();

    //Apply sorting (defaul: most recent first)

    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //Apply pagination with proper validation
    const pageNum = parseInt(req.query.page as string) || 1;
    const limitNum = parseInt(req.query.limit as string) || 20;
    const page = Math.max(1, pageNum);
    const limit = limitNum > 0 ? limitNum : 20;
    const skip = (page - 1) * limit;

    //Build field selection string and always exclude password fields
    const fields = req.query.fields
      ? `${(req.query.fields as string).split(",").join(" ")} -password -passwordConfirm`
      : "-password -passwordConfirm";

    //Apply field selection and pagination, executing the query at the end
    query = query.select(fields).skip(skip);
    const users = await query.limit(limit);

    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  },
);

export const getUserById = (req: Request, res: Response): void => {
  console.log("Getting UserById");
  res.status(200).send("Get all users");
};

export const updateUser = (req: Request, res: Response): void => {
  console.log("updateUser");
  res.status(200).send("Get all users");
};

export const deleteUser = (req: Request, res: Response): void => {
  console.log("deleteUser");
  res.status(200).send("Get all users");
};
