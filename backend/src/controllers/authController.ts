import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { User, UserModel } from "../models/userModel";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

import AppError from "../utils/appError";
import { promisify } from "util";
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

export const protect = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // 1) Get token and check if it exists
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in!", 401));
    }

    // 2) Verify token
    const jwtVerify = promisify(jwt.verify) as (
      token: string,
      secret: string,
    ) => Promise<JwtPayload>;
    const decoded = await jwtVerify(token, process.env.JWT_SECRET!);
    // 3) Check if user still exists
    const freshUser = await UserModel.findById(decoded.id);
    if (!freshUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401),
      );
    }
    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat!)) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401,
        ),
      );
    }
    // Grant access to protected route
    req.user = freshUser;
    next();
  },
);
