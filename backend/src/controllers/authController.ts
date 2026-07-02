import { Request, Response, NextFunction } from "express";
import { User, UserModel } from "../models/userModel";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import { promisify } from "util";
import crypto from "crypto";
import AppError from "../utils/appError";
import { filterObj } from "../utils";

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

const createSendToken = (
  user: User,
  statusCode: number,
  res: Response,
): void => {
  const token = signToken((user._id as any).toString());

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, passwordConfirm, photo, role } = req.body;

    const newUser: User = await UserModel.create({
      name,
      email,
      password,
      passwordConfirm,
      photo,
      role,
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

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

export const deleteUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await UserModel.findByIdAndUpdate(req.user!.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  },
);

export const updateUser = catchAsync(
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

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1)Get user based on token

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token as string)
      .digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // 3) Update changePasswordAt property for the user(done in middleware)*
    // 4) Log the user in, send JWT
    const token = signToken((user._id as any).toString());
    res.status(200).json({
      status: "success",
      token,
    });
  },
);

export const updatePassword = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // 1) Get user from collection
    const user = await UserModel.findById(req.user!._id).select("+password");
    // 2) Check if POSTed current password is correct
    if (
      !(await user!.correctPassword(req.body.passwordCurrent, user!.password))
    ) {
      return next(new AppError("Your current password is wrong", 401));
    }
    // 3) If so, update password

    user!.password = req.body.password;
    user!.passwordConfirm = req.body.passwordConfirm;
    await user!.save();

    // 4) Log user in, send JWT
    createSendToken(user!, 200, res);
  },
);
