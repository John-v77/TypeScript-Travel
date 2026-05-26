import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { User, UserModel } from "../models/userModel";

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, passwordConfirm, photo } = req.body;

    const newUser: User = await UserModel.create({
      name,
      email,
      password,
      passwordConfirm,
      photo,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  },
);
