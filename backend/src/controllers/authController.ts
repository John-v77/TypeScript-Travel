import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { User, UserModel } from "../models/userModel";
import jwt, { SignOptions } from "jsonwebtoken";

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
