import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import tourRouter from "./routes/tourRoutes";
import userRouter from "./routes/userRoutes";
import AppError from "./utils/appError";
import globalErrorHandler from "./utils/errorController";

export const createServer = () => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(express.urlencoded({ extended: true }))
    .use(express.json())
    .use(cors({ origin: "http://localhost:3000" }));

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
