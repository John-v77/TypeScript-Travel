import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";

export const createServer = () => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(cors({ origin: "http://localhost:3000" }))
    .use(express.json())
    .use(morgan("dev"))
    .use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  return app;
};
