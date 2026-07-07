import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import tourRouter from "./routes/tourRoutes";
import userRouter from "./routes/userRoutes";
import AppError from "./utils/appError";
import globalErrorHandler from "./utils/errorController";
import { globalLimiter } from "./middleware/rateLimiter";

export const createServer = () => {
  const app = express();

  // Global Middleware

  // Security HTTP headers (always apply for security)
  app.use(helmet());

  // Development loggin
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Apply global rate limiter to all API routes
  if (process.env.NODE_ENV !== "test") {
    app.use("/api", globalLimiter);
  }

  app.use("/api/v1/tours", tourRouter);
  app.use("/api/v1/users", userRouter);

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.all("*", (req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  app.use(globalErrorHandler);

  return app;
};
