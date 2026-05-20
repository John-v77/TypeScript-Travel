import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import tourRouter from "./routes/tourRoutes";

export const createServer = () => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(express.urlencoded({ extended: true }))
    .use(express.json())
    .use(cors({ origin: "http://localhost:3000" }));

  app.use("/api/v1/tours", tourRouter);

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  return app;
};
