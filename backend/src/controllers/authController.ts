import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { User, UserModel } from "../models/userModel";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

import AppError from "../utils/appError";
interface AuthenticatedRequest extends Request {
  user?: User;
}

export const signToken = (id: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET enviroment variable is required");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as SignOptions);
};

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

    const token = signToken((newUser._id as any).toString());

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    const token = signToken((user._id as any).toString());
    res.status(200).json({
      status: "success",
      token,
    });
  },
);
