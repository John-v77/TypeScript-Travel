import { Request, Response, NextFunction } from "express";
import AppError from "./appError";

const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  //Only log in development/production, not during testing
  if (process.env.NODE_ENV !== "test") {
    console.log(err.stack);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export default globalErrorHandler;
