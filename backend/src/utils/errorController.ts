import { Request, Response, NextFunction } from "express";
import AppError from "./appError";

const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsBD = (err: any): AppError => {
  const value = Object.values(err.keyValue ?? {})[0] ?? "value";
  const message = `Duplicate field value: ${String(value)}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => {
  return new AppError("Invalid token. Please log in again!", 401);
};

const handleJWTExpiredError = (): AppError => {
  return new AppError("Your token has expired! Please log in again.", 401);
};

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or other unknown error: don't leak error details
  } else {
    // log error
    console.error("Error *", err);

    // send generic error
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  //Only log in development/production, not during testing
  if (process.env.NODE_ENV !== "test") {
    console.log(err.stack);
    console.log(process.env.NODE_ENV, "environment");
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
    return;
  }

  // Known database and token errors become clear 4xx responses. Read from
  // `err` itself: `name` and `message` are not own enumerable properties, so a
  // `{ ...err }` copy would lose them and every one of these would be a 500.
  const anyErr = err as any;
  let error: AppError = err;
  if (anyErr.name === "CastError") error = handleCastErrorDB(err);
  else if (anyErr.code === 11000) error = handleDuplicateFieldsBD(err);
  else if (anyErr.name === "ValidationError")
    error = handleValidationErrorDB(err);
  else if (anyErr.name === "JsonWebTokenError") error = handleJWTError();
  else if (anyErr.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (process.env.NODE_ENV === "production") {
    sendErrorProd(error, res);
  } else {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
};

export default globalErrorHandler;
