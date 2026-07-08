import { Request, Response, NextFunction } from "express";
import { User, UserModel } from "../models/userModel";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import { promisify } from "util";
import crypto from "crypto";
import AppError from "../utils/appError";
import { filterObj } from "../utils";
import sendEmail from "../utils/email";

interface AuthenticatedRequest extends Request {
  user?: User;
}

const signToken = (id: string): string => {
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

  const cookieOptions = {
    maxAge:
      parseInt(process.env.JWT_COOKIE_EXPIRES_IN || "7") * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  (user as any).password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

const signup = catchAsync(
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

    createSendToken(newUser, 201, res);
  },
);

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res);
  },
);

const protect = catchAsync(
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

const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1) Get user based on POST email
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError("There is no user with email address.", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to the user's email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your password and confirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token - valid for 10 min",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Token send to email!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500,
        ),
      );
    }
  },
);

const resetPassword = catchAsync(
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
    createSendToken(user, 200, res);
  },
);

const updatePassword = catchAsync(
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
      return next(new AppError("Your current password is wrong.", 401));
    }
    // 3) If so, update password

    user!.password = req.body.password;
    user!.passwordConfirm = req.body.passwordConfirm;
    await user!.save();

    // 4) Log user in, send JWT
    createSendToken(user!, 200, res);
  },
);

export default {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
  signToken,
};
